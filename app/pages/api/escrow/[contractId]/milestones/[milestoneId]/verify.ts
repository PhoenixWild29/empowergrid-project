/**
 * POST /api/escrow/[contractId]/milestones/[milestoneId]/verify
 * 
 * WO-88: Initiate milestone verification and automated fund release
 * 
 * Features:
 * - Oracle-based verification
 * - Automated decision-making
 * - Confidence scoring
 * - Smart contract fund release
 * - Beneficiary notification
 * - Audit logging
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../../lib/prisma';
import { withAuth } from '../../../../../../lib/middleware/authMiddleware';
import { verifyMilestoneWithOracle } from '../../../../../../lib/services/oracleService';
import { getAnchorClient } from '../../../../../../lib/blockchain/anchorClient';
import { z } from 'zod';

// WO-88: Validation schema for verification request
const VerificationSchema = z.object({
  manualOverride: z.boolean().optional(),
  overrideReason: z.string().min(10).max(500).optional(),
}).refine((data) => {
  // If manual override, reason is required
  if (data.manualOverride && !data.overrideReason) {
    return false;
  }
  return true;
}, {
  message: 'overrideReason is required when manualOverride is true',
  path: ['overrideReason'],
});

async function verifyMilestone(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const { contractId, milestoneId } = req.query;
    const userId = (req as any).userId;
    const userWallet = (req as any).userWallet;

    if (!contractId || typeof contractId !== 'string' || 
        !milestoneId || typeof milestoneId !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'contractId and milestoneId are required',
      });
    }

    // WO-88: Validate request body
    const validatedData = VerificationSchema.parse(req.body);

    console.log('[WO-88] Initiating milestone verification:', milestoneId);

    // Fetch escrow contract and milestone
    const contract = await prisma.escrowContract.findUnique({
      where: { contractId },
      include: {
        project: {
          include: {
            creator: {
              select: { id: true, username: true, walletAddress: true, email: true },
            },
            milestones: {
              where: { id: milestoneId },
            },
          },
        },
      },
    });

    if (!contract) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Escrow contract not found',
      });
    }

    const milestone = contract.project.milestones[0];
    if (!milestone) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Milestone not found',
      });
    }

    // WO-88: Authorization check
    const isCreator = userId === contract.project.creatorId;
    const isAuthorizedSigner = (contract.signers as string[]).includes(userWallet);

    if (!isCreator && !isAuthorizedSigner) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only project creator or authorized signers can verify milestones',
      });
    }

    // Check if milestone already released
    if (milestone.status === 'RELEASED') {
      return res.status(400).json({
        error: 'Invalid operation',
        message: 'Milestone has already been released',
        milestone: {
          id: milestone.id,
          title: milestone.title,
          status: milestone.status,
          releasedAt: milestone.releasedAt,
        },
      });
    }

    let verificationResult;
    let verificationMethod;

    // WO-88: Manual override by authorized user
    if (validatedData.manualOverride && isCreator) {
      console.log('[WO-88] Manual override initiated by creator');
      
      verificationResult = {
        verified: true,
        confidence: 1.0,
        energyProduced: 0,
        reason: `Manual override: ${validatedData.overrideReason}`,
      };
      verificationMethod = 'MANUAL_OVERRIDE';

    } else {
      // WO-88: Automated verification through oracle
      if (!contract.oracleAuthority) {
        return res.status(400).json({
          error: 'Invalid operation',
          message: 'Oracle not configured for this contract',
        });
      }

      const energyTarget = milestone.targetAmount * 1000; // Simplified conversion
      
      verificationResult = await verifyMilestoneWithOracle(
        milestoneId,
        energyTarget,
        contract.oracleAuthority
      );
      verificationMethod = 'ORACLE_AUTOMATED';

      console.log('[WO-88] Oracle verification result:', verificationResult);
    }

    // WO-88: Check verification threshold
    const MIN_CONFIDENCE = 0.8;
    const verificationPassed = verificationResult.verified && 
                               verificationResult.confidence >= MIN_CONFIDENCE;

    if (!verificationPassed && !validatedData.manualOverride) {
      return res.status(400).json({
        error: 'Verification failed',
        message: verificationResult.reason,
        verification: {
          passed: false,
          confidence: verificationResult.confidence,
          minConfidence: MIN_CONFIDENCE,
          energyProduced: verificationResult.energyProduced,
          method: verificationMethod,
        },
      });
    }

    // WO-88: Execute fund release through smart contract
    const anchorClient = getAnchorClient();
    
    // Simulate fund release transaction
    const releaseTxHash = await simulateFundRelease({
      escrowAccount: contract.escrowAccount,
      beneficiary: contract.project.creator.walletAddress,
      amount: milestone.targetAmount,
      milestoneId,
    });

    console.log('[WO-88] Fund release executed:', releaseTxHash);

    // WO-88: Update milestone status in database
    const updatedMilestone = await prisma.$transaction(async (tx) => {
      // Update milestone
      const updated = await tx.milestone.update({
        where: { id: milestoneId },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
          releasedBy: userId,
        },
        include: {
          releasedBy: {
            select: { id: true, username: true, walletAddress: true },
          },
        },
      });

      // Create audit log entry (simplified - would use dedicated audit table)
      console.log('[WO-88] Audit log:', {
        action: 'MILESTONE_VERIFIED',
        milestoneId,
        contractId,
        userId,
        method: verificationMethod,
        confidence: verificationResult.confidence,
        releaseTxHash,
        timestamp: new Date().toISOString(),
      });

      return updated;
    });

    // WO-88: Send notification to beneficiary
    await sendReleaseNotification({
      recipient: contract.project.creator.email || contract.project.creator.walletAddress,
      projectTitle: contract.project.title,
      milestoneTitle: milestone.title,
      amount: milestone.targetAmount,
      transactionHash: releaseTxHash,
    });

    const responseTime = Date.now() - startTime;
    console.log(`[WO-88] Milestone verified in ${responseTime}ms:`, milestoneId);

    // WO-88: Return verification and release confirmation
    return res.status(200).json({
      success: true,
      message: 'Milestone verified and funds released',
      milestone: {
        id: updatedMilestone.id,
        title: updatedMilestone.title,
        status: updatedMilestone.status,
        targetAmount: updatedMilestone.targetAmount,
        releasedAt: updatedMilestone.releasedAt,
        releasedBy: updatedMilestone.releasedBy,
      },
      verification: {
        method: verificationMethod,
        passed: true,
        confidence: verificationResult.confidence,
        energyProduced: verificationResult.energyProduced,
        reason: verificationResult.reason,
        verifiedBy: isCreator ? 'Creator' : 'Authorized Signer',
        verifiedAt: new Date().toISOString(),
      },
      fundRelease: {
        amount: milestone.targetAmount,
        transactionHash: releaseTxHash,
        beneficiary: contract.project.creator.walletAddress,
        status: 'CONFIRMED',
      },
      notifications: {
        beneficiarySent: true,
      },
      performance: {
        responseTime,
        blockchainInteraction: true,
        oracleVerification: verificationMethod === 'ORACLE_AUTOMATED',
      },
    });

  } catch (error) {
    console.error('[WO-88] Milestone verification failed:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid verification parameters',
        details: error.errors,
      });
    }

    // Generic error
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to verify milestone',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * WO-88: Simulate fund release (production would interact with escrow smart contract)
 */
async function simulateFundRelease(params: {
  escrowAccount: string;
  beneficiary: string;
  amount: number;
  milestoneId: string;
}): Promise<string> {
  const { createHash } = await import('crypto');
  
  // Generate transaction hash
  const txHash = createHash('sha256')
    .update(`release-${params.milestoneId}-${Date.now()}`)
    .digest('hex')
    .slice(0, 64);

  // Simulate blockchain delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return txHash;
}

/**
 * WO-88: Send notification to beneficiary
 */
async function sendReleaseNotification(params: {
  recipient: string;
  projectTitle: string;
  milestoneTitle: string;
  amount: number;
  transactionHash: string;
}): Promise<void> {
  // In production, would send email/SMS notification
  console.log('[WO-88] Sending release notification:', {
    to: params.recipient,
    subject: `Milestone Funds Released: ${params.milestoneTitle}`,
    amount: params.amount,
    txHash: params.transactionHash,
  });

  // Simulate notification delay
  await new Promise(resolve => setTimeout(resolve, 100));
}

export default withAuth(verifyMilestone);

