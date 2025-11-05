/**
 * Integration Test: Governance Workflow
 * Tests the complete governance flow from proposal creation to execution
 */

import { GovernanceService } from '../../lib/services/governanceService';
import { prisma } from '../../lib/prisma';
import {
  createMockUser,
  createMockProposal,
  resetAllMocks,
} from '../utils/mocks';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    proposal: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    vote: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Governance Workflow Integration', () => {
  const creator = createMockUser({ role: 'CREATOR' });
  const voter1 = createMockUser({ id: 'voter-1' });
  const voter2 = createMockUser({ id: 'voter-2' });
  const voter3 = createMockUser({ id: 'voter-3' });
  let proposal: any;

  beforeEach(() => {
    resetAllMocks();
    jest.clearAllMocks();
  });

  describe('Complete Governance Flow', () => {
    it('should complete full governance workflow', async () => {
      const governanceService = GovernanceService.getInstance();

      // Step 1: Create proposal
      const proposalData = {
        title: 'Increase Platform Fee',
        description: 'Proposal to increase platform fee from 2% to 3%',
        type: 'PARAMETER_CHANGE' as const,
        creatorId: creator.id,
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      proposal = createMockProposal({
        ...proposalData,
        id: 'proposal-123',
        status: 'ACTIVE',
        votesFor: 0,
        votesAgainst: 0,
      });

      (prisma.proposal.create as jest.Mock).mockResolvedValue(proposal);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(creator);

      const createdProposal = await governanceService.createProposal(proposalData);
      expect(createdProposal).toBeDefined();
      expect(createdProposal.status).toBe('ACTIVE');

      // Step 2: Users cast votes
      const votes = [
        { userId: voter1.id, vote: 'FOR', votingPower: 100 },
        { userId: voter2.id, vote: 'FOR', votingPower: 150 },
        { userId: voter3.id, vote: 'AGAINST', votingPower: 50 },
      ];

      (prisma.proposal.findUnique as jest.Mock).mockResolvedValue(proposal);
      (prisma.vote.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.vote.create as jest.Mock).mockImplementation((args: any) =>
        Promise.resolve({
          id: `vote-${args.data.userId}`,
          ...args.data,
        })
      );

      for (const voteData of votes) {
        await governanceService.voteOnProposal(
          proposal.id,
          voteData.userId,
          voteData.vote as any,
          voteData.votingPower
        );
      }

      // Step 3: Calculate results
      const totalFor = votes
        .filter((v) => v.vote === 'FOR')
        .reduce((sum, v) => sum + v.votingPower, 0);
      const totalAgainst = votes
        .filter((v) => v.vote === 'AGAINST')
        .reduce((sum, v) => sum + v.votingPower, 0);

      (prisma.proposal.findUnique as jest.Mock).mockResolvedValue({
        ...proposal,
        votesFor: totalFor,
        votesAgainst: totalAgainst,
        totalVotingPower: totalFor + totalAgainst,
      });
      (prisma.vote.findMany as jest.Mock).mockResolvedValue(
        votes.map((v) => ({
          vote: v.vote,
          votingPower: v.votingPower,
        }))
      );
      (prisma.vote.count as jest.Mock).mockResolvedValue(votes.length);

      const results = await governanceService.getProposalResults(proposal.id);

      expect(results.votesFor).toBe(totalFor);
      expect(results.votesAgainst).toBe(totalAgainst);
      expect(results.totalVotingPower).toBe(totalFor + totalAgainst);

      // Step 4: Execute proposal if approved
      if (totalFor > totalAgainst) {
        const approvedProposal = {
          ...proposal,
          status: 'APPROVED',
          votesFor: totalFor,
          votesAgainst: totalAgainst,
        };

        (prisma.proposal.findUnique as jest.Mock).mockResolvedValue(approvedProposal);
        (prisma.proposal.update as jest.Mock).mockResolvedValue({
          ...approvedProposal,
          status: 'EXECUTED',
        });

        const executedProposal = await governanceService.executeProposal(proposal.id);
        expect(executedProposal.status).toBe('EXECUTED');
      }
    });

    it('should handle proposal expiration', async () => {
      const expiredProposal = createMockProposal({
        id: 'proposal-expired',
        status: 'ACTIVE',
        endDate: new Date(Date.now() - 1000), // Expired
      });

      (prisma.proposal.findUnique as jest.Mock).mockResolvedValue(expiredProposal);

      const governanceService = GovernanceService.getInstance();

      await expect(
        governanceService.voteOnProposal(
          expiredProposal.id,
          voter1.id,
          'FOR',
          100
        )
      ).rejects.toThrow();
    });

    it('should prevent duplicate votes', async () => {
      proposal = createMockProposal({
        id: 'proposal-123',
        status: 'ACTIVE',
      });

      (prisma.proposal.findUnique as jest.Mock).mockResolvedValue(proposal);
      (prisma.vote.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-vote',
        userId: voter1.id,
        vote: 'FOR',
      });

      const governanceService = GovernanceService.getInstance();

      await expect(
        governanceService.voteOnProposal(proposal.id, voter1.id, 'FOR', 100)
      ).rejects.toThrow();
    });
  });
});

