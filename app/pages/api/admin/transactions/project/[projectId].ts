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
 * GET /api/admin/transactions/project/[projectId] - Get all transactions for a project
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { projectId } = req.query;

  if (typeof projectId !== 'string') {
    return res.status(400).json({ error: 'Invalid project ID' });
  }

  // Note: In production, add authentication middleware here
  // const user = await getAuthenticatedUser(req);
  // if (!user || (user.role !== 'ADMIN' && !isProjectOwner(user.id, projectId))) {
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

      // Verify project exists
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, title: true },
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Get transactions for project
      const [transactions, totalCount] = await Promise.all([
        prisma.funding.findMany({
          where: { projectId },
          skip,
          take: limitNum,
          include: {
            funder: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.funding.count({ where: { projectId } }),
      ]);

      return res.status(200).json({
        success: true,
        project,
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
