/**
 * POST /api/milestones/[milestoneId]/verify
 * 
 * WO-111: Milestone verification submission endpoint
 * 
 * Features:
 * - Accept verification requests with proof data
 * - Return unique verification request ID
 * - Validate milestone eligibility
 * - Oracle integration for verification
 * - Update escrow contract status
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../lib/middleware/authMiddleware';
import { prisma } from '../../../../lib/prisma';
import { getOracleData } from '../../../../lib/services/oracleService';
import { z } from 'zod';
import {
  emitMilestoneVerified,
  emitMilestoneDelayed,
} from '../../../../lib/realtime/notificationHelpers';

// WO-111: Verification submission schema
const VerificationSubmissionSchema = z.object({
  verificationProof: z.record(z.any()).optional(),
  evidenceFiles: z.array(z.string()).optional(),
  evidenceLinks: z.array(z.string().url()).optional(),
  notes: z.string().optional(),
});

async function verifyMilestoneHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const { milestoneId } = req.query;
    const userId = (req as any).userId;

    if (!milestoneId || typeof milestoneId !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'milestoneId parameter is required',
      });
    }

    console.log('[WO-111] Milestone verification request:', milestoneId);

    // WO-111: Validate request body
    const validatedData = VerificationSubmissionSchema.parse(req.body);

    // WO-111: Fetch milestone and validate eligibility
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        project: {
          include: {
            escrowContract: true,
          },
        },
      },
    });

    if (!milestone) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Milestone not found',
      });
    }

    // WO-111: Validate milestone is eligible for verification
    if (milestone.status === 'APPROVED' || milestone.status === 'REJECTED') {
      return res.status(400).json({
        error: 'Invalid state',
        message: 'Milestone has already been processed',
      });
    }

    // Check user authorization
    const isCreator = milestone.project.creatorId === userId;
    if (!isCreator) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only project creator can submit verification',
      });
    }

    // WO-111: Fetch oracle data for verification
    let oracleData = null;
    let oracleConfidence = 0;
    let energyProduced = 0;

    if (milestone.project.escrowContract?.oracleAuthority) {
      oracleData = await getOracleData(
        milestone.project.escrowContract.oracleAuthority,
        milestone.projectId
      );

      if (oracleData) {
        oracleConfidence = oracleData.confidence;
        energyProduced = oracleData.energyProduction;
      }
    }

    // WO-111: Determine verification status
    const energyTarget = milestone.energyTarget || 0;
    const meetsTarget = energyProduced >= energyTarget;
    const meetsConfidence = oracleConfidence >= 0.8;
    
    const verified = meetsTarget && meetsConfidence;
    const status = verified ? 'VERIFIED' : 
                   oracleData ? 'FAILED' : 
                   'IN_PROGRESS';

    // WO-111: Create verification record
    const verification = await (prisma as any).milestoneVerification.create({
      data: {
        milestoneId,
        escrowContractId: milestone.project.escrowContract?.contractId || '',
        status,
        verificationProof: validatedData.verificationProof || {},
        oracleSourceId: milestone.project.escrowContract?.oracleAuthority || null,
        oraclePayload: oracleData || null,
        energyProduced,
        oracleConfidence,
        verified,
        verificationResult: verified 
          ? `Milestone verified: ${energyProduced} kWh produced (target: ${energyTarget} kWh)`
          : `Verification failed: ${energyProduced} kWh produced (target: ${energyTarget} kWh needed)`,
        verifiedBy: userId,
        verifiedAt: verified ? new Date() : null,
        metadata: {
          evidenceFiles: validatedData.evidenceFiles || [],
          evidenceLinks: validatedData.evidenceLinks || [],
          notes: validatedData.notes,
        },
      },
    });

    // WO-111: Update milestone status if verified
    if (verified) {
      await prisma.milestone.update({
        where: { id: milestoneId },
        data: {
          status: 'APPROVED',
          completedAt: new Date(),
          approvedAt: new Date(),
          verificationData: {
            verificationId: verification.id,
            energyProduced,
            oracleConfidence,
            verifiedAt: new Date().toISOString(),
          },
        },
      });

      console.log('[WO-111] Milestone verified and status updated');

      // Emit real-time notification to project investors
      try {
        // Get all funders for this project
        const funders = await prisma.funding.findMany({
          where: { projectId: milestone.projectId },
          select: { funderId: true },
          distinct: ['funderId'],
        });

        // Emit notification to each funder
        for (const funding of funders) {
          await emitMilestoneVerified(
            funding.funderId,
            milestone.projectId,
            milestoneId,
            milestone.project.title,
            milestone.title
          );
        }
      } catch (notifError) {
        console.error('[WO-111] Failed to emit milestone verification notification', notifError);
        // Don't fail the request if notification fails
      }
    } else if (status === 'FAILED') {
      // Emit delay notification if verification failed
      try {
        const funders = await prisma.funding.findMany({
          where: { projectId: milestone.projectId },
          select: { funderId: true },
          distinct: ['funderId'],
        });

        for (const funding of funders) {
          await emitMilestoneDelayed(
            funding.funderId,
            milestone.projectId,
            milestoneId,
            milestone.project.title,
            milestone.title,
            `Energy target not met: ${energyProduced} kWh produced (target: ${energyTarget} kWh)`
          );
        }
      } catch (notifError) {
        console.error('[WO-111] Failed to emit milestone delay notification', notifError);
      }
    }

    const responseTime = Date.now() - startTime;

    return res.status(verified ? 200 : 202).json({
      success: true,
      message: verified 
        ? 'Milestone verified successfully'
        : 'Verification request submitted',
      verification: {
        id: verification.id,
        status: verification.status,
        verified: verification.verified,
        energyProduced,
        energyTarget,
        oracleConfidence,
        verificationResult: verification.verificationResult,
      },
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[WO-111] Verification error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.issues,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process verification request',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuth(verifyMilestoneHandler);



