import { Router } from 'express'
import {
  postTicket,
  getUserTickets,
  getAllTicketsAdmin,
  getTicketDetail,
  patchTicketStatus,
  postTicketReply
} from '../controllers/support.controller.js'
import { upload } from '../middleware/upload.js'
import { requireAuth } from '../middleware/authenticate.js'

const r = Router()

// All ticket routes require authentication
r.use(requireAuth)

/** App User routes */
r.post('/', upload.array('images', 5), postTicket) // Create new ticket
r.get('/my', getUserTickets) // List user's own tickets

/** Admin routes */
r.get('/admin', getAllTicketsAdmin) // List all tickets for admin
r.patch('/:id/status', patchTicketStatus) // Admin updates ticket status/solution

/** Shared routes (detail and reply) */
r.get('/:id', getTicketDetail) // Get ticket details (user or admin)
r.post('/:id/reply', upload.array('images', 5), postTicketReply) // Add reply (user or admin)

export const supportRoutes = r
