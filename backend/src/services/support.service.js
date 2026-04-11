import { SupportTicket } from '../models/SupportTicket.js'

export async function createTicket(userId, { title, description, images }) {
  const ticket = await SupportTicket.create({
    userId,
    title,
    description,
    images: images || [],
    status: 'open',
  })
  return ticket
}

export async function listUserTickets(userId) {
  return await SupportTicket.find({ userId }).sort({ createdAt: -1 })
}

export async function listAllTicketsAdmin(filter = {}) {
  return await SupportTicket.find(filter)
    .populate('userId', 'name email image imageUrl')
    .sort({ createdAt: -1 })
}

export async function getTicketById(id) {
  return await SupportTicket.findById(id).populate('userId', 'name email image imageUrl')
}

export async function updateTicketStatus(id, status, solution = '') {
  const update = { status }
  if (status === 'resolved' && solution) {
    update.solution = solution
  }
  return await SupportTicket.findByIdAndUpdate(id, update, { new: true })
}

export async function addReply(ticketId, { senderId, senderType, message, images }) {
  const ticket = await SupportTicket.findById(ticketId)
  if (!ticket) return null

  ticket.replies.push({
    senderId,
    senderType,
    message,
    images: images || [],
  })

  // Auto-update status when admin replies and it's currently "open"
  if (senderType === 'admin' && ticket.status === 'open') {
    ticket.status = 'in-progress'
  }

  await ticket.save()
  return ticket
}
