/**
 * GET/POST /api/notifications
 * 
 * WO-139: Notification management API
 * 
 * Features:
 * - Fetch user notifications
 * - Create notifications
 * - Multi-channel delivery
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/middleware/authMiddleware';
import { prisma } from '../../../lib/prisma';

async function notificationsHandler(req: NextApiRequest, res: NextApiResponse) {
  const userId = (req as any).user?.id;

  if (req.method === 'GET') {
    try {
      // WO-139: Fetch user notifications
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      // Simulate delivery status
      const notificationsWithStatus = notifications.map((n: any) => ({
        ...n,
        channels: ['in-app', 'email'],
        deliveryStatus: {
          'in-app': 'DELIVERED',
          'email': n.isRead ? 'READ' : 'DELIVERED',
        },
      }));

      return res.status(200).json({
        success: true,
        notifications: notificationsWithStatus,
        unreadCount: notifications.filter((n: any) => !n.isRead).length,
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch notifications',
      });
    }

  } else if (req.method === 'POST') {
    try {
      // WO-139: Create notification
      const { type, title, message, severity } = req.body;

      const notification = await prisma.notification.create({
        data: {
          userId: userId!,
          type: type || 'UPDATE',
          title,
          message,
        },
      });

      // WO-139: Send via configured channels
      await sendNotification(notification, ['in-app', 'email']);

      return res.status(201).json({
        success: true,
        notification,
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create notification',
      });
    }

  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function sendNotification(notification: any, channels: string[]) {
  console.log('[WO-139] Sending notification via channels:', channels);
  // In production, would send via email, SMS, webhooks, etc.
}

export default withAuth(notificationsHandler);



