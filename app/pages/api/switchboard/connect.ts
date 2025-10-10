/**
 * POST /api/switchboard/connect
 * 
 * WO-125: Establish connection to Switchboard oracle network
 * 
 * Features:
 * - Authenticated connection establishment
 * - Connection status reporting
 * - Response time tracking
 * - Health check integration
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/middleware/authMiddleware';
import { switchboardConnectionManager } from '../../../lib/services/oracle/switchboardConnectionManager';

async function switchboardConnectHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    console.log('[WO-125] Switchboard connection request');

    // Attempt connection
    const status = await switchboardConnectionManager.connect();

    const responseTime = Date.now() - startTime;

    if (!status.isConnected) {
      return res.status(503).json({
        success: false,
        error: 'Failed to establish connection to Switchboard network',
        status,
        metadata: {
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully connected to Switchboard oracle network',
      status: {
        isConnected: status.isConnected,
        aggregatorAddress: status.aggregatorAddress,
        networkType: status.networkType,
        responseTime: status.responseTime,
        reliability: status.reliability,
        connectionTime: status.connectionTime,
        lastHealthCheck: status.lastHealthCheck,
      },
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[WO-125] Switchboard connection error:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to connect to Switchboard network',
      details: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        responseTime: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export default withAuth(switchboardConnectHandler);



