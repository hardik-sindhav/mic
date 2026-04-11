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
    // Only pick version fields
    doc.latestVersion = payload.latestVersion
    doc.updateUrl = payload.updateUrl
    doc.updateNote = payload.updateNote
    doc.forceUpdate = payload.forceUpdate
    await doc.save()
  } else {
    doc = await AppSettings.create(payload)
  }
  return doc.toObject()
}
