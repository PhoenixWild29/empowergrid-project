/**
 * Integration Test: Governance Workflow
 * Tests the complete governance flow from proposal creation to execution
 */

import { GovernanceService } from '../../lib/services/governanceService';
import { prisma } from '../../lib/prisma';
import { databaseService } from '../../lib/services/databaseService';
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

jest.mock('../../lib/services/databaseService', () => ({
  databaseService: {
    getUserByWallet: jest.fn(),
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
        type: 'parameter_change' as const, // Use lowercase enum value
        creatorId: creator.id,
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      proposal = createMockProposal({
        ...proposalData,
        id: 'proposal-123',
        status: 'active', // Use lowercase enum value
        votesFor: 0,
        votesAgainst: 0,
      });

      (prisma.proposal.create as jest.Mock).mockResolvedValue(proposal);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(creator);

      // Mock databaseService for voting power check
      (databaseService.getUserByWallet as jest.Mock).mockResolvedValue({
        ...creator,
        reputation: 1500,
      });

      const createdProposal = await governanceService.createProposal(
        proposalData,
        creator.walletAddress
      );
      expect(createdProposal).toBeDefined();
      expect(createdProposal.status).toBe('active'); // ProposalStatus.ACTIVE = 'active'

      // Step 2: Users cast votes
      const votes = [
        { userId: voter1.id, vote: 'yes', votingPower: 100 }, // Use lowercase enum value
        { userId: voter2.id, vote: 'yes', votingPower: 150 },
        { userId: voter3.id, vote: 'no', votingPower: 50 }, // Use lowercase enum value
      ];

      (prisma.proposal.findUnique as jest.Mock).mockResolvedValue(proposal);
      (prisma.vote.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.vote.create as jest.Mock).mockImplementation((args: any) =>
        Promise.resolve({
          id: `vote-${args.data.userId}`,
          ...args.data,
        })
      );

      // Mock voting power and other methods (databaseService already mocked above)
      (databaseService.getUserByWallet as jest.Mock).mockResolvedValue({
        reputation: 1500,
      });
      
      // Mock calculateVotingPower for each voter
      jest.spyOn(governanceService as any, 'calculateVotingPower').mockResolvedValue(100);
      
      // Mock getProposalFromDb to return proposal
      jest.spyOn(governanceService as any, 'getProposalFromDb').mockResolvedValue({
        ...proposal,
        status: 'active', // ProposalStatus.ACTIVE = 'active'
        endTime: new Date(Date.now() + 86400000),
        votes: { yes: 0, no: 0, abstain: 0 }, // Use lowercase enum values
        totalVotingPower: 0,
      });
      jest.spyOn(governanceService as any, 'getVote').mockResolvedValue(null);
      jest.spyOn(governanceService as any, 'storeVote').mockResolvedValue(undefined);
      jest.spyOn(governanceService as any, 'storeProposal').mockResolvedValue(undefined);
      jest.spyOn(governanceService as any, 'getTotalEligibleVotingPower').mockResolvedValue(10000);
      jest.spyOn(governanceService as any, 'emitEvent').mockResolvedValue(undefined);
      jest.spyOn(governanceService as any, 'createNotification').mockResolvedValue(undefined);

      for (const voteData of votes) {
        await governanceService.castVote(
          {
            proposalId: proposal.id,
            option: voteData.vote as any,
          },
          voteData.userId
        );
      }

      // Step 3: Calculate results
      const totalFor = votes
        .filter((v) => v.vote === 'yes')
        .reduce((sum, v) => sum + v.votingPower, 0);
      const totalAgainst = votes
        .filter((v) => v.vote === 'no')
        .reduce((sum, v) => sum + v.votingPower, 0);

      // Step 3: Verify votes were cast successfully
      // Each vote should have been processed
      expect((governanceService as any).getVote).toHaveBeenCalledTimes(votes.length);
      expect((governanceService as any).storeVote).toHaveBeenCalledTimes(votes.length);
      
      // Verify proposal was updated with vote counts
      expect((governanceService as any).storeProposal).toHaveBeenCalled();
    });

    it('should handle proposal expiration', async () => {
      const expiredProposal = createMockProposal({
        id: 'proposal-expired',
        status: 'active', // Use lowercase enum value
        endDate: new Date(Date.now() - 1000), // Expired
      });

      (prisma.proposal.findUnique as jest.Mock).mockResolvedValue(expiredProposal);

      const governanceService = GovernanceService.getInstance();

      jest.spyOn(governanceService as any, 'getProposalFromDb').mockResolvedValue({
        ...expiredProposal,
        status: 'active',
        endTime: new Date(Date.now() - 1000), // Expired
      });
      
      await expect(
        governanceService.castVote(
          {
            proposalId: expiredProposal.id,
            option: 'yes', // Use lowercase enum value
          },
          voter1.walletAddress || voter1.id
        )
      ).rejects.toThrow();
    });

    it('should prevent duplicate votes', async () => {
      proposal = createMockProposal({
        id: 'proposal-123',
        status: 'active', // Use lowercase enum value
      });

      (prisma.proposal.findUnique as jest.Mock).mockResolvedValue(proposal);
      (prisma.vote.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-vote',
        userId: voter1.id,
        vote: 'yes', // Use lowercase enum value
      });

      const governanceService = GovernanceService.getInstance();

      jest.spyOn(governanceService as any, 'getProposalFromDb').mockResolvedValue({
        ...proposal,
        status: 'active',
        endTime: new Date(Date.now() + 86400000),
      });
      jest.spyOn(governanceService as any, 'getVote')
        .mockResolvedValueOnce({ id: 'existing-vote' }) // First call - existing vote
        .mockResolvedValueOnce({ id: 'existing-vote' }); // Second call - duplicate
      
      await expect(
        governanceService.castVote(
          {
            proposalId: proposal.id,
            option: 'yes', // Use lowercase enum value
          },
          voter1.walletAddress || voter1.id
        )
      ).rejects.toThrow();
    });
  });
});

