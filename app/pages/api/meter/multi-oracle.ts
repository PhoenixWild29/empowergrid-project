import type { NextApiRequest, NextApiResponse } from 'next';
import { oracleManager } from '../../../lib/oracles/oracleManager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { projectId } = req.query;

  if (!projectId || typeof projectId !== 'string') {
    return res.status(400).json({
      error: 'Project ID is required',
      usage: '/api/meter/multi-oracle?projectId=<project-id>'
    });
  }

  try {
    // Get aggregated reading from multiple oracles
    const aggregatedReading = await oracleManager.getAggregatedReading(projectId);

    if (!aggregatedReading) {
      return res.status(503).json({
        error: 'Unable to get consensus from oracle network',
        projectId,
        healthStatus: oracleManager.getHealthStatus(),
      });
    }

    // Return the aggregated reading
    return res.status(200).json({
      projectId,
      ...aggregatedReading,
      healthStatus: oracleManager.getHealthStatus(),
    });

  } catch (error) {
    console.error('Multi-oracle API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      projectId,
      message: (error as Error).message,
    });
  }
}