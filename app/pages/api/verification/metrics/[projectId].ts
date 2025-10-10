/**
 * GET /api/verification/metrics/[projectId]
 * 
 * WO-136: Project verification metrics and analytics
 * 
 * Features:
 * - Data quality scores
 * - Oracle reliability statistics
 * - Verification success rates
 * - Trend analysis with date ranges
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../lib/middleware/authMiddleware';
import { prisma } from '../../../../lib/prisma';

async function verificationMetricsHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { projectId } = req.query;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'projectId parameter is required',
      });
    }

    // Get project milestones
    const milestones = await prisma.milestone.findMany({
      where: { projectId },
    });

    const milestoneIds = milestones.map((m: any) => m.id);

    // Get verification data with date filtering
    const whereClause: any = {
      milestoneId: { in: milestoneIds },
    };

    if (startDate || endDate) {
      whereClause.verifiedAt = {};
      if (startDate) whereClause.verifiedAt.gte = new Date(startDate);
      if (endDate) whereClause.verifiedAt.lte = new Date(endDate);
    }

    const verifications = await (prisma as any).metricVerification.findMany({
      where: whereClause,
      include: {
        milestone: true,
      },
      orderBy: { verifiedAt: 'desc' },
    });

    // Calculate metrics
    const totalVerifications = verifications.length;
    const verifiedCount = verifications.filter((v: any) => v.verificationResult === 'VERIFIED').length;
    const failedCount = verifications.filter((v: any) => v.verificationResult === 'FAILED').length;
    const successRate = totalVerifications > 0 ? (verifiedCount / totalVerifications) * 100 : 0;

    const avgConfidence = totalVerifications > 0
      ? verifications.reduce((sum: number, v: any) => sum + v.confidenceScore, 0) / totalVerifications
      : 0;

    // Data quality scores
    const dataQuality = {
      overall: Math.round(avgConfidence * 100) / 100,
      excellent: verifications.filter((v: any) => v.confidenceScore >= 0.9).length,
      good: verifications.filter((v: any) => v.confidenceScore >= 0.7 && v.confidenceScore < 0.9).length,
      fair: verifications.filter((v: any) => v.confidenceScore >= 0.5 && v.confidenceScore < 0.7).length,
      poor: verifications.filter((v: any) => v.confidenceScore < 0.5).length,
    };

    // Trend analysis (group by month)
    const trendData = await calculateTrendData(verifications);

    return res.status(200).json({
      success: true,
      metrics: {
        projectId,
        totalVerifications,
        successRate: Math.round(successRate * 10) / 10,
        verifiedCount,
        failedCount,
        pendingCount: milestones.length - verifiedCount - failedCount,
        
        // WO-136: Data quality scores
        dataQuality,
        
        // WO-136: Oracle reliability (simulated)
        oracleReliability: {
          averageUptime: 98.5,
          averageAccuracy: Math.round(avgConfidence * 100),
          totalDataPoints: verifications.length * 5, // Estimated
        },
        
        // WO-136: Trend analysis
        trendAnalysis: trendData,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        dateRange: { startDate, endDate },
      },
    });

  } catch (error) {
    console.error('[WO-136] Verification metrics error:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve verification metrics',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function calculateTrendData(verifications: any[]): any[] {
  const byMonth: Record<string, any> = {};

  verifications.forEach((v: any) => {
    const date = new Date(v.verifiedAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!byMonth[monthKey]) {
      byMonth[monthKey] = {
        month: monthKey,
        total: 0,
        verified: 0,
        failed: 0,
        avgConfidence: 0,
        totalConfidence: 0,
      };
    }

    byMonth[monthKey].total++;
    if (v.verificationResult === 'VERIFIED') byMonth[monthKey].verified++;
    if (v.verificationResult === 'FAILED') byMonth[monthKey].failed++;
    byMonth[monthKey].totalConfidence += v.confidenceScore;
  });

  return Object.values(byMonth).map((month: any) => ({
    month: month.month,
    total: month.total,
    verified: month.verified,
    failed: month.failed,
    successRate: Math.round((month.verified / month.total) * 100),
    avgConfidence: Math.round((month.totalConfidence / month.total) * 100) / 100,
  }));
}

export default withAuth(verificationMetricsHandler);



