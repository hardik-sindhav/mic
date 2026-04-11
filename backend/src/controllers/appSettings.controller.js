import { z } from 'zod'
import { getAppSettings, updateAppSettings } from '../services/appSettings.service.js'

const appSettingsSchema = z.object({
  latestVersion: z.string().trim().min(1).max(50),
  updateUrl: z.string().trim().max(1024).optional().default(''),
  updateNote: z.string().trim().max(2048).optional().default(''),
  forceUpdate: z.boolean().default(false),
  welcomeReward: z.object({
    totalCards: z.number().int().min(0).max(100).default(10),
    bonusCards: z.number().int().min(0).max(100).default(0),
    bonusCardIds: z.array(z.string()).optional().default([]),
    starChances: z.object({
      star1: z.number().min(0).max(100).default(40),
      star2: z.number().min(0).max(100).default(30),
      star3: z.number().min(0).max(100).default(15),
      star4: z.number().min(0).max(100).default(10),
      star5: z.number().min(0).max(100).default(5),
    })
  }).optional()
})

/** Public fetch for mobile apps to check for updates and global notes */
export async function getAppSettingsPublic(_req, res, next) {
  try {
    const settings = await getAppSettings()
    return res.status(200).json(settings)
  } catch (e) {
    next(e)
  }
}

/** Update settings (Admin only) */
export async function putAppSettings(req, res, next) {
  try {
    const parsed = appSettingsSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      })
    }
    const settings = await updateAppSettings(parsed.data)
    return res.status(200).json(settings)
  } catch (e) {
    next(e)
  }
}
