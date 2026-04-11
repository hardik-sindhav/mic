import { z } from 'zod'
import { getAdConfig, replaceAdConfig } from '../services/adConfig.service.js'

const customAdBody = z.object({
  enabled: z.boolean(),
  heading: z.string().max(200).optional().default(''),
  subheading: z.string().max(500).optional().default(''),
  buttonText: z.string().max(100).optional().default(''),
  targetUrl: z.string().url().or(z.literal('')).optional().default(''),
  mediaUrl: z.string().url().or(z.literal('')).optional().default(''),
})

const networkBody = z.object({
  enabled: z.boolean(),
  bannerAdUnitId: z.string().max(512).optional().default(''),
  interstitialAdUnitId: z.string().max(512).optional().default(''),
  rewardedAdUnitId: z.string().max(512).optional().default(''),
})

const putBodySchema = z.object({
  customAd: customAdBody.optional(),
  google: networkBody.optional(),
  meta: networkBody.optional(),
  unity: networkBody.optional(),
  applovin: networkBody.optional(),
  loadOrder: z.array(z.string()).optional(),
})

/** Public read — mobile clients fetch ad unit IDs and flags */
export async function getAdConfigPublic(_req, res, next) {
  try {
    const config = await getAdConfig()
    return res.status(200).json(config)
  } catch (e) {
    next(e)
  }
}

/** Update settings (Admin only) */
export async function putAdConfig(req, res, next) {
  try {
    const parsed = putBodySchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      })
    }
    const config = await replaceAdConfig(parsed.data)
    return res.status(200).json(config)
  } catch (e) {
    next(e)
  }
}
