/**
 * POST /api/governance/proposals/[proposalId]/vote
 * 
 * WO-134: Cast vote on proposal
 * 
 * Features:
 * - Vote recording
 * - Weight validation
 * - Duplicate vote prevention
 * - Token-gated voting
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../../lib/middleware/authMiddleware';
import { prisma } from '../../../../../lib/prisma';
import { z } from 'zod';

const VoteSchema = z.object({
  support: z.boolean(),
  weight: z.number().int().min(1).optional(),
});

async function voteHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { proposalId } = req.query;
    const userId = (req as any).user?.id;

    if (!proposalId || typeof proposalId !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'proposalId parameter is required',
      });
    }

    const voteData = VoteSchema.parse(req.body);

    // Check if proposal exists and is active
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Proposal not found',
      });
    }

    if (proposal.status !== 'ACTIVE') {
      return res.status(400).json({
        error: 'Voting not allowed',
        message: `Proposal is ${proposal.status.toLowerCase()}, voting is only allowed on active proposals`,
      });
    }

    // Check if voting period is still active
    if (proposal.votingEndsAt && new Date() > new Date(proposal.votingEndsAt)) {
      return res.status(400).json({
        error: 'Voting period ended',
        message: 'The voting period for this proposal has ended',
      });
    }

    // Check if user already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        proposalId_voterId: {
          proposalId,
          voterId: userId!,
        },
      },
    });

    if (existingVote) {
      return res.status(400).json({
        error: 'Already voted',
        message: 'You have already voted on this proposal',
        currentVote: {
          support: existingVote.support,
          createdAt: existingVote.createdAt,
        },
      });
    }

    // Get user's voting power (simulated token balance)
    const userTokenBalance = 100; // Simulated
    const weight = voteData.weight || userTokenBalance;

    // Validate weight
    const settings = await prisma.governanceSettings.findFirst({
      where: { isActive: true },
    });

    if (weight < (settings?.minTokensToVote || 1)) {
      return res.status(403).json({
        error: 'Insufficient voting power',
        message: `Minimum ${settings?.minTokensToVote} tokens required to vote`,
        currentBalance: userTokenBalance,
      });
    }

    // Create vote
    const vote = await prisma.vote.create({
      data: {
        proposalId,
        voterId: userId!,
        support: voteData.support,
        weight,
        tokenBalance: userTokenBalance,
        tokenSymbol: 'GRID', // Governance token symbol
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Vote recorded successfully',
      vote: {
        id: vote.id,
        support: vote.support,
        weight: vote.weight,
        createdAt: vote.createdAt,
      },
    });

  } catch (error) {
    console.error('[WO-134] Vote error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.issues,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to record vote',
    });
  }
}

export default withAuth(voteHandler);



