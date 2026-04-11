import mongoose from 'mongoose'

const replySchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    senderType: { type: String, enum: ['user', 'admin'], required: true },
    message: { type: String, trim: true, default: '' },
    images: { type: [String], default: [] },
  },
  { timestamps: true },
)

const ticketSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, trim: true, required: true },
    description: { type: String, trim: true, required: true },
    images: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    replies: [replySchema],
    solution: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
)

export const SupportTicket =
  mongoose.models.SupportTicket ||
  mongoose.model('SupportTicket', ticketSchema, 'support_tickets')
