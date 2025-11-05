import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

/**
 * GET /api/reputation/[userId]
 * 
 * Retrieve user's current reputation score (read-only, public endpoint)
 * 
 * Features:
 * - Returns numeric reputation score
 * - Public endpoint (no auth required)
 * - Includes user identifier
 * - Error handling for invalid user IDs
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (typeof userId !== 'string') {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'User ID must be a valid string',
      });
    }

    // Get user reputation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        reputation: true,
        verified: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: `No user found with ID: ${userId}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        userId: user.id,
        username: user.username,
        reputation: user.reputation,
        verified: user.verified,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Get reputation error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve reputation score',
    });
  }
}

export default handler;






