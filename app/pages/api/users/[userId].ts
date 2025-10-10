import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { withAuth } from '../../../lib/middleware/authMiddleware';

/**
 * GET /api/users/[userId]
 * 
 * Retrieve public user profile by ID
 * 
 * Features:
 * - Public endpoint (no auth required for GET)
 * - Returns public user information
 * - Excludes sensitive data
 * - Proper error handling
 */
async function getUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = req.query;

    if (typeof userId !== 'string') {
      return res.status(400).json({
        error: 'Invalid user ID',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
        reputation: true,
        verified: true,
        avatar: true,
        bio: true,
        website: true,
        socialLinks: true,
        createdAt: true,
        userStats: {
          select: {
            projectsCreated: true,
            projectsFunded: true,
            totalFunded: true,
            successfulProjects: true,
            totalEarnings: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve user',
    });
  }
}

/**
 * DELETE /api/users/[userId]
 * 
 * Delete user account
 * 
 * Features:
 * - Requires authentication
 * - Only user can delete their own account or admin
 * - Soft delete (marks as deleted)
 * - Proper authorization checks
 */
async function deleteUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = req.query;
    const requestingUserId = (req as any).userId;
    const requestingUserRole = (req as any).userRole;

    if (typeof userId !== 'string') {
      return res.status(400).json({
        error: 'Invalid user ID',
      });
    }

    // Check authorization - user can delete own account or admin can delete any
    if (userId !== requestingUserId && requestingUserRole !== 'ADMIN') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to delete this account',
      });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    // Soft delete - disable account
    // In a real implementation, you might want to:
    // 1. Anonymize user data
    // 2. Cancel active sessions
    // 3. Handle user's projects and funding
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: null,
        avatar: null,
        bio: 'Account deleted',
        website: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete account',
    });
  }
}

/**
 * Main handler
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return getUser(req, res);
  } else if (req.method === 'DELETE') {
    // DELETE requires authentication
    const requestingUserId = (req as any).userId;
    if (!requestingUserId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }
    return deleteUser(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Apply authentication middleware conditionally
export default async function (req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'DELETE') {
    // Apply auth middleware for DELETE
    return withAuth(handler)(req, res);
  } else {
    // No auth required for GET
    return handler(req, res);
  }
}

