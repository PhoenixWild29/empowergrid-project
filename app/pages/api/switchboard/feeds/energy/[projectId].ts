/**
 * GET /api/switchboard/feeds/energy/[projectId]
 * 
 * WO-131: Retrieve energy production data feeds for a project
 * 
 * Features:
 * - Geographic filtering
 * - Equipment type filtering
 * - Cost information
 * - Quality metrics
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../../lib/middleware/authMiddleware';
import { switchboardSubscriptionService } from '../../../../../lib/services/oracle/switchboardSubscriptionService';

async function energyFeedsHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const { projectId } = req.query;

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'projectId parameter is required',
      });
    }

    // Query parameters for filtering
    const location = req.query.location as string | undefined;
    const equipmentType = req.query.equipmentType as string | undefined;

    console.log('[WO-131] Fetching energy feeds for project:', projectId);

    // Get energy feeds
    const feeds = await switchboardSubscriptionService.getEnergyFeedsByProject(
      projectId,
      {
        location,
        equipmentType,
      }
    );

    const responseTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      feeds,
      total: feeds.length,
      filters: {
        location,
        equipmentType,
      },
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[WO-131] Energy feeds error:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve energy feeds',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuth(energyFeedsHandler);



