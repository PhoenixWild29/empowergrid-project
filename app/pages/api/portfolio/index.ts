/**
 * GET /api/portfolio
 * 
 * WO-87: User portfolio data
 * Returns all investments for the authenticated user
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { withAuth } from '../../../lib/middleware/authMiddleware';

async function getPortfolio(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = (req as any).userId;

    // Fetch all user's funding contributions
    const investments = await prisma.funding.findMany({
      where: {
        funderId: userId,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            category: true,
            status: true,
            targetAmount: true,
            currentAmount: true,
            energyCapacity: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate portfolio summary
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const activeProjects = new Set(investments.map(inv => inv.projectId)).size;

    return res.status(200).json({
      success: true,
      portfolio: {
        totalInvested,
        activeProjects,
        totalInvestments: investments.length,
      },
      investments: investments.map(inv => ({
        id: inv.id,
        projectId: inv.projectId,
        amount: inv.amount,
        currency: inv.currency || 'USDC',
        status: inv.status || 'CONFIRMED',
        transactionHash: inv.transactionHash,
        createdAt: inv.createdAt,
        project: inv.project,
      })),
    });

  } catch (error) {
    console.error('[WO-87] Portfolio error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch portfolio',
    });
  }
}

export default withAuth(getPortfolio);


