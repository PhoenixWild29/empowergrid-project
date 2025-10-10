/**
 * GET /api/oracle/health/[feedId]
 * 
 * WO-128: Oracle service health monitoring
 * 
 * Features:
 * - Service health metrics
 * - Data quality assessment
 * - Uptime tracking
 * - Error rate monitoring
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../lib/middleware/authMiddleware';
import { getOracleHealthMetrics } from '../../../../lib/services/oracleReliabilityService';

async function oracleHealthHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const { feedId } = req.query;

    if (!feedId || typeof feedId !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'feedId parameter is required',
      });
    }

    console.log('[WO-128] Fetching oracle health metrics:', feedId);

    // WO-128: Get comprehensive health metrics
    const healthMetrics = await getOracleHealthMetrics(feedId);

    const responseTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      health: healthMetrics,
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[WO-128] Oracle health check error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve oracle health metrics',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuth(oracleHealthHandler);



