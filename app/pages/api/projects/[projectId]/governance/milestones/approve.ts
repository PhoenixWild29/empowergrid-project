/**
 * POST /api/projects/[projectId]/governance/milestones/approve
 * 
 * WO-148: Approve milestone modifications
 * 
 * Features:
 * - Milestone approval proposals
 * - Timeline constraint validation
 * - Budget constraint validation
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../../../lib/middleware/authMiddleware';
import { prisma } from '../../../../../../lib/prisma';
import { z } from 'zod';

const MilestoneApprovalSchema = z.object({
  milestoneId: z.string(),
  modificationType: z.enum(['TIMELINE', 'SCOPE', 'BUDGET', 'COMPLETION_CRITERIA']),
  newValue: z.any(),
});

async function milestoneApprovalHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { projectId } = req.query;
    const userId = (req as any).user?.id;
    const modificationData = MilestoneApprovalSchema.parse(req.body);

    // Validate milestone belongs to project
    const milestone = await prisma.milestone.findFirst({
      where: {
        id: modificationData.milestoneId,
        projectId: projectId as string,
      },
    });

    if (!milestone) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Milestone not found for this project',
      });
    }

    // WO-148: Validate against project constraints
    const validation = await validateMilestoneModification(
      milestone,
      modificationData.modificationType,
      modificationData.newValue
    );

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        message: validation.reason,
        warnings: validation.warnings,
      });
    }

    // Create approval proposal
    const proposal = await prisma.proposal.create({
      data: {
        title: `Modify Milestone: ${milestone.title}`,
        description: `Proposal to modify ${modificationData.modificationType.toLowerCase()} for milestone "${milestone.title}"`,
        proposalType: 'PARAMETER_CHANGE',
        proposerId: userId!,
        targetProjectId: projectId as string,
        proposalTypeSpecificData: {
          milestoneChanges: [modificationData],
        },
        status: 'ACTIVE',
        votingStartsAt: new Date(),
        votingEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Milestone modification proposal created',
      proposal: {
        id: proposal.id,
        title: proposal.title,
        status: proposal.status,
      },
      validation,
    });

  } catch (error) {
    console.error('[WO-148] Milestone approval error:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

async function validateMilestoneModification(
  milestone: any,
  modificationType: string,
  newValue: any
): Promise<{
  isValid: boolean;
  reason?: string;
  warnings: string[];
}> {
  const warnings: string[] = [];

  // WO-148: Timeline validation
  if (modificationType === 'TIMELINE') {
    const newDate = new Date(newValue);
    const now = new Date();
    
    if (newDate < now) {
      return {
        isValid: false,
        reason: 'New deadline cannot be in the past',
        warnings,
      };
    }

    if (newDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
      warnings.push('New deadline is less than 7 days away');
    }
  }

  // WO-148: Budget validation
  if (modificationType === 'BUDGET') {
    if (newValue <= 0) {
      return {
        isValid: false,
        reason: 'Budget must be positive',
        warnings,
      };
    }

    if (newValue > milestone.targetAmount * 2) {
      warnings.push('Budget increase is more than 2x original amount');
    }
  }

  return {
    isValid: true,
    warnings,
  };
}

export default withAuth(milestoneApprovalHandler);



