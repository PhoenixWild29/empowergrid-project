/**
 * GET /api/switchboard/subscriptions/project/[projectId]
 * 
 * WO-131: Get all subscriptions for a project
 * 
 * Features:
 * - Subscription status tracking
 * - Real-time status updates
 * - Audit logs
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../../lib/middleware/authMiddleware';
import { switchboardSubscriptionService } from '../../../../../lib/services/oracle/switchboardSubscriptionService';

async function projectSubscriptionsHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const { projectId } = req.query;

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'projectId parameter is required',
      });
    }

    console.log('[WO-131] Fetching subscriptions for project:', projectId);

    const subscriptions = await switchboardSubscriptionService.getProjectSubscriptions(projectId);

    const responseTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      subscriptions,
      total: subscriptions.length,
      summary: {
        active: subscriptions.filter(s => s.status === 'ACTIVE').length,
        paused: subscriptions.filter(s => s.status === 'PAUSED').length,
        cancelled: subscriptions.filter(s => s.status === 'CANCELLED').length,
        totalCost: subscriptions
          .filter(s => s.status === 'ACTIVE')
          .reduce((sum, s) => sum + s.subscriptionCost, 0),
      },
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[WO-131] Project subscriptions error:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve project subscriptions',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuth(projectSubscriptionsHandler);



