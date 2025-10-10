import { NextApiRequest, NextApiResponse } from 'next';
import { getReputationLeaderboard } from '../../../lib/services/reputationService';

/**
 * GET /api/reputation/leaderboard
 * 
 * Get reputation leaderboard (top users by reputation)
 * 
 * Features:
 * - Public endpoint
 * - Configurable limit (default 10, max 100)
 * - Returns top users by reputation
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { limit = '10' } = req.query;
    const limitNum = Math.min(parseInt(limit as string, 10), 100);

    const leaderboard = await getReputationLeaderboard(limitNum);

    return res.status(200).json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve leaderboard',
    });
  }
}

export default handler;




