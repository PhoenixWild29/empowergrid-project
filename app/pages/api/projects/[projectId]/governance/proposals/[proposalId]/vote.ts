/**
 * POST /api/projects/[projectId]/governance/proposals/[proposalId]/vote
 * 
 * WO-148: Cast vote on project-specific proposal
 * 
 * Features:
 * - Vote recording
 * - Voter eligibility validation
 * - Project-specific rules
 * - Timestamp tracking
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../../../../lib/middleware/authMiddleware';
import { prisma } from '../../../../../../../lib/prisma';
import { z } from 'zod';

const VoteSchema = z.object({
  support: z.boolean(),
});

async function projectProposalVoteHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { projectId, proposalId } = req.query;
    const userId = (req as any).user?.id;

    const voteData = VoteSchema.parse(req.body);

    // Validate proposal exists and belongs to project
    const proposal = await prisma.proposal.findFirst({
      where: {
        id: proposalId as string,
        targetProjectId: projectId as string,
      },
    });

    if (!proposal) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Proposal not found for this project',
      });
    }

    // WO-148: Validate voter eligibility (project-specific)
    const isEligible = await checkVoterEligibility(projectId as string, userId!);
    
    if (!isEligible) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only project stakeholders can vote on project proposals',
      });
    }

    // Check if already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        proposalId_voterId: {
          proposalId: proposalId as string,
          voterId: userId!,
        },
      },
    });

    if (existingVote) {
      return res.status(400).json({
        error: 'Already voted',
        message: 'You have already voted on this proposal',
      });
    }

    // Calculate voting weight based on project involvement
    const weight = await calculateVotingWeight(projectId as string, userId!);

    // Record vote
    const vote = await prisma.vote.create({
      data: {
        proposalId: proposalId as string,
        voterId: userId!,
        support: voteData.support,
        weight,
        tokenBalance: weight,
        tokenSymbol: 'GRID',
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
    console.error('[WO-148] Project vote error:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

async function checkVoterEligibility(projectId: string, userId: string): Promise<boolean> {
  // Check if user is creator, funder, or has funded the project
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { creatorId: userId },
        {
          fundings: {
            some: { funderId: userId },
          },
        },
      ],
    },
  });

  return !!project;
}

async function calculateVotingWeight(projectId: string, userId: string): Promise<number> {
  // Calculate weight based on funding amount
  const funding = await prisma.funding.findFirst({
    where: {
      projectId,
      funderId: userId,
    },
  });

  return funding ? Math.floor(funding.amount) : 1; // 1 vote for creator
}

export default withAuth(projectProposalVoteHandler);



