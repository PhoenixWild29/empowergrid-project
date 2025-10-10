import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import * as z from 'zod';

const prisma = new PrismaClient();

const UpdateTransactionSchema = z.object({
  amount: z.number().positive().optional(),
  transactionHash: z.string().optional(),
});

/**
 * WO-173: Transaction Management API Endpoints
 * 
 * GET /api/admin/transactions/[id] - Get transaction by ID
 * PUT /api/admin/transactions/[id] - Update transaction
 * DELETE /api/admin/transactions/[id] - Delete transaction
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid transaction ID' });
  }

  // Note: In production, add authentication middleware here
  // const user = await getAuthenticatedUser(req);
  // if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

  try {
    if (req.method === 'GET') {
      // GET TRANSACTION BY ID
      const transaction = await prisma.funding.findUnique({
        where: { id },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              targetAmount: true,
              currentAmount: true,
              creator: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                },
              },
            },
          },
          funder: {
            select: {
              id: true,
              username: true,
              email: true,
              walletAddress: true,
            },
          },
        },
      });

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      return res.status(200).json({
        success: true,
        transaction,
      });
    } else if (req.method === 'PUT') {
      // UPDATE TRANSACTION
      const validation = UpdateTransactionSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors,
        });
      }

      // Check if transaction exists
      const existingTransaction = await prisma.funding.findUnique({
        where: { id },
      });

      if (!existingTransaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Update transaction
      const updatedTransaction = await prisma.funding.update({
        where: { id },
        data: validation.data,
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

      return res.status(200).json({
        success: true,
        transaction: updatedTransaction,
      });
    } else if (req.method === 'DELETE') {
      // DELETE TRANSACTION
      // Check if transaction exists
      const existingTransaction = await prisma.funding.findUnique({
        where: { id },
      });

      if (!existingTransaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Delete transaction
      await prisma.funding.delete({
        where: { id },
      });

      return res.status(204).end();
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
