/**
 * POST /api/verification/process
 * 
 * WO-129: Process oracle data and determine milestone verification status
 * 
 * Features:
 * - Oracle data aggregation
 * - Statistical validation
 * - Confidence scoring (0-100)
 * - Automated fund release triggering
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/middleware/authMiddleware';
import { VerificationRequestSchema } from '../../../lib/schemas/metricVerificationSchemas';
import { prisma } from '../../../lib/prisma';
import { verifyMilestoneWithOracles } from '../../../lib/services/oracleVerificationService';

async function verificationProcessHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    console.log('[WO-129] Processing verification request');

    const validatedData = VerificationRequestSchema.parse(req.body);

    // Fetch milestone
    const milestone = await prisma.milestone.findUnique({
      where: { id: validatedData.milestoneId },
      include: { project: true },
    });

    if (!milestone) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Milestone not found',
      });
    }

    // WO-129: Aggregate oracle data and verify
    const verificationResult = await verifyMilestoneWithOracles(
      validatedData.milestoneId,
      milestone.projectId
    );

    // Convert confidence to 0-100 range
    const confidenceScore = Math.round(verificationResult.confidence * 100);

    // Store verification result
    const metricVerification = await (prisma as any).metricVerification.create({
      data: {
        milestoneId: validatedData.milestoneId,
        algorithmId: validatedData.algorithmId,
        verificationResult: verificationResult.isVerified ? 'VERIFIED' : 'FAILED',
        confidenceScore: verificationResult.confidence,
        processingData: {
          dataPoints: verificationResult.dataPoints,
          anomalies: verificationResult.anomaliesDetected,
          consistency: verificationResult.consistencyScore,
          sources: verificationResult.sources,
        },
      },
    });

    // WO-129: Trigger fund release if verified
    if (verificationResult.isVerified && confidenceScore >= 80) {
      console.log('[WO-129] Triggering automated fund release');
      
      await prisma.milestone.update({
        where: { id: validatedData.milestoneId },
        data: { status: 'APPROVED' },
      });
    }

    const processingTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      verification: {
        verificationId: metricVerification.id,
        milestoneId: validatedData.milestoneId,
        status: metricVerification.verificationResult,
        confidenceScore, // 0-100
        processingTime,
        dataQuality: verificationResult.consistencyScore,
        anomaliesDetected: verificationResult.anomaliesDetected,
        oracleSources: verificationResult.sources,
        fundReleaseTriggered: verificationResult.isVerified && confidenceScore >= 80,
      },
      metadata: {
        responseTime: `${processingTime}ms`,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[WO-129] Verification processing error:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process verification',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuth(verificationProcessHandler);



