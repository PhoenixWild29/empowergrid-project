import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { withAuth } from '../../../lib/middleware/authMiddleware';
import { z } from 'zod';

/**
 * User Profile Update Schema
 */
const UpdateProfileSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  email: z.string().email().optional(),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional(),
  avatar: z.string().url().optional(),
  socialLinks: z.record(z.string()).optional(),
});

/**
 * GET /api/users/profile
 * 
 * Retrieve authenticated user's profile
 * 
 * Features:
 * - Requires authentication
 * - Returns complete user profile
 * - Includes user stats
 * - Proper error handling
 */
async function getProfile(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userStats: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.username,
        email: user.email,
        role: user.role,
        reputation: user.reputation,
        verified: user.verified,
        avatar: user.avatar,
        bio: user.bio,
        website: user.website,
        socialLinks: user.socialLinks,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        stats: user.userStats,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve profile',
    });
  }
}

/**
 * PUT /api/users/profile
 * 
 * Update authenticated user's profile
 * 
 * Features:
 * - Requires authentication
 * - Validates input format
 * - Updates user profile
 * - Returns updated profile
 */
async function updateProfile(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    // Validate request body
    const validationResult = UpdateProfileSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: validationResult.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const updates = validationResult.data;

    // Check if username is already taken (if being updated)
    if (updates.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: updates.username,
          id: { not: userId },
        },
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'Username already taken',
          details: [
            {
              field: 'username',
              message: 'This username is already in use',
            },
          ],
        });
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
      include: {
        userStats: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        walletAddress: updatedUser.walletAddress,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        reputation: updatedUser.reputation,
        verified: updatedUser.verified,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
        website: updatedUser.website,
        socialLinks: updatedUser.socialLinks,
        updatedAt: updatedUser.updatedAt,
        stats: updatedUser.userStats,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update profile',
    });
  }
}

/**
 * Main handler with authentication
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = (req as any).userId;

  if (req.method === 'GET') {
    return getProfile(req, res, userId);
  } else if (req.method === 'PUT') {
    return updateProfile(req, res, userId);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Apply authentication middleware
export default withAuth(handler);

