import { User } from '../models/User.js'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

/**
 * Signs an access token for an app user.
 */
function signUserToken(user) {
  const payload = {
    sub: user._id.toString(),
    email: user.email || '',
    deviceId: user.deviceId,
    role: 'user', // Distinguish from 'admin'
    typ: 'user-access',
  }
  return jwt.sign(payload, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '30d', // Mobile sessions usually last longer
    issuer: 'mic-api',
    audience: 'mic-app',
  })
}

/**
 * Finds an active user by email OR device ID.
 */
export async function findUserByIdentifier(identifier) {
  if (!identifier) return null
  
  // Try finding by email
  let user = await User.findOne({ email: identifier.toLowerCase().trim() })
  
  // If not found, try finding by device ID (guest/hardware identification)
  if (!user) {
    user = await User.findOne({ deviceId: identifier.trim() })
  }
  
  return user
}

/**
 * Creates a new user record.
 */
export async function registerUser(payload) {
  const user = await User.create({
    name: payload.name.trim(),
    email: payload.email ? payload.email.toLowerCase().trim() : undefined,
    guestId: payload.guestId ? payload.guestId.trim() : undefined,
    deviceId: payload.deviceId.trim(),
    referredBy: payload.referCode ? payload.referCode.trim() : undefined,
    country: payload.country ? payload.country.toUpperCase().trim() : undefined,
    fcmToken: payload.fcmToken ? payload.fcmToken.trim() : undefined,
  })
  
  const accessToken = signUserToken(user)
  return { user: user.toObject(), accessToken }
}

/**
 * Returns a response with an access token for a valid user.
 */
export function getLoginResponse(user) {
  const accessToken = signUserToken(user)
  return {
    user: user.toObject(),
    accessToken,
    tokenType: 'Bearer',
  }
}
