/**
 * GET /api/escrow/user/contracts
 * 
 * WO-85: Fetch all escrow contracts for authenticated user
 * 
 * Returns contracts where user is either creator or funder
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { withAuth } from '../../../../lib/middleware/authMiddleware';

async function getUserContracts(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = (req as any).userId;
    const userWallet = (req as any).userWallet;

    // WO-85: Fetch contracts where user is creator
    const creatorContracts = await prisma.escrowContract.findMany({
      where: {
        createdBy: userId,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        deposits: {
          select: {
            id: true,
            amount: true,
            transactionStatus: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // WO-85: Fetch contracts where user is funder
    const funderContracts = await prisma.escrowContract.findMany({
      where: {
        deposits: {
          some: {
            depositorId: userId,
          },
        },
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        deposits: {
          where: {
            depositorId: userId,
          },
          select: {
            id: true,
            amount: true,
            transactionStatus: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // WO-85: Calculate statistics
    const totalContracts = new Set([
      ...creatorContracts.map(c => c.id),
      ...funderContracts.map(c => c.id),
    ]).size;

    const activeFunding = [...creatorContracts, ...funderContracts].reduce(
      (sum, c) => sum + c.currentBalance,
      0
    );

    // Get milestone data
    const allProjectIds = [...new Set([
      ...creatorContracts.map(c => c.projectId),
      ...funderContracts.map(c => c.projectId),
    ])];

    const milestones = await prisma.milestone.findMany({
      where: {
        projectId: {
          in: allProjectIds,
        },
      },
      select: {
        id: true,
        status: true,
        projectId: true,
      },
    });

    const completedMilestones = milestones.filter(m => m.status === 'RELEASED').length;
    const pendingReleases = milestones.filter(m => m.status === 'SUBMITTED').length;

    // WO-85: Format contracts for dashboard
    const formattedCreatorContracts = creatorContracts.map(contract => {
      const projectMilestones = milestones.filter(m => m.projectId === contract.projectId);
      
      return {
        id: contract.id,
        contractId: contract.contractId,
        projectId: contract.projectId,
        project: contract.project,
        fundingTarget: contract.fundingTarget,
        currentBalance: contract.currentBalance,
        status: contract.status,
        createdAt: contract.createdAt,
        isCreator: true,
        totalMilestones: projectMilestones.length,
        completedMilestones: projectMilestones.filter(m => m.status === 'RELEASED').length,
        alerts: contract.status === 'EMERGENCY_STOPPED' 
          ? ['Contract in emergency stop state']
          : [],
      };
    });

    const formattedFunderContracts = funderContracts.map(contract => {
      const yourInvestment = contract.deposits.reduce((sum, d) => sum + d.amount, 0);
      const projectMilestones = milestones.filter(m => m.projectId === contract.projectId);

      return {
        id: contract.id,
        contractId: contract.contractId,
        projectId: contract.projectId,
        project: contract.project,
        fundingTarget: contract.fundingTarget,
        currentBalance: contract.currentBalance,
        status: contract.status,
        createdAt: contract.createdAt,
        isCreator: false,
        yourInvestment,
        totalMilestones: projectMilestones.length,
        completedMilestones: projectMilestones.filter(m => m.status === 'RELEASED').length,
        nextRelease: projectMilestones.length > 0 && projectMilestones.some(m => m.status !== 'RELEASED') ? {
          amount: yourInvestment * 0.20, // Simplified estimate
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
        } : null,
      };
    });

    // Combine and deduplicate
    const allContracts = [
      ...formattedCreatorContracts,
      ...formattedFunderContracts.filter(
        fc => !formattedCreatorContracts.some(cc => cc.id === fc.id)
      ),
    ];

    // Determine user role
    const userRole =
      creatorContracts.length > 0 && funderContracts.length > 0
        ? 'both'
        : creatorContracts.length > 0
        ? 'creator'
        : 'funder';

    return res.status(200).json({
      success: true,
      contracts: allContracts,
      userRole,
      statistics: {
        totalContracts,
        activeFunding,
        completedMilestones,
        pendingReleases,
      },
    });

  } catch (error) {
    console.error('[WO-85] Failed to fetch user contracts:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve contracts',
    });
  }
}

export default withAuth(getUserContracts);

