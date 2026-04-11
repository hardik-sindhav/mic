import mongoose from 'mongoose'

const appSettingsSchema = new mongoose.Schema(
  {
    /** The version currently live in stores (e.g. "1.0.5") */
    latestVersion: { type: String, trim: true, default: '1.0.0' },
    /** URL to download the update (Play Store, App Store, or direct APK) */
    updateUrl: { type: String, trim: true, default: '' },
    /** What's new in this version? (shown in the app's update dialog) */
    updateNote: { type: String, trim: true, default: '' },
    /** If true, the app blocks the user until they update */
    forceUpdate: { type: Boolean, default: false },
    /** Welcome reward configuration */
    welcomeReward: {
      totalCards: { type: Number, default: 10 },
      bonusCards: { type: Number, default: 0 },
      bonusCardIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
      starChances: {
        star1: { type: Number, default: 40 },
        star2: { type: Number, default: 30 },
        star3: { type: Number, default: 15 },
        star4: { type: Number, default: 10 },
        star5: { type: Number, default: 5 },
      }
    },
  },
  { timestamps: true },
)

export const AppSettings =
  mongoose.models.AppSettings || mongoose.model('AppSettings', appSettingsSchema, 'app_settings')
