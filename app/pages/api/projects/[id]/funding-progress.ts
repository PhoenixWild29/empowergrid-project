/**
 * GET /api/projects/[id]/funding-progress
 * 
 * WO-72: Query funding progress and contributor list
 * 
 * Features:
 * - Current funding amount
 * - Funding goal
 * - Percentage completed
 * - List of contributors
 * - Funding timeline
 * - Transaction history
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { withOptionalAuth } from '../../../../lib/middleware/authMiddleware';

async function getFundingProgress(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (typeof id !== 'string') {
      return res.status(400).json({
        error: 'Invalid project ID',
      });
    }

    // Get project with funding information
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        targetAmount: true,
        currentAmount: true,
        status: true,
        createdAt: true,
        fundedAt: true,
        fundings: {
          include: {
            funder: {
              select: {
                id: true,
                username: true,
                walletAddress: true,
                avatar: true,
                reputation: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
      });
    }

    // Calculate funding metrics
    const fundingProgress = project.targetAmount > 0
      ? (project.currentAmount / project.targetAmount) * 100
      : 0;

    const remaining = Math.max(0, project.targetAmount - project.currentAmount);
    const uniqueFunders = new Set(project.fundings.map(f => f.funderId)).size;
    
    // Calculate funding velocity
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(project.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const fundingVelocity = daysSinceCreation > 0
      ? project.fundings.length / daysSinceCreation
      : 0;

    // Group fundings by day for timeline
    const fundingTimeline = generateFundingTimeline(project.fundings);

    return res.status(200).json({
      success: true,
      fundingStatus: {
        currentAmount: project.currentAmount,
        targetAmount: project.targetAmount,
        remainingAmount: remaining,
        fundingProgress: fundingProgress.toFixed(2),
        percentComplete: fundingProgress.toFixed(1),
        goalReached: fundingProgress >= 100,
        status: project.status,
      },
      statistics: {
        totalContributions: project.fundings.length,
        uniqueFunders,
        averageContribution: project.fundings.length > 0
          ? project.currentAmount / project.fundings.length
          : 0,
        fundingVelocity: fundingVelocity.toFixed(2),
        daysSinceCreation,
        fundedAt: project.fundedAt,
      },
      contributors: project.fundings.map(f => ({
        id: f.id,
        funder: {
          id: f.funder.id,
          username: f.funder.username,
          walletAddress: f.funder.walletAddress,
          avatar: f.funder.avatar,
          reputation: f.funder.reputation,
        },
        amount: f.amount,
        transactionHash: f.transactionHash,
        contributedAt: f.createdAt,
      })),
      timeline: fundingTimeline,
    });

  } catch (error) {
    console.error('[WO-72] Funding progress error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve funding progress',
    });
  }
}

/**
 * Generate funding timeline by day
 */
function generateFundingTimeline(fundings: any[]) {
  const timeline: Record<string, { date: string; amount: number; count: number }> = {};

  fundings.forEach(funding => {
    const date = new Date(funding.createdAt).toISOString().split('T')[0];
    if (!timeline[date]) {
      timeline[date] = { date, amount: 0, count: 0 };
    }
    timeline[date].amount += funding.amount;
    timeline[date].count += 1;
  });

  return Object.values(timeline).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export default withOptionalAuth(getFundingProgress);

