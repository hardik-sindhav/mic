import fs from 'fs'
import path from 'path'
import mongoose from 'mongoose'
import { z } from 'zod'
import {
  createCard,
  listCards,
  listDeletedCards,
  restoreCardById,
  softDeleteCardById,
  permanentDeleteCardById,
  updateCardById,
  listCardsChunked,
  countActiveCards,
  activeCardFilter,
} from '../services/cards.service.js'
import { Card } from '../models/Card.js'

// Helper to get file size in bytes
function getFileSize(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') return 0
  
  // Skip external URLs
  if (imagePath.startsWith('http')) return 0

  let relativePath = ''
  if (imagePath.startsWith('/uploads/cards/')) {
    relativePath = imagePath.replace('/uploads/cards/', 'cards/')
  } else if (imagePath.startsWith('/uploads/')) {
    relativePath = imagePath.replace('/uploads/', '')
  } else {
    // If it doesn't start with /uploads/, it might be a raw filename or something else
    relativePath = imagePath
  }
  
  // Use absolute path from project root (assuming backend is current working directory)
  const fullPath = path.join(process.cwd(), 'uploads', relativePath.startsWith('cards/') ? '' : 'cards', relativePath)
  
  try {
    if (fs.existsSync(fullPath)) {
      return fs.statSync(fullPath).size
    }
    // Try fallback without forcing "cards" subfolder if not found
    const fallbackPath = path.join(process.cwd(), 'uploads', relativePath)
    if (fs.existsSync(fallbackPath)) {
      return fs.statSync(fallbackPath).size
    }
  } catch (err) {
    console.warn('Could not get file size for:', fullPath, err.message)
  }
  return 0
}

export async function getCardChunksTotal(_req, res, next) {
  try {
    const total = await countActiveCards()
    const allCards = await Card.find(activeCardFilter).select('image').lean()
    const totalSizeBytes = allCards.reduce((acc, card) => acc + getFileSize(card.image), 0)

    return res.status(200).json({ 
      totalCards: total,
      totalChunks: 10,
      totalSizeBytes
    })
  } catch (e) {
    next(e)
  }
}

export async function getCardChunkByIndex(req, res, next) {
  try {
    const chunkIndex = parseInt(req.params.index, 10)
    if (isNaN(chunkIndex) || chunkIndex < 0 || chunkIndex >= 10) {
      return res.status(400).json({ error: 'Invalid chunk index (0-9 required)' })
    }
    const items = await listCardsChunked(chunkIndex, 10)
    const chunkSizeLevelBytes = items.reduce((acc, card) => acc + getFileSize(card.image), 0)

    return res.status(200).json({ 
      chunkIndex,
      totalChunks: 10,
      count: items.length,
      chunkSizeBytes: chunkSizeLevelBytes,
      items 
    })
  } catch (e) {
    next(e)
  }
}

// Helper to parse string to boolean (for FormData)
function parseBoolean(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true'
  }
  return Boolean(value)
}

// Validation schemas for card data (image is handled by multer)
// Uses z.coerce for all types to handle FormData string values
const createBodySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  totalHp: z.coerce.number().int().min(0).max(999999),
  totalAttack: z.coerce.number().int().min(0).max(999999),
  totalDefense: z.coerce.number().int().min(0).max(999999),
  totalMagic: z.coerce.number().int().min(0).max(999999),
  stars: z.coerce.number().int().min(1).max(5),
  rarity: z.coerce.number().int().min(0).max(100),
  type: z.enum(["Pyre", "Abyss", "Nature", "Earth", "Thunder", "Frost", "Void", "Celestial", "Necro", "Iron", "Aero", "Venom"]),
  abilities: z.string().trim().optional().default(''),
  active: z.preprocess((v) => parseBoolean(v), z.boolean()),
})

const updateBodySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  totalHp: z.coerce.number().int().min(0).max(999999),
  totalAttack: z.coerce.number().int().min(0).max(999999),
  totalDefense: z.coerce.number().int().min(0).max(999999),
  totalMagic: z.coerce.number().int().min(0).max(999999),
  stars: z.coerce.number().int().min(1).max(5),
  rarity: z.coerce.number().int().min(0).max(100),
  type: z.enum(["Pyre", "Abyss", "Nature", "Earth", "Thunder", "Frost", "Void", "Celestial", "Necro", "Iron", "Aero", "Venom"]),
  abilities: z.string().trim().optional().default(''),
  active: z.preprocess((v) => parseBoolean(v), z.boolean()),
})

export async function postCard(req, res, next) {
  try {
    // Check if image file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'Card image is required',
        code: 'VALIDATION_ERROR',
      })
    }

    const parsed = createBodySchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      })
    }

    // Create card data with image path
    const cardData = {
      ...parsed.data,
      image: `/uploads/cards/${req.file.filename}`,
    }

    const card = await createCard(cardData)
    return res.status(201).json(card.toObject())
  } catch (e) {
    next(e)
  }
}

export async function getCards(_req, res, next) {
  try {
    const items = await listCards()
    return res.status(200).json({ items })
  } catch (e) {
    next(e)
  }
}

export async function getCardById(req, res, next) {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid card id' })
    }
    const card = await Card.findById(id)
    if (!card) {
      return res.status(404).json({ error: 'Card not found' })
    }
    return res.status(200).json(card.toObject())
  } catch (e) {
    next(e)
  }
}

export async function patchCard(req, res, next) {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid card id' })
    }

    const parsed = updateBodySchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      })
    }

    // Build update data
    const updateData = { ...parsed.data }

    // If a new image was uploaded, delete the old one and update the path
    if (req.file) {
      // Get the old card to find the old image path
      const oldCard = await Card.findById(id)
      if (oldCard && oldCard.image) {
        // Extract the filename from the old image path (e.g., "/uploads/cards/filename.jpg" -> "filename.jpg")
        const oldImagePath = oldCard.image.replace('/uploads/cards/', '').replace('/uploads/', '')
        const fullOldPath = path.join(process.cwd(), 'uploads', oldCard.image.includes('/cards/') ? 'cards' : '', oldImagePath)
        
        // Delete the old image file if it exists
        try {
          if (fs.existsSync(fullOldPath)) {
            fs.unlinkSync(fullOldPath)
          }
        } catch (deleteError) {
          // Log but don't fail if deletion fails
          console.warn('Could not delete old image file:', fullOldPath, deleteError.message)
        }
      }
      
      updateData.image = `/uploads/cards/${req.file.filename}`
    }

    const card = await updateCardById(id, updateData)
    if (!card) {
      return res.status(404).json({ error: 'Card not found' })
    }
    return res.status(200).json(card.toObject())
  } catch (e) {
    next(e)
  }
}

export async function deleteCard(req, res, next) {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid card id' })
    }
    const archived = await softDeleteCardById(id)
    if (!archived) {
      return res.status(404).json({ error: 'Card not found or already archived' })
    }
    return res.status(200).json({
      ok: true,
      archivedAt: archived.deletedAt,
      card: archived.toObject(),
    })
  } catch (e) {
    next(e)
  }
}

export async function permanentDeleteCard(req, res, next) {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid card id' })
    }
    const success = await permanentDeleteCardById(id)
    if (!success) {
      return res.status(404).json({ error: 'Card not found' })
    }
    return res.status(200).json({ ok: true })
  } catch (e) {
    next(e)
  }
}

export async function getDeletedCards(_req, res, next) {
  try {
    const items = await listDeletedCards()
    return res.status(200).json({ items })
  } catch (e) {
    next(e)
  }
}

export async function restoreCard(req, res, next) {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid card id' })
    }
    const card = await restoreCardById(id)
    if (!card) {
      return res.status(404).json({ error: 'Card not found or not archived' })
    }
    return res.status(200).json(card.toObject())
  } catch (e) {
    next(e)
  }
}
