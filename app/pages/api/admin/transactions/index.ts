import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import * as z from 'zod';

const prisma = new PrismaClient();

// Zod schemas
const CreateTransactionSchema = z.object({
  projectId: z.string().cuid('Invalid project ID'),
  funderId: z.string().cuid('Invalid funder ID'),
  amount: z.number().positive('Amount must be positive'),
  transactionHash: z.string(),
  currency: z.string().optional(),
});

const QuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  projectId: z.string().optional(),
  funderId: z.string().optional(),
  type: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  amountMin: z.string().optional(),
  amountMax: z.string().optional(),
  search: z.string().optional(),
});

/**
 * WO-173: Transaction Management API Endpoints
 * 
 * POST /api/admin/transactions - Create new transaction record
 * GET /api/admin/transactions - List transactions with pagination and filtering
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Note: In production, add authentication middleware here
  // const user = await getAuthenticatedUser(req);
  // if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

  try {
    if (req.method === 'POST') {
      // CREATE TRANSACTION RECORD
      const validation = CreateTransactionSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors,
        });
      }

      const { projectId, funderId, amount, transactionHash, currency } = validation.data;

      // Verify project and funder exist
      const [project, funder] = await Promise.all([
        prisma.project.findUnique({ where: { id: projectId } }),
        prisma.user.findUnique({ where: { id: funderId } }),
      ]);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (!funder) {
        return res.status(404).json({ error: 'Funder not found' });
      }

      // Create transaction record using Funding model
      const transaction = await prisma.funding.create({
        data: {
          amount,
          transactionHash,
          currency: currency || 'USDC',
          project: {
            connect: { id: projectId },
          },
          funder: {
            connect: { id: funderId },
          },
        },
        include: {
          project: {
            select: {
              id: true,
              title: true,
            },
          },
          funder: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      return res.status(201).json({
        success: true,
        transaction,
      });
    } else if (req.method === 'GET') {
      // LIST TRANSACTIONS
      const queryValidation = QuerySchema.safeParse(req.query);
      
      if (!queryValidation.success) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: queryValidation.error.errors,
        });
      }

      const {
        page = '1',
        limit = '10',
        projectId,
        funderId,
        dateFrom,
        dateTo,
        amountMin,
        amountMax,
        search,
      } = queryValidation.data;

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause
      const where: any = {};

      if (projectId) {
        where.projectId = projectId;
      }

      if (funderId) {
        where.funderId = funderId;
      }

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) {
          where.createdAt.gte = new Date(dateFrom);
        }
        if (dateTo) {
          where.createdAt.lte = new Date(dateTo);
        }
      }

      if (amountMin || amountMax) {
        where.amount = {};
        if (amountMin) {
          where.amount.gte = parseFloat(amountMin);
        }
        if (amountMax) {
          where.amount.lte = parseFloat(amountMax);
        }
      }

      if (search) {
        where.OR = [
          { transactionHash: { contains: search, mode: 'insensitive' } },
          { project: { title: { contains: search, mode: 'insensitive' } } },
          { funder: { username: { contains: search, mode: 'insensitive' } } },
        ];
      }

      // Get transactions with pagination
      const [transactions, totalCount] = await Promise.all([
        prisma.funding.findMany({
          where,
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
        prisma.funding.count({ where }),
      ]);

      return res.status(200).json({
        success: true,
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
