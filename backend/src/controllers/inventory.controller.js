import * as inventoryService from '../services/inventory.service.js'

export async function postClaimWelcome(req, res, next) {
  try {
    const cards = await inventoryService.claimWelcomeReward(req.auth.sub)
    return res.status(200).json({
      success: true,
      message: 'Welcome reward claimed successfully',
      items: cards
    })
  } catch (e) {
    if (e.message === 'Welcome reward already claimed') {
      return res.status(400).json({ error: e.message, code: 'ALREADY_CLAIMED' })
    }
    next(e)
  }
}

export async function getUserInventory(req, res, next) {
  try {
    const { User } = await import('../models/User.js')
    const user = await User.findById(req.auth.sub)
      .populate({
        path: 'inventory.cardId',
        select: 'name image stars rarity type abilities totalHp totalAttack totalDefense totalMagic slug'
      })
      .lean()
    
    if (!user) return res.status(404).json({ error: 'User not found' })

    const items = user.inventory.map(item => ({
      ...item.cardId,
      count: item.count
    }))

    return res.status(200).json({ items })
  } catch (e) {
    next(e)
  }
}
