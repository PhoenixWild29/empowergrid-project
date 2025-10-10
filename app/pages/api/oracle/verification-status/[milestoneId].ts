/**
 * GET /api/oracle/verification-status/[milestoneId]
 * 
 * WO-124: Real-time verification status and audit trail
 * 
 * Features:
 * - Real-time status updates
 * - Oracle data sources
 * - Verification progress
 * - Completion timestamps
 * - Detailed audit trails
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../lib/middleware/authMiddleware';
import { prisma } from '../../../../lib/prisma';

async function verificationStatusHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const { milestoneId } = req.query;

    if (!milestoneId || typeof milestoneId !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'milestoneId parameter is required',
      });
    }

    console.log('[WO-124] Fetching verification status:', milestoneId);

    // Fetch milestone
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        project: {
          include: {
            oracleFeeds: {
              include: {
                feed: true,
              },
            },
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

    // Fetch all verification attempts
    const verifications = await (prisma as any).milestoneVerification.findMany({
      where: { milestoneId },
      orderBy: { verificationTimestamp: 'desc' },
    });

    // WO-124: Fetch oracle data sources
    const oracleSources = milestone.project.oracleFeeds.map((pf: any) => ({
      feedId: pf.feedId,
      feedAddress: pf.feed.feedAddress,
      feedType: pf.feed.feedType,
      name: pf.feed.name,
      isActive: pf.isActive,
      updateFrequency: pf.feed.updateFrequency,
    }));

    // WO-124: Calculate verification progress
    const latestVerification = verifications[0];
    const verificationProgress = latestVerification ? {
      status: latestVerification.status,
      confidence: latestVerification.confidence,
      method: latestVerification.verificationMethod,
      dataSource: latestVerification.dataSource,
      completedAt: latestVerification.verificationTimestamp,
      verifiedBy: latestVerification.verifiedBy,
    } : {
      status: 'PENDING',
      confidence: 0,
      method: null,
      dataSource: null,
      completedAt: null,
      verifiedBy: null,
    };

    // WO-124: Build detailed audit trail
    const auditTrail = verifications.map((v: any) => ({
      id: v.id,
      timestamp: v.verificationTimestamp,
      status: v.status,
      method: v.verificationMethod,
      dataSource: v.dataSource,
      confidence: v.confidence,
      evidenceHash: v.evidenceHash,
      verifiedBy: v.verifiedBy,
      notes: v.notes,
      createdAt: v.createdAt,
    }));

    // Check if fund release was triggered
    const fundRelease = await (prisma as any).fundRelease.findFirst({
      where: { milestoneId },
      orderBy: { releasedAt: 'desc' },
    });

    const responseTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      milestone: {
        id: milestone.id,
        title: milestone.title,
        status: milestone.status,
        targetAmount: milestone.targetAmount,
        energyTarget: milestone.energyTarget,
        dueDate: milestone.dueDate,
        submittedAt: milestone.submittedAt,
        approvedAt: milestone.approvedAt,
        completedAt: milestone.completedAt,
      },
      verification: verificationProgress,
      oracleSources,
      fundRelease: fundRelease ? {
        id: fundRelease.id,
        amount: fundRelease.amount,
        transactionHash: fundRelease.transactionHash,
        status: fundRelease.status,
        releasedAt: fundRelease.releasedAt,
        releasedBy: fundRelease.releasedBy,
      } : null,
      auditTrail,
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        totalVerificationAttempts: verifications.length,
      },
    });

  } catch (error) {
    console.error('[WO-124] Verification status error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve verification status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuth(verificationStatusHandler);



