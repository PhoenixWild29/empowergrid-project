/**
 * POST /api/behavior/track
 * 
 * WO-97: Track user behavior for personalized recommendations
 * Records user interactions with projects
 * 
 * Features:
 * - Track views, bookmarks, funding, shares, comparisons
 * - Store duration for viewed actions
 * - Optional metadata
 * - Anonymous tracking for non-authenticated users (future)
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { withOptionalAuth } from '../../../lib/middleware/authMiddleware';

/**
 * Behavior tracking schema
 */
const TrackBehaviorSchema = z.object({
  projectId: z.string()
    .min(1, 'Project ID is required'),
  
  actionType: z.enum(['viewed', 'bookmarked', 'funded', 'shared', 'compared'])
    .describe('Type of user action'),
  
  duration: z.number()
    .int()
    .positive()
    .optional()
    .describe('Duration in seconds (for viewed actions)'),
  
  metadata: z.record(z.any())
    .optional()
    .describe('Additional context data'),
});

/**
 * POST /api/behavior/track
 * 
 * Body: { projectId, actionType, duration?, metadata? }
 * Returns: { success: boolean, behaviorId?: string }
 */
async function trackBehavior(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user ID from auth middleware (optional)
    const userId = (req as any).userId;

    // For now, require authentication
    // In future, could support anonymous tracking with session IDs
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be logged in to track behavior',
      });
    }

    // Validate request body
    const validation = TrackBehaviorSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const { projectId, actionType, duration, metadata } = validation.data;

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, title: true },
    });

    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
        message: `No project found with ID: ${projectId}`,
      });
    }

    // Record behavior
    const behavior = await prisma.userBehavior.create({
      data: {
        userId,
        projectId,
        actionType,
        duration,
        metadata: metadata || undefined,
      },
    });

    // Update user preferences based on behavior (async, don't await)
    updateUserPreferences(userId, projectId, actionType).catch(err => {
      console.error('[WO-97] Failed to update user preferences:', err);
    });

    return res.status(201).json({
      success: true,
      behaviorId: behavior.id,
      message: 'Behavior tracked successfully',
    });

  } catch (error) {
    console.error('[WO-97] Track behavior error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to track behavior',
    });
  }
}

/**
 * Update user preferences based on behavior patterns
 * This runs asynchronously and learns from user actions
 */
async function updateUserPreferences(
  userId: string,
  projectId: string,
  actionType: string
): Promise<void> {
  try {
    // Get project details
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        category: true,
        location: true,
        energyCapacity: true,
        targetAmount: true,
      },
    });

    if (!project) return;

    // Get or create user preferences
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      // Create initial preferences
      preferences = await prisma.userPreferences.create({
        data: {
          userId,
          preferredCategories: [project.category],
          preferredLocations: [project.location],
        },
      });
      return;
    }

    // Update preferences based on positive signals (funded, bookmarked)
    if (actionType === 'funded' || actionType === 'bookmarked') {
      const updates: any = {};

      // Add category if not already in preferences
      if (!preferences.preferredCategories.includes(project.category)) {
        updates.preferredCategories = [...preferences.preferredCategories, project.category];
      }

      // Add location if not already in preferences
      if (!preferences.preferredLocations.includes(project.location)) {
        updates.preferredLocations = [...preferences.preferredLocations, project.location];
      }

      // Update capacity range preferences
      if (project.energyCapacity) {
        const currentMin = preferences.minCapacity || project.energyCapacity;
        const currentMax = preferences.maxCapacity || project.energyCapacity;
        
        updates.minCapacity = Math.min(currentMin, project.energyCapacity);
        updates.maxCapacity = Math.max(currentMax, project.energyCapacity);
      }

      // Update funding range preferences
      const currentMinFunding = preferences.minFunding || project.targetAmount;
      const currentMaxFunding = preferences.maxFunding || project.targetAmount;
      
      updates.minFunding = Math.min(currentMinFunding, project.targetAmount);
      updates.maxFunding = Math.max(currentMaxFunding, project.targetAmount);

      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        await prisma.userPreferences.update({
          where: { userId },
          data: updates,
        });
      }
    }
  } catch (error) {
    console.error('[WO-97] Update preferences error:', error);
    // Don't throw - this is best-effort
  }
}

export default withOptionalAuth(trackBehavior);

