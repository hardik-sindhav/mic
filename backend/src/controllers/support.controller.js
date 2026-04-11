import { z } from 'zod'
import mongoose from 'mongoose'
import * as supportService from '../services/support.service.js'

const createTicketSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1),
})

const replySchema = z.object({
  message: z.string().trim().min(1),
})

const statusUpdateSchema = z.object({
  status: z.enum(['open', 'in-progress', 'resolved', 'closed']),
  solution: z.string().trim().optional().default(''),
})

export async function postTicket(req, res, next) {
  try {
    const parsed = createTicketSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
    }

    const images = req.files ? req.files.map(f => `/uploads/tickets/${f.filename}`) : []
    const ticket = await supportService.createTicket(req.auth.sub, {
      ...parsed.data,
      images,
    })

    return res.status(201).json(ticket)
  } catch (e) {
    next(e)
  }
}

export async function getUserTickets(req, res, next) {
  try {
    const tickets = await supportService.listUserTickets(req.auth.sub)
    return res.status(200).json({ items: tickets })
  } catch (e) {
    next(e)
  }
}

export async function getAllTicketsAdmin(req, res, next) {
  try {
    if (req.auth.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }
    const { status } = req.query
    const filter = status ? { status } : {}
    const tickets = await supportService.listAllTicketsAdmin(filter)
    return res.status(200).json({ items: tickets })
  } catch (e) {
    next(e)
  }
}

export async function getTicketDetail(req, res, next) {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid ticket id' })
    }

    const ticket = await supportService.getTicketById(id)
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    // Security check: only the owner or an admin can see the ticket
    if (req.auth.role !== 'admin' && ticket.userId._id.toString() !== req.auth.sub) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    return res.status(200).json(ticket)
  } catch (e) {
    next(e)
  }
}

export async function patchTicketStatus(req, res, next) {
  try {
    if (req.auth.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { id } = req.params
    const parsed = statusUpdateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
    }

    const ticket = await supportService.updateTicketStatus(id, parsed.data.status, parsed.data.solution)
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    return res.status(200).json(ticket)
  } catch (e) {
    next(e)
  }
}

export async function postTicketReply(req, res, next) {
  try {
    const { id } = req.params
    const parsed = replySchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() })
    }

    const images = req.files ? req.files.map(f => `/uploads/tickets/${f.filename}`) : []
    const replyData = {
      senderId: req.auth.sub,
      senderType: req.auth.role === 'admin' ? 'admin' : 'user',
      message: parsed.data.message,
      images,
    }

    const ticket = await supportService.addReply(id, replyData)
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    return res.status(201).json(ticket)
  } catch (e) {
    next(e)
  }
}
