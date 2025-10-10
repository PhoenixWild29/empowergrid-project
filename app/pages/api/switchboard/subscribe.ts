/**
 * POST /api/switchboard/subscribe
 * 
 * WO-131: Subscribe to Switchboard oracle feed
 * 
 * Features:
 * - Feed subscription configuration
 * - Webhook integration
 * - Cost optimization
 * - Equipment compatibility validation
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/middleware/authMiddleware';
import { switchboardSubscriptionService } from '../../../lib/services/oracle/switchboardSubscriptionService';
import { z } from 'zod';

// Subscription request schema
const SubscribeRequestSchema = z.object({
  projectId: z.string().cuid(),
  feedType: z.enum(['ENERGY_PRODUCTION', 'WEATHER', 'EQUIPMENT_STATUS']),
  location: z.string().optional(),
  equipmentType: z.string().optional(),
  webhookUrl: z.string().url().optional(),
  budget: z.number().positive().optional(),
});

async function switchboardSubscribeHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    console.log('[WO-131] Feed subscription request');

    // Validate request
    const validatedData = SubscribeRequestSchema.parse(req.body);

    // Create subscription
    const subscription = await switchboardSubscriptionService.createSubscription({
      projectId: validatedData.projectId,
      feedType: validatedData.feedType as any,
      location: validatedData.location,
      equipmentType: validatedData.equipmentType,
      webhookUrl: validatedData.webhookUrl,
      budget: validatedData.budget,
    });

    const responseTime = Date.now() - startTime;

    return res.status(201).json({
      success: true,
      message: 'Feed subscription created successfully',
      subscription: {
        id: subscription.id,
        subscriptionId: subscription.id, // For compatibility
        projectId: subscription.projectId,
        feedId: subscription.feedId,
        feedAddress: subscription.feedAddress,
        feedType: subscription.feedType,
        status: subscription.status,
        webhookUrl: subscription.webhookUrl,
        subscriptionCost: subscription.subscriptionCost,
        createdAt: subscription.createdAt,
      },
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[WO-131] Subscription error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.issues,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create feed subscription',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuth(switchboardSubscribeHandler);



