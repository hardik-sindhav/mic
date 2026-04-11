import { Router } from 'express'
import { postSendToAll } from '../controllers/notification.controller.js'
import { requireAuth } from '../middleware/authenticate.js'

const r = Router()

/** Admin only: Send notification to all users */
r.post('/send-all', requireAuth, postSendToAll)

export const notificationRoutes = r
