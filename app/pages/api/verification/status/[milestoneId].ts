/**
 * GET /api/verification/status/[milestoneId]
 * 
 * WO-129: Get milestone verification status
 * 
 * Features:
 * - Completion percentage
 * - Data sources used
 * - Processing timestamp
 * - Verification history
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../lib/middleware/authMiddleware';
import { prisma } from '../../../../lib/prisma';

async function verificationStatusHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { milestoneId } = req.query;

    if (!milestoneId || typeof milestoneId !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'milestoneId parameter is required',
      });
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
    });

    if (!milestone) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Milestone not found',
      });
    }

    // Get latest metric verification
    const latestVerification = await (prisma as any).metricVerification.findFirst({
      where: { milestoneId },
      orderBy: { verifiedAt: 'desc' },
      include: {
        algorithm: true,
      },
    });

    // Get all verifications for history
    const allVerifications = await (prisma as any).metricVerification.findMany({
      where: { milestoneId },
      orderBy: { verifiedAt: 'desc' },
      take: 10,
    });

    // Calculate completion percentage based on milestone status and verification
    let completionPercentage = 0;
    if (milestone.status === 'RELEASED') {
      completionPercentage = 100;
    } else if (milestone.status === 'APPROVED' || latestVerification?.verificationResult === 'VERIFIED') {
      completionPercentage = 90;
    } else if (latestVerification?.verificationResult === 'PENDING') {
      completionPercentage = 50;
    } else if (milestone.submittedAt) {
      completionPercentage = 25;
    }

    return res.status(200).json({
      success: true,
      status: {
        milestoneId,
        milestoneStatus: milestone.status,
        verificationStatus: latestVerification?.verificationResult || 'PENDING',
        completionPercentage,
        confidenceScore: latestVerification ? Math.round(latestVerification.confidenceScore * 100) : null,
        lastVerified: latestVerification?.verifiedAt,
        processingTimestamp: latestVerification?.verifiedAt,
        
        // WO-129: Data sources used
        dataSources: latestVerification?.processingData?.sources || [],
        
        // WO-129: Algorithm used
        algorithmUsed: latestVerification?.algorithm?.name,
        
        // Verification history
        verificationHistory: allVerifications.map((v: any) => ({
          id: v.id,
          result: v.verificationResult,
          confidence: Math.round(v.confidenceScore * 100),
          verifiedAt: v.verifiedAt,
        })),
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[WO-129] Verification status error:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve verification status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuth(verificationStatusHandler);



