import mongoose from 'mongoose'

const customAdSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    heading: { type: String, trim: true, default: '' },
    subheading: { type: String, trim: true, default: '' },
    buttonText: { type: String, trim: true, default: '' },
    targetUrl: { type: String, trim: true, default: '' },
    mediaUrl: { type: String, trim: true, default: '' },
  },
  { _id: false },
)

const networkSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    bannerAdUnitId: { type: String, trim: true, default: '' },
    interstitialAdUnitId: { type: String, trim: true, default: '' },
    rewardedAdUnitId: { type: String, trim: true, default: '' },
  },
  { _id: false },
)

const adConfigSchema = new mongoose.Schema(
  {
    customAd: { type: customAdSchema, default: () => ({}) },
    google: { type: networkSchema, default: () => ({}) },
    meta: { type: networkSchema, default: () => ({}) },
    unity: { type: networkSchema, default: () => ({}) },
    applovin: { type: networkSchema, default: () => ({}) },
    /** Order of ad networks to load (fallback logic). Example: ["google", "unity", "meta"] */
    loadOrder: { type: [String], default: ["google", "meta", "unity", "applovin"] },
  },
  { timestamps: true },
)

export const AdConfig =
  mongoose.models.AdConfig || mongoose.model('AdConfig', adConfigSchema, 'ad_configs')
