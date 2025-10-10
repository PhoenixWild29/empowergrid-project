/**
 * GET /api/governance/proposals/[proposalId]
 * 
 * WO-134: Get proposal details
 * 
 * Features:
 * - Complete proposal details
 * - Current voting results
 * - Vote breakdown
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../lib/middleware/authMiddleware';
import { prisma } from '../../../../lib/prisma';

async function proposalDetailHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { proposalId } = req.query;

    if (!proposalId || typeof proposalId !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'proposalId parameter is required',
      });
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        proposer: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
          },
        },
        votes: {
          include: {
            voter: {
              select: {
                id: true,
                username: true,
                walletAddress: true,
              },
            },
          },
        },
      },
    });

    if (!proposal) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Proposal not found',
      });
    }

    // Calculate voting results
    const votesFor = proposal.votes.filter((v: any) => v.support).reduce((sum: number, v: any) => sum + v.weight, 0);
    const votesAgainst = proposal.votes.filter((v: any) => !v.support).reduce((sum: number, v: any) => sum + v.weight, 0);
    const totalVotes = votesFor + votesAgainst;

    // Check if quorum is met
    const assumedTotalPower = 10000; // Simulated total voting power
    const participationRate = (totalVotes / assumedTotalPower) * 100;
    const quorumMet = participationRate >= proposal.minQuorum;

    // Check if voting is still active
    const now = new Date();
    const isActive = proposal.votingEndsAt && now < new Date(proposal.votingEndsAt);

    return res.status(200).json({
      success: true,
      proposal: {
        ...proposal,
        votingResults: {
          votesFor,
          votesAgainst,
          totalVotes,
          voterCount: proposal.votes.length,
          participationRate: Math.round(participationRate * 10) / 10,
          quorumMet,
          isActive,
          timeRemaining: isActive && proposal.votingEndsAt
            ? new Date(proposal.votingEndsAt).getTime() - now.getTime()
            : 0,
        },
      },
    });

  } catch (error) {
    console.error('[WO-134] Proposal detail error:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch proposal',
    });
  }
}

export default withAuth(proposalDetailHandler);



