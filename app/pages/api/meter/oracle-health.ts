import type { NextApiRequest, NextApiResponse } from 'next';
import { oracleManager } from '../../../lib/oracles/oracleManager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const healthStatus = oracleManager.getHealthStatus();
    const providers = oracleManager.getAllProviders();

    // Calculate additional health metrics
    const providerDetails = providers.map(provider => ({
      name: provider.name,
      enabled: provider.enabled,
      reputation: provider.reputation,
      consecutiveFailures: provider.consecutiveFailures,
      lastSuccess: provider.lastSuccess,
      lastFailure: provider.lastFailure,
      uptime: provider.lastSuccess
        ? (Date.now() - (provider.lastFailure || provider.lastSuccess)) / (1000 * 60 * 60) // hours
        : 0,
      status: provider.enabled && provider.consecutiveFailures === 0 ? 'healthy' :
              provider.enabled && provider.consecutiveFailures < 3 ? 'degraded' :
              provider.enabled ? 'unhealthy' : 'disabled',
    }));

    const consensusConfig = oracleManager.getConsensusConfig();

    return res.status(200).json({
      timestamp: Date.now(),
      healthStatus,
      providers: providerDetails,
      consensusConfig,
      overallStatus: healthStatus.healthyProviders >= consensusConfig.minSources ? 'healthy' : 'degraded',
    });

  } catch (error) {
    console.error('Oracle health API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: (error as Error).message,
    });
  }
}