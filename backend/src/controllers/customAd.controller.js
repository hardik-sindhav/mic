import { z } from 'zod'
import {
  listCustomAds,
  listActiveCustomAds,
  createCustomAd,
  updateCustomAdById,
  deleteCustomAdById,
  updateCustomAdsOrder,
} from '../services/customAd.service.js'
import mongoose from 'mongoose'

const customAdSchema = z.object({
  enabled: z.boolean().default(false),
  heading: z.string().max(200).optional().default(''),
  subheading: z.string().max(500).optional().default(''),
  buttonText: z.string().max(100).optional().default(''),
  targetUrl: z.string().url().or(z.literal('')).optional().default(''),
  mediaUrl: z.string().url().or(z.literal('')).optional().default(''),
})

/** Public fetch for mobile apps - active only */
export async function getCustomAdsPublic(_req, res, next) {
  try {
    const ads = await listActiveCustomAds()
    return res.status(200).json(ads)
  } catch (e) {
    next(e)
  }
}

/** Admin: List all ads */
export async function getCustomAdsAdmin(_req, res, next) {
  try {
    const ads = await listCustomAds()
    return res.status(200).json(ads)
  } catch (e) {
    next(e)
  }
}

/** Admin: Create new ad */
export async function postCustomAd(req, res, next) {
  try {
    const parsed = customAdSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      })
    }
    const ad = await createCustomAd(parsed.data)
    return res.status(201).json(ad)
  } catch (e) {
    next(e)
  }
}

/** Admin: Update ad */
export async function patchCustomAd(req, res, next) {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid ad id' })
    }
    const parsed = customAdSchema.partial().safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      })
    }
    const ad = await updateCustomAdById(id, parsed.data)
    if (!ad) return res.status(404).json({ error: 'Ad not found' })
    return res.status(200).json(ad)
  } catch (e) {
    next(e)
  }
}

/** Admin: Delete ad */
export async function deleteCustomAd(req, res, next) {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid ad id' })
    }
    await deleteCustomAdById(id)
    return res.status(204).send()
  } catch (e) {
    next(e)
  }
}

/** Admin: Reorder ads */
export async function putCustomAdsOrder(req, res, next) {
  try {
    const { order } = req.body
    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'order array is required' })
    }
    const ads = await updateCustomAdsOrder(order)
    return res.status(200).json(ads)
  } catch (e) {
    next(e)
  }
}
