import { z } from 'zod'
import { findUserByIdentifier, registerUser, getLoginResponse } from '../services/user.service.js'

const signUpSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().email().optional(),
  guestId: z.string().trim().optional(),
  deviceId: z.string().trim().min(1),
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

    // Account found, return tokens
    const response = getLoginResponse(user)
    return res.status(200).json(response)
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

    const result = await registerUser(parsed.data)
    return res.status(201).json(result)
  } catch (e) {
    next(e)
  }
}
