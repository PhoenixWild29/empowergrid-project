/**
 * POST /api/notifications/[notificationId]/read
 * 
 * WO-139: Mark notification as read
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../lib/middleware/authMiddleware';
import { prisma } from '../../../../lib/prisma';

async function markAsReadHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { notificationId } = req.query;

    await prisma.notification.update({
      where: { id: notificationId as string },
      data: { read: true },
    });

    return res.status(200).json({ success: true });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
    });
  }
}

export default withAuth(markAsReadHandler);



