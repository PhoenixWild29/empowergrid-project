/**
 * GET /api/oracle/health
 * 
 * WO-128: Oracle service health monitoring (all feeds)
 * 
 * Features:
 * - Overview of all oracle feeds
 * - Aggregate health metrics
 * - Service availability
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../lib/middleware/authMiddleware';
import { prisma } from '../../../../lib/prisma';
import { getOracleHealthMetrics } from '../../../../lib/services/oracleReliabilityService';

async function oracleHealthOverviewHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    console.log('[WO-128] Fetching oracle health overview');

    // Fetch all active oracle feeds
    const feeds = await (prisma as any).oracleFeed.findMany({
      where: { isActive: true },
      select: { id: true, feedAddress: true, name: true, feedType: true },
    });

    // Get health metrics for each feed
    const healthMetrics = await Promise.all(
      feeds.map(async (feed: any) => {
        try {
          const metrics = await getOracleHealthMetrics(feed.id);
          return metrics;
        } catch (error) {
          console.error(`[WO-128] Failed to get metrics for feed ${feed.id}:`, error);
          return {
            feedId: feed.id,
            feedAddress: feed.feedAddress,
            isHealthy: false,
            uptime: 0,
            avgResponseTime: 0,
            errorRate: 1.0,
            lastUpdate: new Date(0),
            dataQuality: 'LOW' as const,
          };
        }
      })
    );

    // Calculate aggregate metrics
    const totalFeeds = healthMetrics.length;
    const healthyFeeds = healthMetrics.filter(m => m.isHealthy).length;
    const avgErrorRate = healthMetrics.reduce((sum, m) => sum + m.errorRate, 0) / totalFeeds;
    const avgResponseTime = healthMetrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / totalFeeds;

    const overallHealth = healthyFeeds / totalFeeds;

    const responseTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      overview: {
        totalFeeds,
        healthyFeeds,
        unhealthyFeeds: totalFeeds - healthyFeeds,
        overallHealth: Math.round(overallHealth * 100) / 100,
        avgErrorRate: Math.round(avgErrorRate * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime),
        status: overallHealth >= 0.9 ? 'EXCELLENT' : 
                overallHealth >= 0.7 ? 'GOOD' :
                overallHealth >= 0.5 ? 'FAIR' : 'POOR',
      },
      feeds: healthMetrics,
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[WO-128] Oracle health overview error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve oracle health overview',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuth(oracleHealthOverviewHandler);



