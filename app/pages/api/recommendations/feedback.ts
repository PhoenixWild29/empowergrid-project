/**
 * POST /api/recommendations/feedback
 * 
 * WO-97: Submit feedback on recommendations
 * Allows users to provide thumbs up/down feedback
 * 
 * Features:
 * - Thumbs up (+1) or thumbs down (-1)
 * - Updates recommendation record
 * - Used to improve future recommendations
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { withAuth } from '../../../lib/middleware/authMiddleware';

/**
 * Feedback schema
 */
const FeedbackSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  feedback: z.enum(['-1', '0', '1']).transform(Number),
});

/**
 * POST /api/recommendations/feedback
 * 
 * Body: { projectId, feedback: -1 | 0 | 1 }
 * Returns: { success: boolean }
 */
async function submitFeedback(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = (req as any).userId;

    // Validate request body
    const validation = FeedbackSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const { projectId, feedback } = validation.data;

    // Find existing recommendation
    const recommendation = await prisma.recommendation.findFirst({
      where: {
        userId,
        projectId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (recommendation) {
      // Update existing recommendation
      await prisma.recommendation.update({
        where: { id: recommendation.id },
        data: {
          feedback,
          feedbackAt: new Date(),
        },
      });
    } else {
      // Create new recommendation record with feedback
      await prisma.recommendation.create({
        data: {
          userId,
          projectId,
          score: 50, // Default score
          reason: 'User feedback',
          algorithm: 'feedback',
          feedback,
          feedbackAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
    }

    // Also track as behavior
    const actionType = feedback === 1 ? 'bookmarked' : 'viewed';
    await prisma.userBehavior.create({
      data: {
        userId,
        projectId,
        actionType,
        metadata: { feedbackSource: 'recommendation', feedback },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
    });

  } catch (error) {
    console.error('[WO-97] Submit feedback error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to submit feedback',
    });
  }
}

export default withAuth(submitFeedback);

