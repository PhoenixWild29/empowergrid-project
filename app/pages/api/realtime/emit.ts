/**
 * POST /api/realtime/emit
 * 
 * API route to emit Socket.io notifications
 * Used by server-side code to send real-time notifications
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getSocketServer, NotificationPayload } from '../../../lib/realtime/socketServer';
import { withAuth } from '../../../lib/middleware/authMiddleware';

async function emitHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, room, notification } = req.body;

    if (!notification || !notification.type || !notification.title || !notification.message) {
      return res.status(400).json({ error: 'Invalid notification payload' });
    }

    const io = getSocketServer();
    if (!io) {
      // If Socket.io server is not initialized, log and return success
      // (notifications will be stored in DB and shown on next page load)
      console.warn('[Socket.io] Server not initialized, notification not sent in real-time');
      return res.status(200).json({
        success: true,
        message: 'Notification queued (Socket.io server not initialized)',
      });
    }

    const payload: NotificationPayload = {
      ...notification,
      timestamp: notification.timestamp || Date.now(),
    };

    if (userId) {
      // Emit to specific user
      const { emitToUser } = await import('../../../lib/realtime/socketServer');
      emitToUser(userId, payload);
    } else if (room) {
      // Emit to room
      const { emitToRoom } = await import('../../../lib/realtime/socketServer');
      emitToRoom(room, payload);
    } else {
      // Emit to all (use with caution)
      const { emitToAll } = await import('../../../lib/realtime/socketServer');
      emitToAll(payload);
    }

    return res.status(200).json({
      success: true,
      message: 'Notification emitted',
    });
  } catch (error) {
    console.error('[Socket.io] Failed to emit notification', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to emit notification',
    });
  }
}

// Note: This endpoint should be protected in production
// For now, we'll use withAuth for basic protection
export default withAuth(emitHandler);

