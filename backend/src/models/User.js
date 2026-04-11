import mongoose from 'mongoose'
import crypto from 'crypto'

/** End-user records for the mobile app */
const userSchema = new mongoose.Schema(
  {
    /** Real name or chosen display name from Google Sign-In */
    name: { type: String, required: true, trim: true, maxlength: 120 },
    /** Email address (from Google Sign-In or manual) */
    email: { type: String, lowercase: true, trim: true, index: true, sparse: true },
    /** Guest ID if the user hasn't linked an email yet */
    guestId: { type: String, trim: true, index: true, sparse: true },
    /** Unique identifier for the mobile device */
    deviceId: { type: String, required: true, index: true },
    /** Referral code given to others */
    referCode: { type: String, unique: true, index: true },
    /** Who referred this user (optional) */
    referredBy: { type: String, index: true },
    /** Country code (e.g. "US", "IN") */
    country: { type: String, trim: true, uppercase: true },
    /** Firebase Cloud Messaging token for push notifications */
    fcmToken: { type: String, trim: true },
    
    // Stats and progression (keeping existing fields)
    wins: { type: Number, default: 0, min: 0 },
    losses: { type: Number, default: 0, min: 0 },
    cardsHeld: { type: Number, default: 0, min: 0 },
    rareCardsHeld: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
)

/** Generate a unique referral code before saving a new user */
userSchema.pre('save', async function (next) {
  if (this.isNew && !this.referCode) {
    // Generate a 6-character random code
    this.referCode = crypto.randomBytes(3).toString('hex').toUpperCase()
  }
  next()
})

userSchema.index({ wins: -1 })
userSchema.index({ cardsHeld: -1 })

export const User = mongoose.models.User || mongoose.model('User', userSchema, 'users')
