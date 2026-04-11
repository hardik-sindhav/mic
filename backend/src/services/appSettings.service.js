import { AppSettings } from '../models/AppSettings.js'

/**
 * Returns the singleton settings document, or a default object if none exists.
 */
export async function getAppSettings() {
  const doc = await AppSettings.findOne().sort({ createdAt: -1 }).lean()
  if (!doc) {
    return {
      latestVersion: '1.0.0',
      updateUrl: '',
      updateNote: '',
      forceUpdate: false,
      welcomeReward: {
        totalCards: 10,
        bonusCards: 0,
        starChances: {
          star1: 40,
          star2: 30,
          star3: 15,
          star4: 10,
          star5: 5,
        }
      },
      rewardPack: {
        totalCards: 5,
        bonusCards: 0,
        starChances: {
          star1: 40,
          star2: 30,
          star3: 15,
          star4: 10,
          star5: 5,
        }
      }
    }
  }
  return doc
}

/**
 * Overwrites the settings (or creates the first record).
 */
export async function updateAppSettings(payload) {
  let doc = await AppSettings.findOne()
  if (doc) {
    doc.latestVersion = payload.latestVersion
    doc.updateUrl = payload.updateUrl
    doc.updateNote = payload.updateNote
    doc.forceUpdate = payload.forceUpdate
    if (payload.welcomeReward) {
      doc.welcomeReward = payload.welcomeReward
    }
    if (payload.rewardPack) {
      doc.rewardPack = payload.rewardPack
    }
    await doc.save()
  } else {
    doc = await AppSettings.create(payload)
  }
  return doc.toObject()
}
