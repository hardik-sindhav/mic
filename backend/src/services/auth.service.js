import bcrypt from 'bcrypt'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import ms from 'ms'
import { env } from '../config/env.js'
import { Admin } from '../models/Admin.js'
import { RefreshToken, hashRefreshToken } from '../models/RefreshToken.js'

/** Precomputed bcrypt hash — used only so timing matches when email is unknown */
const BCRYPT_DUMMY =
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'

const SALT_ROUNDS = 12

export async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

function signAccessToken(admin) {
  const payload = {
    sub: admin._id.toString(),
    email: admin.email,
    role: admin.role,
    typ: 'access',
  }
  return jwt.sign(payload, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_ACCESS_EXPIRES,
    issuer: 'mic-api',
    audience: 'mic-admin',
  })
}

function getRefreshExpiresAt() {
  const duration = ms(env.JWT_REFRESH_EXPIRES)
  if (typeof duration !== 'number' || duration <= 0) {
    throw new Error('Invalid JWT_REFRESH_EXPIRES')
  }
  return new Date(Date.now() + duration)
}

export async function login({ email, password, ip, userAgent }) {
  const normalizedEmail = String(email).toLowerCase().trim()

  const admin = await Admin.findOne({ email: normalizedEmail }).select(
    '+passwordHash failedLoginAttempts lockUntil',
  )

  const hashForCompare = admin?.passwordHash ?? BCRYPT_DUMMY
  const match = await bcrypt.compare(password, hashForCompare)

  if (!admin || !match) {
    if (admin) {
      const attempts = admin.failedLoginAttempts + 1
      const update = { $set: { failedLoginAttempts: attempts } }
      if (attempts >= env.AUTH_MAX_FAILED_ATTEMPTS) {
        update.$set.lockUntil = new Date(Date.now() + env.AUTH_LOCKOUT_MS)
        update.$set.failedLoginAttempts = 0
      }
      await Admin.updateOne({ _id: admin._id }, update)
    }
    const err = new Error('INVALID_CREDENTIALS')
    err.code = 'INVALID_CREDENTIALS'
    throw err
  }

  if (admin.isLocked()) {
    const err = new Error('LOCKED')
    err.code = 'LOCKED'
    throw err
  }

  admin.failedLoginAttempts = 0
  admin.lockUntil = null
  // Use updateOne to avoid validation errors on fields we didn't select or don't want to re-validate
  await Admin.updateOne(
    { _id: admin._id },
    { $set: { failedLoginAttempts: 0, lockUntil: null } }
  )

  const accessToken = signAccessToken(admin)
  const rawRefresh = crypto.randomBytes(48).toString('hex')
  const tokenHash = hashRefreshToken(rawRefresh)
  const expiresAt = getRefreshExpiresAt()

  await RefreshToken.create({
    tokenHash,
    adminId: admin._id,
    expiresAt,
    ip: ip ?? '',
    userAgent: (userAgent ?? '').slice(0, 512),
  })

  const decodedAccess = jwt.decode(accessToken)
  const expiresInSec =
    typeof decodedAccess?.exp === 'number'
      ? Math.max(0, decodedAccess.exp - Math.floor(Date.now() / 1000))
      : 0

  return {
    accessToken,
    refreshToken: rawRefresh,
    tokenType: 'Bearer',
    expiresIn: expiresInSec,
  }
}

export async function refreshSession({ rawRefreshToken, ip, userAgent }) {
  if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
    const err = new Error('INVALID_REFRESH')
    err.code = 'INVALID_REFRESH'
    throw err
  }

  const tokenHash = hashRefreshToken(rawRefreshToken.trim())
  const doc = await RefreshToken.findOne({ tokenHash })

  if (!doc || doc.revokedAt || doc.expiresAt < new Date()) {
    const err = new Error('INVALID_REFRESH')
    err.code = 'INVALID_REFRESH'
    throw err
  }

  const admin = await Admin.findById(doc.adminId)
  if (!admin) {
    const err = new Error('INVALID_REFRESH')
    err.code = 'INVALID_REFRESH'
    throw err
  }

  const accessToken = signAccessToken(admin)
  const rawRefresh = crypto.randomBytes(48).toString('hex')
  const newHash = hashRefreshToken(rawRefresh)
  const expiresAt = getRefreshExpiresAt()

  await mongoose.connection.transaction(async (session) => {
    await RefreshToken.create(
      [
        {
          tokenHash: newHash,
          adminId: admin._id,
          expiresAt,
          ip: ip ?? '',
          userAgent: (userAgent ?? '').slice(0, 512),
        },
      ],
      { session },
    )
    await RefreshToken.updateOne(
      { _id: doc._id },
      { $set: { revokedAt: new Date() } },
      { session },
    )
  })

  const decodedAccess = jwt.decode(accessToken)
  const expiresInSec =
    typeof decodedAccess?.exp === 'number'
      ? Math.max(0, decodedAccess.exp - Math.floor(Date.now() / 1000))
      : 0

  return {
    accessToken,
    refreshToken: rawRefresh,
    tokenType: 'Bearer',
    expiresIn: expiresInSec,
  }
}

export async function revokeRefreshToken(rawRefreshToken) {
  if (!rawRefreshToken) return
  const tokenHash = hashRefreshToken(String(rawRefreshToken).trim())
  await RefreshToken.updateOne(
    { tokenHash, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  )
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET, {
    algorithms: ['HS256'],
    issuer: 'mic-api',
    audience: 'mic-admin',
  })
}
