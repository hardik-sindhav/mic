import { z } from 'zod'
import mongoose from 'mongoose'
import { findUserByIdentifier, registerUser, getLoginResponse } from '../services/user.service.js'
import { User } from '../models/User.js'

const signUpSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().email().optional(),
  guestId: z.string().trim().optional(),
  deviceId: z.string().trim().min(1),
  image: z.string().trim().optional().default(''),
  imageUrl: z.string().trim().url().or(z.literal('')).optional().default(''),
  referCode: z.string().trim().optional(), // The code of the user who referred this one
  country: z.string().trim().max(10).optional(),
  fcmToken: z.string().trim().optional(),
})

const signInSchema = z.object({
  identifier: z.string().trim().min(1), // Email OR Device ID
})

/**
 * Handles user sign in (Google or Device ID check).
 */
export async function postSignIn(req, res, next) {
  try {
    const parsed = signInSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Identifier is required', code: 'VALIDATION_ERROR' })
    }

    const user = await findUserByIdentifier(parsed.data.identifier)
    if (!user) {
      return res.status(404).json({ 
        error: 'No account exist', 
        code: 'ACCOUNT_NOT_FOUND',
        message: 'No user found with this email or device ID. Please register.'
      })
    }

    if (user.isBlocked) {
      return res.status(403).json({
        error: 'Account blocked',
        code: 'ACCOUNT_BLOCKED',
        message: user.blockReason || 'Your account has been suspended. Please contact support.'
      })
    }

    // Account found, return tokens
    const response = getLoginResponse(user)
    return res.status(200).json(response)
  } catch (e) {
    next(e)
  }
}

/** Admin: List all users */
export async function getUsersAdmin(_req, res, next) {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean()
    return res.status(200).json({ items: users })
  } catch (e) {
    next(e)
  }
}

/** Admin: Delete user */
export async function deleteUserAdmin(req, res, next) {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid user id' })
    }
    await User.findByIdAndDelete(id)
    return res.status(200).json({ success: true })
  } catch (e) {
    next(e)
  }
}

/** Admin: Toggle block status */
export async function toggleBlockUserAdmin(req, res, next) {
  try {
    const { id } = req.params
    const { blockReason } = req.body
    
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid user id' })
    }
    const user = await User.findById(id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    
    const wasBlocked = user.isBlocked
    user.isBlocked = !wasBlocked
    
    // If we are blocking, update the reason. If unblocking, we can keep it or clear it.
    if (!wasBlocked) {
      if (!blockReason || !blockReason.trim()) {
        return res.status(400).json({ error: 'Block reason is required when suspending an account.' })
      }
      user.blockReason = blockReason.trim()
    } else {
      user.blockReason = '' // Clear reason when unblocking
    }
    
    await user.save()
    
    return res.status(200).json({ 
      success: true, 
      isBlocked: user.isBlocked, 
      blockReason: user.blockReason 
    })
  } catch (e) {
    next(e)
  }
}

/**
 * Handles new user registration.
 */
export async function postSignUp(req, res, next) {
  try {
    const parsed = signUpSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten()
      })
    }

    // Check if user already exists before registering
    const identifier = parsed.data.email || parsed.data.deviceId
    const existing = await findUserByIdentifier(identifier)
    
    if (existing) {
      return res.status(409).json({ 
        error: 'Account already exists', 
        code: 'ACCOUNT_EXISTS',
        message: 'A user with this email or device ID is already registered. Please log in.'
      })
    }

    const result = await registerUser({
      ...parsed.data,
      image: req.file ? `/uploads/users/${req.file.filename}` : '',
      imageUrl: (!req.file && parsed.data.image) ? parsed.data.image : (parsed.data.imageUrl || ''),
      fcmToken: parsed.data.fcmToken || req.body.fcmToken || ''
    })
    
    // Add status to registration response too
    result.user.status = 'active'
    
    return res.status(201).json(result)
  } catch (e) {
    next(e)
  }
}

/** Update user profile (FCM token, name, image, etc.) */
export async function patchUserProfile(req, res, next) {
  try {
    const { id } = req.params // or get from req.auth.sub if using middleware
    const parsed = signUpSchema.partial().safeParse(req.body)
    
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
    }

    const updateData = { ...parsed.data }
    if (req.file) {
      updateData.image = `/uploads/users/${req.file.filename}`
      updateData.imageUrl = '' // Clear URL if file is uploaded
    } else if (parsed.data.image && parsed.data.image.startsWith('http')) {
      updateData.imageUrl = parsed.data.image
      updateData.image = '' // Clear local path if URL is provided
    }

    const user = await User.findByIdAndUpdate(id, { $set: updateData }, { new: true })
    if (!user) return res.status(404).json({ error: 'User not found' })

    return res.status(200).json({ user: user.toObject() })
  } catch (e) {
    next(e)
  }
}

/** Update only FCM token */
export async function patchUserFcmToken(req, res, next) {
  try {
    const { id } = req.params
    const { fcmToken } = req.body
    
    if (!fcmToken) {
      return res.status(400).json({ error: 'fcmToken is required' })
    }

    const user = await User.findByIdAndUpdate(id, { $set: { fcmToken } }, { new: true })
    if (!user) return res.status(404).json({ error: 'User not found' })

    return res.status(200).json({ success: true, fcmToken: user.fcmToken })
  } catch (e) {
    next(e)
  }
}


