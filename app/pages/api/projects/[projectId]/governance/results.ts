/**
 * GET /api/projects/[projectId]/governance/results
 * 
 * WO-148: Get voting results for project proposals
 * 
 * Features:
 * - Vote counts
 * - Participation rates
 * - Proposal outcome status
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../../lib/middleware/authMiddleware';
import { prisma } from '../../../../../lib/prisma';

async function projectGovernanceResultsHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { projectId } = req.query;

    const proposals = await prisma.proposal.findMany({
      where: {
        targetProjectId: projectId as string,
      },
      include: {
        votes: {
          select: {
            support: true,
            weight: true,
          },
        },
      },
    });

    const results = proposals.map((proposal: any) => {
      const votesFor = proposal.votes.filter((v: any) => v.support).reduce((sum: number, v: any) => sum + v.weight, 0);
      const votesAgainst = proposal.votes.filter((v: any) => !v.support).reduce((sum: number, v: any) => sum + v.weight, 0);
      const totalVotes = votesFor + votesAgainst;

      const totalStake = 10000; // Simulated total project stake
      const participationRate = (totalVotes / totalStake) * 100;
      const quorumMet = participationRate >= proposal.minQuorum;

      const outcome = quorumMet && votesFor > votesAgainst ? 'PASSED' : 'FAILED';

      return {
        proposalId: proposal.id,
        title: proposal.title,
        status: proposal.status,
        votingResults: {
          votesFor,
          votesAgainst,
          totalVotes,
          participationRate: Math.round(participationRate * 10) / 10,
          quorumMet,
          outcome,
        },
      };
    });

    return res.status(200).json({
      success: true,
      results,
      projectId,
    });

  } catch (error) {
    console.error('[WO-148] Governance results error:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

export default withAuth(projectGovernanceResultsHandler);



