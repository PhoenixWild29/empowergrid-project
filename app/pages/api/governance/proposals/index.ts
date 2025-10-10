/**
 * GET/POST /api/governance/proposals
 * 
 * WO-134: Governance proposal management
 * 
 * Features:
 * - Create proposals
 * - List proposals with filtering & pagination
 * - Input validation
 * - Consistent JSON responses
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../lib/middleware/authMiddleware';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';

// WO-134: Proposal creation schema
const CreateProposalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(5000),
  proposalType: z.enum(['GENERAL', 'PARAMETER_CHANGE', 'TREASURY_ALLOCATION', 'PROTOCOL_UPGRADE', 'EMERGENCY_ACTION']).default('GENERAL'),
  votingPeriodDays: z.number().int().min(1).max(30).default(7),
  minQuorum: z.number().int().min(1).max(100).default(10),
  realmsProposalId: z.string().optional(),
  realmsGovernance: z.string().optional(),
});

async function proposalsHandler(req: NextApiRequest, res: NextApiResponse) {
  const userId = (req as any).user?.id;

  if (req.method === 'POST') {
    // WO-134: Create proposal
    try {
      const validatedData = CreateProposalSchema.parse(req.body);

      // Check user has sufficient tokens (simulated)
      const settings = await prisma.governanceSettings.findFirst({
        where: { isActive: true },
      });

      const userTokenBalance = 1000; // Simulated token balance
      if (userTokenBalance < (settings?.proposalThreshold || 100)) {
        return res.status(403).json({
          error: 'Insufficient tokens',
          message: `Minimum ${settings?.proposalThreshold} tokens required to create proposals`,
          currentBalance: userTokenBalance,
        });
      }

      // Calculate voting period
      const votingStartsAt = new Date();
      const votingEndsAt = new Date(votingStartsAt);
      votingEndsAt.setDate(votingEndsAt.getDate() + validatedData.votingPeriodDays);

      // WO-134: Create proposal
      const proposal = await prisma.proposal.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          proposalType: validatedData.proposalType as any,
          proposerId: userId!,
          status: 'ACTIVE',
          votingStartsAt,
          votingEndsAt,
          minQuorum: validatedData.minQuorum,
          realmsProposalId: validatedData.realmsProposalId,
          realmsGovernance: validatedData.realmsGovernance,
          onChainVotingUrl: validatedData.realmsProposalId
            ? `https://app.realms.today/dao/${validatedData.realmsGovernance}/proposal/${validatedData.realmsProposalId}`
            : undefined,
        },
        include: {
          proposer: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
            },
          },
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Proposal created successfully',
        proposal: {
          id: proposal.id,
          title: proposal.title,
          status: proposal.status,
          proposer: proposal.proposer,
          votingEndsAt: proposal.votingEndsAt,
          createdAt: proposal.createdAt,
        },
      });

    } catch (error) {
      console.error('[WO-134] Create proposal error:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create proposal',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

  } else if (req.method === 'GET') {
    // WO-134: List proposals with filtering & pagination
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const status = req.query.status as string | undefined;
      const proposalType = req.query.proposalType as string | undefined;
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as string) || 'desc';

      const whereClause: any = {};
      if (status) whereClause.status = status;
      if (proposalType) whereClause.proposalType = proposalType;

      const [proposals, total] = await Promise.all([
        prisma.proposal.findMany({
          where: whereClause,
          include: {
            proposer: {
              select: {
                id: true,
                username: true,
                walletAddress: true,
              },
            },
            votes: {
              select: {
                support: true,
                weight: true,
              },
            },
          },
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.proposal.count({ where: whereClause }),
      ]);

      // Calculate vote counts
      const proposalsWithVotes = proposals.map((p: any) => {
        const votesFor = p.votes.filter((v: any) => v.support).reduce((sum: number, v: any) => sum + v.weight, 0);
        const votesAgainst = p.votes.filter((v: any) => !v.support).reduce((sum: number, v: any) => sum + v.weight, 0);
        
        return {
          ...p,
          voteStats: {
            votesFor,
            votesAgainst,
            totalVotes: votesFor + votesAgainst,
            voterCount: p.votes.length,
          },
          votes: undefined, // Remove detailed votes from list view
        };
      });

      return res.status(200).json({
        success: true,
        proposals: proposalsWithVotes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      });

    } catch (error) {
      console.error('[WO-134] List proposals error:', error);

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch proposals',
      });
    }

  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

export default withAuth(proposalsHandler);



