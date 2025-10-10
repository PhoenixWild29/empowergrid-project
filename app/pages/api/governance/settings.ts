/**
 * GET /api/governance/settings
 * 
 * WO-134: Get governance configuration
 * 
 * Features:
 * - System-wide governance settings
 * - Token requirements
 * - Voting parameters
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/middleware/authMiddleware';
import { prisma } from '../../../lib/prisma';

async function governanceSettingsHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get active governance settings (or create default if none exist)
    let settings = await prisma.governanceSettings.findFirst({
      where: { isActive: true },
    });

    if (!settings) {
      // Create default settings
      settings = await prisma.governanceSettings.create({
        data: {
          minQuorum: 10,
          votingPeriodDays: 7,
          proposalThreshold: 100,
          governanceToken: 'GRIDtokenMintAddress',
          tokenDecimals: 9,
          executionDelay: 86400,
          minTokensToVote: 1,
          isActive: true,
        },
      });
    }

    return res.status(200).json({
      success: true,
      settings: {
        minQuorum: settings.minQuorum,
        votingPeriodDays: settings.votingPeriodDays,
        proposalThreshold: settings.proposalThreshold,
        governanceToken: settings.governanceToken,
        tokenDecimals: settings.tokenDecimals,
        executionDelay: settings.executionDelay,
        minTokensToVote: settings.minTokensToVote,
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[WO-134] Settings error:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch governance settings',
    });
  }
}

export default withAuth(governanceSettingsHandler);



