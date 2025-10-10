import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/middleware/authMiddleware';
import { prisma } from '../../../lib/prisma';
import { z } from 'zod';

/**
 * Update Reputation Schema
 */
const UpdateReputationSchema = z.object({
  userId: z.string(),
  reputation: z.number().int().min(0).max(10000),
  reason: z.string().optional(),
});

/**
 * POST /api/reputation/admin
 * 
 * Admin endpoint to manually update user reputation
 * 
 * Features:
 * - Admin only
 * - Direct reputation updates
 * - Audit logging
 * - Reason tracking
 */
async function updateReputation(req: NextApiRequest, res: NextApiResponse) {
  try {
    const adminUserId = (req as any).userId;
    const adminUserRole = (req as any).userRole;

    // Check if user is admin
    if (adminUserRole !== 'ADMIN') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only administrators can update reputation',
      });
    }

    // Validate request
    const validationResult = UpdateReputationSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: validationResult.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const { userId, reputation, reason } = validationResult.data;

    // Get user
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

    const previousReputation = user.reputation;

    // Update reputation
    await prisma.user.update({
      where: { id: userId },
      data: { reputation },
    });

    // Log admin action
    console.log(`Admin reputation update by ${adminUserId}`, {
      targetUser: userId,
      previousReputation,
      newReputation: reputation,
      reason: reason || 'Manual admin adjustment',
    });

    return res.status(200).json({
      success: true,
      message: 'Reputation updated successfully',
      data: {
        userId: user.id,
        username: user.username,
        previousReputation,
        newReputation: reputation,
        updatedBy: adminUserId,
        reason: reason || 'Admin adjustment',
      },
    });
  } catch (error) {
    console.error('Admin update reputation error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update reputation',
    });
  }
}

/**
 * Main handler
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return updateReputation(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Apply admin auth (check role within handler)
export default withAuth(handler);

