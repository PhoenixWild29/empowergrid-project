/**
 * PUT/DELETE /api/switchboard/subscriptions/[subscriptionId]
 * 
 * WO-131: Manage feed subscription lifecycle
 * 
 * Features:
 * - Update subscription configuration
 * - Cancel subscription
 * - Immediate effect confirmation
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../lib/middleware/authMiddleware';
import { switchboardSubscriptionService } from '../../../../lib/services/oracle/switchboardSubscriptionService';
import { z } from 'zod';

// Update subscription schema
const UpdateSubscriptionSchema = z.object({
  isActive: z.boolean().optional(),
  webhookUrl: z.string().url().optional(),
});

async function subscriptionManagementHandler(req: NextApiRequest, res: NextApiResponse) {
  const { subscriptionId } = req.query;

  if (!subscriptionId || typeof subscriptionId !== 'string') {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'subscriptionId parameter is required',
    });
  }

  const startTime = Date.now();

  try {
    if (req.method === 'PUT') {
      // Update subscription
      console.log('[WO-131] Updating subscription:', subscriptionId);

      const validatedData = UpdateSubscriptionSchema.parse(req.body);

      const subscription = await switchboardSubscriptionService.updateSubscription(
        subscriptionId,
        validatedData
      );

      const responseTime = Date.now() - startTime;

      return res.status(200).json({
        success: true,
        message: 'Subscription updated successfully',
        subscription: {
          id: subscription.id,
          status: subscription.status,
          webhookUrl: subscription.webhookUrl,
          updatedAt: subscription.updatedAt,
        },
        effectImmediate: true,
        metadata: {
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString(),
        },
      });

    } else if (req.method === 'DELETE') {
      // Cancel subscription
      console.log('[WO-131] Cancelling subscription:', subscriptionId);

      await switchboardSubscriptionService.cancelSubscription(subscriptionId);

      const responseTime = Date.now() - startTime;

      return res.status(200).json({
        success: true,
        message: 'Subscription cancelled successfully',
        subscriptionId,
        effectImmediate: true,
        metadata: {
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString(),
        },
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('[WO-131] Subscription management error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.issues,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to manage subscription',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuth(subscriptionManagementHandler);



