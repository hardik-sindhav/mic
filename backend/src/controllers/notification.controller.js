import { z } from 'zod'
import { User } from '../models/User.js'

const notificationSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  imageUrl: z.string().url().or(z.literal('')).optional(),
})

/**
 * Sends a notification to all users with an FCM token.
 * Note: This is a placeholder for actual Firebase logic.
 * You will need to add firebase-admin to your project.
 */
export async function postSendToAll(req, res, next) {
  try {
    const parsed = notificationSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid notification data', details: parsed.error.flatten() })
    }

    const { title, body, imageUrl } = parsed.data

    // 1. Get all users with FCM tokens
    const users = await User.find({ fcmToken: { $ne: '', $exists: true } }).select('fcmToken')
    const tokens = users.map(u => u.fcmToken)

    if (tokens.length === 0) {
      return res.status(200).json({ success: true, message: 'No users with FCM tokens found.' })
    }

    console.log(`[Notification] Sending to ${tokens.length} users:`, { title, body })

    /** 
     * TODO: Implement Firebase Admin SDK logic here
     * 
     * example:
     * await admin.messaging().sendEachForMulticast({
     *   tokens,
     *   notification: { title, body, imageUrl },
     * })
     */

    return res.status(200).json({ 
      success: true, 
      message: `Notification broadcast initiated to ${tokens.length} users.`,
      recipientCount: tokens.length
    })
  } catch (e) {
    next(e)
  }
}
