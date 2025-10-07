import { NextApiRequest, NextApiResponse } from 'next';
import { governanceService } from '../../../lib/services/governanceService';
import { logger } from '../../../lib/logging/logger';
import {
  errorTracker,
  ErrorSeverity,
  ErrorCategory,
} from '../../../lib/monitoring/errorTracker';
import { CastVoteRequest, VoterInfo } from '../../../types/governance';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Add authentication when auth service is available
    const walletAddress =
      (req.headers['x-wallet-address'] as string) ||
      (req.query.walletAddress as string);

    if (req.method === 'POST') {
      if (!walletAddress) {
        return res.status(400).json({ error: 'Wallet address required' });
      }
      return await handleCastVote(req, res, walletAddress);
    } else if (req.method === 'GET') {
      const { proposalId } = req.query;
      if (!proposalId || typeof proposalId !== 'string') {
        return res.status(400).json({ error: 'Proposal ID required' });
      }
      if (!walletAddress) {
        return res.status(400).json({ error: 'Wallet address required' });
      }
      return await handleGetVoterInfo(req, res, proposalId, walletAddress);
    }
  } catch (error) {
    logger.error('Governance votes API error', {
      error: (error as Error).message,
      method: req.method,
    });

    await errorTracker.trackError(
      error as Error,
      ErrorSeverity.MEDIUM,
      ErrorCategory.BUSINESS_LOGIC,
      {
        metadata: { method: req.method },
      }
    );

    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCastVote(
  req: NextApiRequest,
  res: NextApiResponse,
  voterAddress: string
) {
  try {
    const request: CastVoteRequest = req.body;

    // Validate required fields
    if (!request.proposalId || !request.option) {
      return res
        .status(400)
        .json({ error: 'Missing required fields: proposalId and option' });
    }

    // Validate vote option
    if (!['yes', 'no', 'abstain'].includes(request.option)) {
      return res
        .status(400)
        .json({ error: 'Invalid vote option. Must be yes, no, or abstain' });
    }

    const vote = await governanceService.castVote(request, voterAddress);

    return res.status(200).json({
      success: true,
      data: vote,
    });
  } catch (error) {
    logger.error('Failed to cast vote', { error: (error as Error).message });
    return res.status(400).json({ error: (error as Error).message });
  }
}

async function handleGetVoterInfo(
  req: NextApiRequest,
  res: NextApiResponse,
  proposalId: string,
  voterAddress: string
) {
  try {
    const voterInfo = await governanceService.getVoterInfo(
      proposalId,
      voterAddress
    );

    if (!voterInfo) {
      return res.status(404).json({ error: 'Voter info not found' });
    }

    return res.status(200).json({
      success: true,
      data: voterInfo,
    });
  } catch (error) {
    logger.error('Failed to get voter info', {
      error: (error as Error).message,
      proposalId,
      voterAddress,
    });
    return res.status(500).json({ error: 'Failed to get voter info' });
  }
}
