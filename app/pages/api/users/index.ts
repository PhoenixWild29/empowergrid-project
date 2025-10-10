import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

/**
 * GET /api/users
 * 
 * List users with pagination and filtering
 * 
 * Features:
 * - Public endpoint
 * - Pagination support
 * - Role-based filtering
 * - Search by username
 * - Excludes sensitive data
 */
async function listUsers(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      page = '1',
      limit = '20',
      role,
      search,
      verified,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100); // Max 100 per page
    const skip = (pageNum - 1) * limitNum;

    // Build filter conditions
    const where: any = {};

    if (role && typeof role === 'string') {
      where.role = role;
    }

    if (search && typeof search === 'string') {
      where.username = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (verified !== undefined) {
      where.verified = verified === 'true';
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get users
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limitNum,
      select: {
        id: true,
        username: true,
        role: true,
        reputation: true,
        verified: true,
        avatar: true,
        bio: true,
        createdAt: true,
        userStats: {
          select: {
            projectsCreated: true,
            projectsFunded: true,
            successfulProjects: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      success: true,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      users,
    });
  } catch (error) {
    console.error('List users error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve users',
    });
  }
}

/**
 * Main handler
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return listUsers(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

export default handler;

