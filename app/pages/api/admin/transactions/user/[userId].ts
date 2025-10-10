import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import * as z from 'zod';

const prisma = new PrismaClient();

const QuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

/**
 * WO-173: Transaction Management API Endpoints
 * 
 * GET /api/admin/transactions/user/[userId] - Get all transactions for a user
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = req.query;

  if (typeof userId !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  // Note: In production, add authentication middleware here
  // const authUser = await getAuthenticatedUser(req);
  // if (!authUser || (authUser.role !== 'ADMIN' && authUser.id !== userId)) {
  //   return res.status(403).json({ error: 'Forbidden' });
  // }

  try {
    if (req.method === 'GET') {
      const queryValidation = QuerySchema.safeParse(req.query);
      
      if (!queryValidation.success) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: queryValidation.error.errors,
        });
      }

      const { page = '1', limit = '20' } = queryValidation.data;
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, email: true },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get transactions for user
      const [transactions, totalCount] = await Promise.all([
        prisma.funding.findMany({
          where: { funderId: userId },
          skip,
          take: limitNum,
          include: {
            project: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.funding.count({ where: { funderId: userId } }),
      ]);

      return res.status(200).json({
        success: true,
        user,
        transactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitNum),
        },
      });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[Transaction Management API Error]:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
