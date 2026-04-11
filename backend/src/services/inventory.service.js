import { Card } from '../models/Card.js'
import { User } from '../models/User.js'
import { getAppSettings } from './appSettings.service.js'
import { activeCardFilter } from './cards.service.js'

/**
 * Claims the welcome reward for a user.
 * This should only be called once per user.
 */
export async function claimWelcomeReward(userId) {
  const user = await User.findById(userId)
  if (!user) throw new Error('User not found')
  if (user.hasClaimedWelcome) throw new Error('Welcome reward already claimed')

  const settings = await getAppSettings()
  const config = settings.welcomeReward || {
    totalCards: 10,
    bonusCards: 0,
    starChances: { star1: 40, star2: 30, star3: 15, star4: 10, star5: 5 }
  }

  const totalRandomToPick = config.totalCards + (config.bonusCards || 0)
  
  // Fetch all active cards grouped by stars for efficient picking
  const allCards = await Card.find(activeCardFilter).select('_id stars rarity').lean()
  const cardsByStars = {
    1: allCards.filter(c => (c.stars || 1) === 1),
    2: allCards.filter(c => c.stars === 2),
    3: allCards.filter(c => c.stars === 3),
    4: allCards.filter(c => c.stars === 4),
    5: allCards.filter(c => c.stars === 5),
  }

  const pickedCards = []
  
  // 1. Add specific bonus cards if configured
  if (config.bonusCardIds && config.bonusCardIds.length > 0) {
    const fixedBonusCards = allCards.filter(c => 
      config.bonusCardIds.some(id => id.toString() === c._id.toString())
    )
    pickedCards.push(...fixedBonusCards)
  }

  // 2. Pick random cards based on star chances
  const chances = config.starChances
  for (let i = 0; i < totalRandomToPick; i++) {
    const card = pickRandomCardByStars(cardsByStars, chances)
    if (card) pickedCards.push(card)
  }

  if (pickedCards.length === 0 && (!config.bonusCardIds || config.bonusCardIds.length === 0)) {
    user.hasClaimedWelcome = true
    await user.save()
    return []
  }

  // Update user inventory
  if (pickedCards.length > 0) {
    const inventoryUpdates = {}
    pickedCards.forEach(card => {
      const id = card._id.toString()
      inventoryUpdates[id] = (inventoryUpdates[id] || 0) + 1
    })

    // Merge into existing inventory if any
    for (const [cardId, count] of Object.entries(inventoryUpdates)) {
      const existing = user.inventory.find(item => item.cardId.toString() === cardId)
      if (existing) {
        existing.count += count
      } else {
        user.inventory.push({ cardId, count })
      }
    }
    
    user.cardsHeld = user.inventory.reduce((acc, item) => acc + item.count, 0)
    // Update rare cards count (4 or 5 stars)
    user.rareCardsHeld = user.inventory.reduce((acc, item) => {
      const card = allCards.find(c => c._id.toString() === item.cardId.toString())
      if (card && (card.stars >= 4)) return acc + item.count
      return acc
    }, 0)
  }

  user.hasClaimedWelcome = true
  await user.save()

  // Return the picked cards populated with full data for the UI
  const fullPickedCards = await Card.find({ _id: { $in: pickedCards.map(c => c._id) } }).lean()
  
  // Create a list that respects duplicates for the response
  const result = []
  pickedCards.forEach(p => {
    const full = fullPickedCards.find(f => f._id.toString() === p._id.toString())
    if (full) result.push(full)
  })

  return result
}

function pickRandomCardByStars(cardsByStars, chances) {
  const rand = Math.random() * 100
  let cumulative = 0
  
  const starLevels = [1, 2, 3, 4, 5]
  for (const level of starLevels) {
    cumulative += chances[`star${level}`] || 0
    if (rand <= cumulative) {
      const pool = cardsByStars[level]
      if (pool.length > 0) {
        return pool[Math.floor(Math.random() * pool.length)]
      }
      // If pool is empty, try to find in adjacent pools
      break
    }
  }

  // Fallback to any available card if preferred star pool is empty
  const allPools = Object.values(cardsByStars).flat()
  if (allPools.length > 0) {
    return allPools[Math.floor(Math.random() * allPools.length)]
  }
  
  return null
}
