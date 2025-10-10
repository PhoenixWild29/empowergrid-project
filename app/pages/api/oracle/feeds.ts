/**
 * GET /api/oracle/feeds
 * 
 * WO-120: Oracle data feed discovery and retrieval
 * 
 * Features:
 * - List available oracle data feeds
 * - Feed metadata (addresses, frequencies, types)
 * - Reliability metrics
 * - Integration with Switchboard SDK
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/middleware/authMiddleware';
import { prisma } from '../../../lib/prisma';

async function oracleFeedsHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    console.log('[WO-120] Fetching oracle feeds');

    // Query parameters
    const feedType = req.query.feedType as string | undefined;
    const isActive = req.query.isActive === 'true';

    // Fetch oracle feeds with metadata
    const feeds = await (prisma as any).oracleFeed.findMany({
      where: {
        ...(feedType && { feedType }),
        ...(req.query.isActive && { isActive }),
      },
      include: {
        dataPoints: {
          orderBy: { timestamp: 'desc' },
          take: 10, // Last 10 data points for reliability metrics
        },
        projectFeeds: {
          select: {
            projectId: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // WO-120: Calculate reliability metrics for each feed
    const feedsWithMetrics = feeds.map((feed: any) => {
      const dataPoints = feed.dataPoints || [];
      
      // Calculate average confidence
      const avgConfidence = dataPoints.length > 0
        ? dataPoints.reduce((sum: number, dp: any) => sum + dp.confidence, 0) / dataPoints.length
        : 0;

      // Calculate data freshness (last update)
      const lastUpdate = dataPoints.length > 0
        ? dataPoints[0].timestamp
        : null;

      // Calculate update consistency
      const expectedUpdates = feed.updateFrequency > 0
        ? Math.floor((Date.now() - new Date(feed.createdAt).getTime()) / (feed.updateFrequency * 1000))
        : 0;

      const actualUpdates = dataPoints.length;
      const reliability = expectedUpdates > 0
        ? Math.min((actualUpdates / expectedUpdates) * 100, 100)
        : 100;

      return {
        id: feed.id,
        feedAddress: feed.feedAddress,
        feedType: feed.feedType,
        name: feed.name,
        description: feed.description,
        updateFrequency: feed.updateFrequency,
        isActive: feed.isActive,
        
        // WO-120: Metadata
        metadata: {
          aggregatorKey: feed.aggregatorKey,
          minConfidence: feed.minConfidence,
          maxStaleness: feed.maxStaleness,
          projectsUsing: feed.projectFeeds.length,
        },
        
        // WO-120: Reliability metrics
        reliability: {
          averageConfidence: Math.round(avgConfidence * 100) / 100,
          lastUpdate,
          updateCount: actualUpdates,
          expectedUpdateCount: expectedUpdates,
          reliabilityScore: Math.round(reliability),
          dataQuality: avgConfidence >= 0.8 ? 'HIGH' : avgConfidence >= 0.6 ? 'MEDIUM' : 'LOW',
        },
        
        createdAt: feed.createdAt,
        updatedAt: feed.updatedAt,
      };
    });

    const responseTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      feeds: feedsWithMetrics,
      total: feeds.length,
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[WO-120] Oracle feeds error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve oracle feeds',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuth(oracleFeedsHandler);



