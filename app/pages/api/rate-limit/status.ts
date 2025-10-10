/**
 * GET /api/rate-limit/status
 * 
 * WO-96: Check rate limit status for current user
 * 
 * Returns current usage and remaining quota for all operation types
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withOptionalAuth } from '../../../lib/middleware/authMiddleware';
import { getRateLimitStatus, getRateLimitStatistics } from '../../../lib/middleware/rateLimitMiddleware';

async function getRateLimitStatusHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = (req as any).userId;
    const walletAddress = (req as any).userWallet;
    const isAuthenticated = !!userId;

    // WO-96: Get rate limit status for all operation types
    const fundingStatus = getRateLimitStatus(userId, walletAddress, 'funding');
    const writeStatus = getRateLimitStatus(userId, walletAddress, 'write');
    const readStatus = getRateLimitStatus(userId, walletAddress, 'read');

    // Get system statistics (only for authenticated users)
    let statistics = null;
    if (isAuthenticated) {
      statistics = getRateLimitStatistics();
    }

    return res.status(200).json({
      success: true,
      authenticated: isAuthenticated,
      identifier: userId || walletAddress || 'anonymous',
      rateLimits: {
        funding: {
          ...fundingStatus,
          description: '20 funding operations per hour',
          category: 'Contract creation, deposits, milestone verification',
        },
        write: {
          ...writeStatus,
          description: '100 write operations per hour',
          category: 'POST, PUT, PATCH, DELETE requests',
        },
        read: {
          ...readStatus,
          description: 'Unlimited read operations',
          category: 'GET requests, contract info, milestone status',
        },
      },
      statistics: statistics || undefined,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[WO-96] Rate limit status error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve rate limit status',
    });
  }
}

export default withOptionalAuth(getRateLimitStatusHandler);


