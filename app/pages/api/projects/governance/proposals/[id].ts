/**
 * GET/POST /api/projects/governance/proposals/[id]
 * 
 * WO-148: Project-specific governance proposals
 * 
 * Features:
 * - Create project-specific proposals
 * - List proposals for a project
 * - Filter by status & type
 * - Project validation
 * - Voter eligibility validation
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../../lib/middleware/authMiddleware';
import { prisma } from '../../../../../lib/prisma';
import { z } from 'zod';

const ProjectProposalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(5000),
  proposalType: z.enum(['GENERAL', 'PARAMETER_CHANGE', 'TREASURY_ALLOCATION', 'PROTOCOL_UPGRADE', 'EMERGENCY_ACTION']),
  proposalTypeSpecificData: z.object({
    milestoneChanges: z.array(z.object({
      milestoneId: z.string(),
      action: z.enum(['MODIFY_TIMELINE', 'MODIFY_SCOPE', 'MODIFY_BUDGET']),
      newValue: z.any(),
    })).optional(),
    fundReallocation: z.object({
      fromMilestoneId: z.string(),
      toMilestoneId: z.string(),
      amount: z.number().positive(),
    }).optional(),
  }).optional(),
  votingPeriodDays: z.number().int().min(1).max(30).default(7),
});

async function projectGovernanceProposalsHandler(req: NextApiRequest, res: NextApiResponse) {
  const { id: projectId } = req.query;
  const userId = (req as any).user?.id;

  if (!projectId || typeof projectId !== 'string') {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'id parameter is required',
    });
  }

  // WO-148: Validate project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return res.status(404).json({
      error: 'Not found',
      message: 'Project not found',
    });
  }

  if (req.method === 'POST') {
    // WO-148: Create project-specific proposal
    try {
      const validatedData = ProjectProposalSchema.parse(req.body);

      // WO-148: Check voter eligibility (project stakeholder)
      const isStakeholder = await checkProjectStakeholder(projectId, userId!);
      
      if (!isStakeholder) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only project stakeholders can create proposals for this project',
        });
      }

      const votingStartsAt = new Date();
      const votingEndsAt = new Date(votingStartsAt);
      votingEndsAt.setDate(votingEndsAt.getDate() + validatedData.votingPeriodDays);

      const proposal = await prisma.proposal.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          proposalType: validatedData.proposalType as any,
          proposerId: userId!,
          targetProjectId: projectId,
          proposalTypeSpecificData: validatedData.proposalTypeSpecificData,
          status: 'ACTIVE',
          votingStartsAt,
          votingEndsAt,
          minQuorum: 10,
        },
        include: {
          proposer: {
            select: { id: true, username: true },
          },
          targetProject: {
            select: { id: true, title: true },
          },
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Project proposal created successfully',
        proposal,
      });

    } catch (error) {
      console.error('[WO-148] Create project proposal error:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }

  } else if (req.method === 'GET') {
    // WO-148: List project proposals with filtering
    try {
      const status = req.query.status as string | undefined;
      const proposalType = req.query.proposalType as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = 20;

      const whereClause: any = {
        targetProjectId: projectId,
      };
      
      if (status) whereClause.status = status.toUpperCase();
      if (proposalType) whereClause.proposalType = proposalType.toUpperCase();

      const [proposals, total] = await Promise.all([
        prisma.proposal.findMany({
          where: whereClause,
          include: {
            proposer: {
              select: { id: true, username: true },
            },
            votes: {
              select: { support: true, weight: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.proposal.count({ where: whereClause }),
      ]);

      // Calculate vote stats
      const proposalsWithStats = proposals.map((p: any) => ({
        ...p,
        voteStats: {
          votesFor: p.votes.filter((v: any) => v.support).reduce((sum: number, v: any) => sum + v.weight, 0),
          votesAgainst: p.votes.filter((v: any) => !v.support).reduce((sum: number, v: any) => sum + v.weight, 0),
        },
        votes: undefined,
      }));

      return res.status(200).json({
        success: true,
        proposals: proposalsWithStats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });

    } catch (error) {
      console.error('[WO-148] List project proposals error:', error);

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }

  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function checkProjectStakeholder(projectId: string, userId: string): Promise<boolean> {
  // Check if user is creator or funder
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

export default withAuth(projectGovernanceProposalsHandler);

