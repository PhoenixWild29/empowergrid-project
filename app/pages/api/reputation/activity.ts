import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/middleware/authMiddleware';
import { prisma } from '../../../lib/prisma';
import { z } from 'zod';

/**
 * Activity Type Enum
 */
const ACTIVITY_TYPES = {
  PROJECT_CREATED: { points: 10, description: 'Created a project' },
  PROJECT_COMPLETED: { points: 25, description: 'Successfully completed a project' },
  PROJECT_FUNDED: { points: 5, description: 'Funded a project' },
  MILESTONE_COMPLETED: { points: 15, description: 'Completed a milestone' },
  COMMENT_POSTED: { points: 1, description: 'Posted a comment' },
  PROFILE_VERIFIED: { points: 20, description: 'Verified profile' },
  FIRST_LOGIN: { points: 5, description: 'First login' },
  REFERRAL_SUCCESS: { points: 10, description: 'Successful referral' },
} as const;

/**
 * Log Activity Schema
 */
const LogActivitySchema = z.object({
  userId: z.string(),
  activityType: z.enum([
    'PROJECT_CREATED',
    'PROJECT_COMPLETED',
    'PROJECT_FUNDED',
    'MILESTONE_COMPLETED',
    'COMMENT_POSTED',
    'PROFILE_VERIFIED',
    'FIRST_LOGIN',
    'REFERRAL_SUCCESS',
  ]),
  metadata: z.record(z.any()).optional(),
});

/**
 * POST /api/reputation/activity
 * 
 * Log user activity that contributes to reputation
 * 
 * Features:
 * - Internal service endpoint
 * - Requires authentication
 * - Records activity type
 * - Updates user reputation
 * - Returns new reputation score
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request
    const validationResult = LogActivitySchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: validationResult.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const { userId, activityType, metadata } = validationResult.data;

    // Get activity points
    const activity = ACTIVITY_TYPES[activityType];
    if (!activity) {
      return res.status(400).json({
        error: 'Invalid activity type',
        message: 'Unknown activity type',
      });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        reputation: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: `No user found with ID: ${userId}`,
      });
    }

    // Update reputation
    const newReputation = user.reputation + activity.points;
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        reputation: newReputation,
      },
    });

    // Log activity (in production, create an Activity model)
    console.log(`Activity logged: ${activityType} for user ${userId}`, {
      previousReputation: user.reputation,
      pointsAwarded: activity.points,
      newReputation,
      metadata,
    });

    return res.status(200).json({
      success: true,
      message: 'Activity logged successfully',
      data: {
        userId: user.id,
        username: user.username,
        activityType,
        pointsAwarded: activity.points,
        previousReputation: user.reputation,
        newReputation,
      },
    });
  } catch (error) {
    console.error('Log activity error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to log activity',
    });
  }
}

export default withAuth(handler);






