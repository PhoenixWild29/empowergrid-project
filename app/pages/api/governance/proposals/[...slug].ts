import { NextApiRequest, NextApiResponse } from 'next';
import { governanceService } from '../../../../lib/services/governanceService';
import { logger } from '../../../../lib/logging/logger';
import {
  errorTracker,
  ErrorSeverity,
  ErrorCategory,
} from '../../../../lib/monitoring/errorTracker';
import {
  Proposal,
  ProposalStatus,
  ProposalType,
  CreateProposalRequest,
  UpdateProposalRequest,
} from '../../../../types/governance';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { slug } = req.query;
  const action = slug?.[0];
  const proposalId = slug?.[1];

  try {
    // TODO: Add authentication when auth service is available
    // For now, accept a wallet address from headers or query params
    const walletAddress =
      (req.headers['x-wallet-address'] as string) ||
      (req.query.walletAddress as string);

    switch (req.method) {
      case 'GET':
        if (action === 'list') {
          return await handleListProposals(req, res);
        } else if (action === 'stats') {
          return await handleGetStats(req, res);
        } else if (proposalId) {
          return await handleGetProposal(req, res, proposalId);
        }
        break;

      case 'POST':
        if (action === 'create') {
          if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address required' });
          }
          return await handleCreateProposal(req, res, walletAddress);
        }
        break;

      case 'PUT':
        if (proposalId) {
          if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address required' });
          }
          return await handleUpdateProposal(
            req,
            res,
            proposalId,
            walletAddress
          );
        }
        break;

      case 'DELETE':
        if (proposalId) {
          if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address required' });
          }
          return await handleCancelProposal(
            req,
            res,
            proposalId,
            walletAddress
          );
        }
        break;
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    logger.error('Governance API error', {
      error: (error as Error).message,
      method: req.method,
      action,
      proposalId,
    });

    await errorTracker.trackError(
      error as Error,
      ErrorSeverity.MEDIUM,
      ErrorCategory.BUSINESS_LOGIC,
      {
        action,
        metadata: {
          method: req.method,
          proposalId,
        },
      }
    );

    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleListProposals(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { status, type, proposer, limit = '20', offset = '0' } = req.query;

    const filters = {
      status: status as ProposalStatus,
      type: type as ProposalType,
      proposer: proposer as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    const proposals = await governanceService.getProposals(filters);

    return res.status(200).json({
      success: true,
      data: proposals,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        hasMore: proposals.length === filters.limit,
      },
    });
  } catch (error) {
    logger.error('Failed to list proposals', {
      error: (error as Error).message,
    });
    return res.status(500).json({ error: 'Failed to list proposals' });
  }
}

async function handleGetProposal(
  req: NextApiRequest,
  res: NextApiResponse,
  proposalId: string
) {
  try {
    const proposal = await governanceService.getProposal(proposalId);

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    return res.status(200).json({
      success: true,
      data: proposal,
    });
  } catch (error) {
    logger.error('Failed to get proposal', {
      error: (error as Error).message,
      proposalId,
    });
    return res.status(500).json({ error: 'Failed to get proposal' });
  }
}

async function handleCreateProposal(
  req: NextApiRequest,
  res: NextApiResponse,
  proposerAddress: string
) {
  try {
    const request: CreateProposalRequest = req.body;

    // Validate required fields
    if (!request.title || !request.description || !request.type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate proposal type specific fields
    switch (request.type) {
      case ProposalType.PROJECT_FUNDING:
        if (!request.projectId || !request.fundingAmount) {
          return res.status(400).json({
            error: 'Project funding requires projectId and fundingAmount',
          });
        }
        break;
      case ProposalType.MILESTONE_APPROVAL:
        if (!request.projectId || !request.milestoneId) {
          return res.status(400).json({
            error: 'Milestone approval requires projectId and milestoneId',
          });
        }
        break;
      case ProposalType.PARAMETER_CHANGE:
        if (
          !request.targetContract ||
          !request.targetFunction ||
          !request.parameters
        ) {
          return res.status(400).json({
            error:
              'Parameter change requires targetContract, targetFunction, and parameters',
          });
        }
        break;
      case ProposalType.TREASURY_ALLOCATION:
        if (!request.fundingAmount) {
          return res
            .status(400)
            .json({ error: 'Treasury allocation requires fundingAmount' });
        }
        break;
    }

    const proposal = await governanceService.createProposal(
      request,
      proposerAddress
    );

    return res.status(201).json({
      success: true,
      data: proposal,
    });
  } catch (error) {
    logger.error('Failed to create proposal', {
      error: (error as Error).message,
    });
    return res.status(400).json({ error: (error as Error).message });
  }
}

async function handleUpdateProposal(
  req: NextApiRequest,
  res: NextApiResponse,
  proposalId: string,
  updaterAddress: string
) {
  try {
    const updates: UpdateProposalRequest = req.body;

    const proposal = await governanceService.updateProposal(
      proposalId,
      updates,
      updaterAddress
    );

    return res.status(200).json({
      success: true,
      data: proposal,
    });
  } catch (error) {
    logger.error('Failed to update proposal', {
      error: (error as Error).message,
      proposalId,
    });
    return res.status(400).json({ error: (error as Error).message });
  }
}

async function handleCancelProposal(
  req: NextApiRequest,
  res: NextApiResponse,
  proposalId: string,
  cancellerAddress: string
) {
  try {
    await governanceService.cancelProposal(proposalId, cancellerAddress);

    return res.status(200).json({
      success: true,
      message: 'Proposal cancelled successfully',
    });
  } catch (error) {
    logger.error('Failed to cancel proposal', {
      error: (error as Error).message,
      proposalId,
    });
    return res.status(400).json({ error: (error as Error).message });
  }
}

async function handleGetStats(req: NextApiRequest, res: NextApiResponse) {
  try {
    const stats = await governanceService.getGovernanceStats();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Failed to get governance stats', {
      error: (error as Error).message,
    });
    return res.status(500).json({ error: 'Failed to get governance stats' });
  }
}
