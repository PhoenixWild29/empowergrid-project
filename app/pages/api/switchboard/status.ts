/**
 * GET /api/switchboard/status
 * 
 * WO-125: Check Switchboard connection status and health
 * 
 * Features:
 * - Connection status retrieval
 * - Health metrics
 * - Performance statistics
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/middleware/authMiddleware';
import { switchboardConnectionManager } from '../../../lib/services/oracle/switchboardConnectionManager';

async function switchboardStatusHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    console.log('[WO-125] Switchboard status request');

    const status = switchboardConnectionManager.getStatus();

    // Perform health check if requested
    const performHealthCheck = req.query.healthCheck === 'true';
    let healthCheckResult: boolean | undefined;

    if (performHealthCheck && status.isConnected) {
      healthCheckResult = await switchboardConnectionManager.performHealthCheck();
    }

    const responseTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      status: {
        isConnected: status.isConnected,
        aggregatorAddress: status.aggregatorAddress,
        networkType: status.networkType,
        responseTime: status.responseTime,
        reliability: Math.round(status.reliability * 100), // Convert to percentage
        connectionTime: status.connectionTime,
        lastHealthCheck: status.lastHealthCheck,
        healthCheckResult,
      },
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[WO-125] Switchboard status error:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve Switchboard status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuth(switchboardStatusHandler);



