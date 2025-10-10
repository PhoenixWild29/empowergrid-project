/**
 * POST /api/verification/manual-review
 * 
 * WO-129: Create manual review task
 * 
 * Features:
 * - Manual review task creation
 * - Multi-party approval workflow
 * - Task ID generation
 * - Initial status: 'pending'
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/middleware/authMiddleware';
import { ManualReviewRequestSchema } from '../../../lib/schemas/metricVerificationSchemas';
import { prisma } from '../../../lib/prisma';

async function manualReviewHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const validatedData = ManualReviewRequestSchema.parse(req.body);
    const userId = (req as any).user?.id;

    // Create verification audit for manual review request
    const audit = await (prisma as any).verificationAudit.create({
      data: {
        milestoneId: validatedData.milestoneId,
        action: 'MANUAL_REVIEW_REQUESTED',
        newStatus: 'PENDING_MANUAL_REVIEW',
        triggeredBy: userId || 'unknown',
        reason: validatedData.reason,
        metadata: {
          priority: validatedData.priority,
          assignTo: validatedData.assignTo,
          attachments: validatedData.attachments,
        },
      },
    });

    return res.status(201).json({
      success: true,
      manualReview: {
        taskId: audit.id,
        status: 'pending',
        milestoneId: validatedData.milestoneId,
        priority: validatedData.priority,
        createdAt: audit.createdAt,
        assignedTo: validatedData.assignTo,
      },
      message: 'Manual review task created successfully',
    });

  } catch (error) {
    console.error('[WO-129] Manual review error:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create manual review task',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuth(manualReviewHandler);



