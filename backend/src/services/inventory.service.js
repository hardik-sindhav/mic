import { Card } from '../models/Card.js'
import { User } from '../models/User.js'
import { getAppSettings } from './appSettings.service.js'
import { activeCardFilter } from './cards.service.js'

const DEFAULT_STAR_CHANCES = { star1: 40, star2: 30, star3: 15, star4: 10, star5: 5 }

function normalizeRewardConfig(raw) {
  return {
    totalCards: Math.max(0, Number(raw?.totalCards ?? 0)),
    bonusCards: Math.max(0, Number(raw?.bonusCards ?? 0)),
    bonusCardIds: Array.isArray(raw?.bonusCardIds) ? raw.bonusCardIds : [],
    starChances: { ...DEFAULT_STAR_CHANCES, ...(raw?.starChances || {}) },
  }
}

/**
 * Build ordered list of picked card lean docs (_id, stars) from reward config.
 */
function buildPickedCardsFromConfig(config, allCards, cardsByStars) {
  const c = normalizeRewardConfig(config)
  const picked = []

  if (c.bonusCardIds.length > 0) {
    const fixed = allCards.filter((card) =>
      c.bonusCardIds.some((id) => id.toString() === card._id.toString()),
    )
    picked.push(...fixed)
  }

  const totalRandom = c.totalCards + c.bonusCards
  for (let i = 0; i < totalRandom; i++) {
    const card = pickRandomCardByStars(cardsByStars, c.starChances)
    if (card) picked.push(card)
  }

  return picked
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
      break
    }
  }

  const allPools = Object.values(cardsByStars).flat()
  if (allPools.length > 0) {
    return allPools[Math.floor(Math.random() * allPools.length)]
  }

  return null
}

function recomputeUserCardStats(user, allCardsLean) {
  user.cardsHeld = user.inventory.reduce((acc, item) => acc + item.count, 0)
  user.rareCardsHeld = user.inventory.reduce((acc, item) => {
    const card = allCardsLean.find((c) => c._id.toString() === item.cardId.toString())
    if (card && card.stars >= 4) return acc + item.count
    return acc
  }, 0)
}

/**
 * Claims the welcome reward for a user.
 * This should only be called once per user.
 */
export async function claimWelcomeReward(userId) {
  const user = await User.findById(userId)
  if (!user) throw new Error('User not found')
  if (user.hasClaimedWelcome) throw new Error('Welcome reward already claimed')

  const settings = await getAppSettings()
  const config = normalizeRewardConfig(
    settings.welcomeReward || {
      totalCards: 10,
      bonusCards: 0,
      starChances: DEFAULT_STAR_CHANCES,
    },
  )

  const allCards = await Card.find(activeCardFilter).select('_id stars rarity').lean()
  const cardsByStars = {
    1: allCards.filter((c) => (c.stars || 1) === 1),
    2: allCards.filter((c) => c.stars === 2),
    3: allCards.filter((c) => c.stars === 3),
    4: allCards.filter((c) => c.stars === 4),
    5: allCards.filter((c) => c.stars === 5),
  }

  const pickedCards = buildPickedCardsFromConfig(config, allCards, cardsByStars)

  if (
    pickedCards.length === 0 &&
    (!config.bonusCardIds || config.bonusCardIds.length === 0)
  ) {
    user.hasClaimedWelcome = true
    await user.save()
    return []
  }

  if (pickedCards.length > 0) {
    const inventoryUpdates = {}
    pickedCards.forEach((card) => {
      const id = card._id.toString()
      inventoryUpdates[id] = (inventoryUpdates[id] || 0) + 1
    })

    for (const [cardId, count] of Object.entries(inventoryUpdates)) {
      const existing = user.inventory.find((item) => item.cardId.toString() === cardId)
      if (existing) {
        existing.count += count
      } else {
        user.inventory.push({ cardId, count })
      }
    }

    recomputeUserCardStats(user, allCards)
  }

  user.hasClaimedWelcome = true
  await user.save()

  const fullPickedCards = await Card.find({
    _id: { $in: pickedCards.map((c) => c._id) },
  }).lean()

  const result = []
  pickedCards.forEach((p) => {
    const full = fullPickedCards.find((f) => f._id.toString() === p._id.toString())
    if (full) result.push(full)
  })

  return result
}

/**
 * Reward pack: same draw rules as welcome/rewardPack settings, but only adds cards
 * the user does not already have in inventory. Each roll item returns status "new" or "already_owned".
 */
export async function claimRewardPack(userId) {
  const user = await User.findById(userId)
  if (!user) throw new Error('User not found')

  const settings = await getAppSettings()
  const config = normalizeRewardConfig(
    settings.rewardPack || {
      totalCards: 5,
      bonusCards: 0,
      starChances: DEFAULT_STAR_CHANCES,
    },
  )

  const allCards = await Card.find(activeCardFilter).select('_id stars rarity').lean()
  const cardsByStars = {
    1: allCards.filter((c) => (c.stars || 1) === 1),
    2: allCards.filter((c) => c.stars === 2),
    3: allCards.filter((c) => c.stars === 3),
    4: allCards.filter((c) => c.stars === 4),
    5: allCards.filter((c) => c.stars === 5),
  }

  const pickedCards = buildPickedCardsFromConfig(config, allCards, cardsByStars)

  const ownedIds = new Set(user.inventory.map((item) => item.cardId.toString()))

  const idsForPopulate = [...new Set(pickedCards.map((p) => p._id.toString()))]
  const fullById = await Card.find({ _id: { $in: idsForPopulate } }).lean()
  const fullMap = new Map(fullById.map((c) => [c._id.toString(), c]))

  const items = []
  let newCount = 0

  for (const p of pickedCards) {
    const id = p._id.toString()
    const full = fullMap.get(id)
    if (!full) continue

    if (!ownedIds.has(id)) {
      user.inventory.push({ cardId: p._id, count: 1 })
      ownedIds.add(id)
      newCount += 1
      items.push({ ...full, status: 'new' })
    } else {
      items.push({ ...full, status: 'already_owned' })
    }
  }

  if (newCount > 0) {
    recomputeUserCardStats(user, allCards)
  }

  await user.save()

  return { newCount, items }
}
