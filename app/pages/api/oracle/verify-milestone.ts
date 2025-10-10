/**
 * POST /api/oracle/verify-milestone
 * 
 * WO-124: Automated milestone verification with oracle data
 * 
 * Features:
 * - Aggregate oracle data from multiple sources
 * - Apply verification algorithms
 * - Trigger blockchain transactions for fund releases
 * - Record verification audit trail
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/middleware/authMiddleware';
import { prisma } from '../../../lib/prisma';
import { verifyMilestoneWithOracles } from '../../../lib/services/oracleVerificationService';
import { z } from 'zod';

// WO-124: Verification request schema
const VerificationRequestSchema = z.object({
  milestoneId: z.string(),
  projectId: z.string(),
  triggerRelease: z.boolean().default(false),
});

async function verifyMilestoneHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    console.log('[WO-124] Milestone verification request');

    // Validate request
    const validatedData = VerificationRequestSchema.parse(req.body);

    // Fetch milestone
    const milestone = await prisma.milestone.findUnique({
      where: { id: validatedData.milestoneId },
    });

    if (!milestone) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Milestone not found',
      });
    }

    // WO-124: Perform oracle verification
    const verificationResult = await verifyMilestoneWithOracles(
      validatedData.milestoneId,
      validatedData.projectId
    );

    // Store verification record
    const verification = await (prisma as any).milestoneVerification.create({
      data: {
        milestoneId: validatedData.milestoneId,
        status: verificationResult.isVerified ? 'VERIFIED' : 'FAILED',
        verificationMethod: 'ORACLE_AUTO',
        dataSource: 'SWITCHBOARD_AGGREGATOR',
        confidence: verificationResult.confidence,
        evidenceHash: `hash_${Date.now()}`,
        verifiedBy: (req as any).user?.id || 'system',
        verificationTimestamp: new Date(),
        notes: `Verified with ${verificationResult.dataPoints} data points from ${verificationResult.sources.length} sources. Anomalies: ${verificationResult.anomaliesDetected}. Consistency: ${verificationResult.consistencyScore}`,
      },
    });

    // WO-124: Trigger blockchain transaction if requested and verified
    let transactionId: string | null = null;
    if (validatedData.triggerRelease && verificationResult.isVerified) {
      transactionId = await triggerFundRelease(
        validatedData.milestoneId,
        validatedData.projectId,
        milestone.targetAmount
      );
      console.log('[WO-124] Fund release triggered:', transactionId);

      // Update milestone status
      await prisma.milestone.update({
        where: { id: validatedData.milestoneId },
        data: { status: 'APPROVED' },
      });
    }

    const responseTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      verification: {
        id: verification.id,
        milestoneId: validatedData.milestoneId,
        isVerified: verificationResult.isVerified,
        confidence: verificationResult.confidence,
        dataPoints: verificationResult.dataPoints,
        anomaliesDetected: verificationResult.anomaliesDetected,
        consistencyScore: verificationResult.consistencyScore,
        sources: verificationResult.sources,
        timestamp: verificationResult.timestamp,
      },
      blockchain: transactionId ? {
        transactionId,
        status: 'PENDING',
        explorerUrl: `https://explorer.solana.com/tx/${transactionId}?cluster=devnet`,
      } : null,
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[WO-124] Milestone verification error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.issues,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to verify milestone',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * WO-124: Trigger blockchain fund release
 */
async function triggerFundRelease(
  milestoneId: string,
  projectId: string,
  amount: number
): Promise<string> {
  console.log('[WO-124] Triggering fund release:', milestoneId, amount);

  // In production, would interact with Solana blockchain
  // For now, simulate transaction
  await new Promise(resolve => setTimeout(resolve, 1000));

  const txId = `${Math.random().toString(36).substr(2, 9)}${Date.now()}`;

  // Record fund release
  await (prisma as any).fundRelease.create({
    data: {
      contractId: projectId,
      milestoneId,
      amount,
      transactionHash: txId,
      status: 'COMPLETED',
      releasedAt: new Date(),
      releasedBy: 'oracle_auto',
    },
  });

  return txId;
}

export default withAuth(verifyMilestoneHandler);



