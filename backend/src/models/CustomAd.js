import mongoose from 'mongoose'

const customAdSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    heading: { type: String, trim: true, default: '' },
    subheading: { type: String, trim: true, default: '' },
    buttonText: { type: String, trim: true, default: '' },
    targetUrl: { type: String, trim: true, default: '' },
    mediaUrl: { type: String, trim: true, default: '' },
    /** Display order */
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export const CustomAd =
  mongoose.models.CustomAd || mongoose.model('CustomAd', customAdSchema, 'custom_ads')
