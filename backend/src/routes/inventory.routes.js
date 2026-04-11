import { Router } from 'express'
import { postClaimWelcome, getUserInventory } from '../controllers/inventory.controller.js'
import { requireAuth } from '../middleware/authenticate.js'

const r = Router()

// All inventory routes require user authentication
r.use(requireAuth)

r.post('/claim-welcome', postClaimWelcome)
r.get('/my', getUserInventory)

export const inventoryRoutes = r
