/**
 * Governance Service Tests
 */

import { GovernanceService, ProposalType } from '../../lib/services/governanceService';
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
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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

describe('GovernanceService', () => {
  let governanceService: GovernanceService;
  const mockUser = createMockUser();
  const mockProposal = createMockProposal({ creatorId: mockUser.id });

  beforeEach(() => {
    resetAllMocks();
    governanceService = GovernanceService.getInstance();
    jest.clearAllMocks();
  });

  describe('createProposal', () => {
    it('should create a proposal successfully', async () => {
      const proposalData = {
        title: 'Test Proposal',
        description: 'Test description',
        type: 'PROJECT_FUNDING' as ProposalType,
        creatorId: mockUser.id,
        projectId: 'project-123',
        targetAmount: 1000000000,
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      (prisma.proposal.create as jest.Mock).mockResolvedValue(mockProposal);

      const result = await governanceService.createProposal(proposalData);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockProposal.id);
      expect(prisma.proposal.create).toHaveBeenCalled();
    });

    it('should validate proposal data', async () => {
      const invalidData = {
        title: '',
        description: '',
        type: 'INVALID_TYPE' as any,
        creatorId: '',
      };

      await expect(
        governanceService.createProposal(invalidData as any)
      ).rejects.toThrow();
    });
  });

  describe('castVote', () => {
    it('should cast a vote successfully', async () => {
      (prisma.proposal.findUnique as jest.Mock).mockResolvedValue(mockProposal);
      (prisma.vote.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await governanceService.castVote(
        mockProposal.id,
        mockUser.walletAddress,
        'yes'
      );

      expect(result).toBeDefined();
    });

    it('should prevent duplicate votes', async () => {
      (prisma.proposal.findUnique as jest.Mock).mockResolvedValue(mockProposal);
      (prisma.vote.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-vote',
        vote: 'yes',
      });

      await expect(
        governanceService.castVote(mockProposal.id, mockUser.walletAddress, 'yes')
      ).rejects.toThrow();
    });

    it('should prevent voting on closed proposals', async () => {
      const closedProposal = createMockProposal({
        status: 'CLOSED',
        endDate: new Date(Date.now() - 1000),
      });
      (prisma.proposal.findUnique as jest.Mock).mockResolvedValue(closedProposal);

      await expect(
        governanceService.castVote(
          closedProposal.id,
          mockUser.walletAddress,
          'yes'
        )
      ).rejects.toThrow();
    });
  });

  describe('getProposal', () => {
    it('should retrieve proposal', async () => {
      (prisma.proposal.findUnique as jest.Mock).mockResolvedValue(mockProposal);

      const result = await governanceService.getProposal(mockProposal.id);

      expect(result).toBeDefined();
      if (result) {
        expect(result.id).toBe(mockProposal.id);
      }
    });

    it('should return null for non-existent proposal', async () => {
      (prisma.proposal.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await governanceService.getProposal('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getProposals', () => {
    it('should list proposals with filters', async () => {
      const proposals = [mockProposal, createMockProposal()];
      (prisma.proposal.findMany as jest.Mock).mockResolvedValue(proposals);

      const result = await governanceService.getProposals({
        status: 'ACTIVE',
        type: 'PROJECT_FUNDING',
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should support pagination', async () => {
      (prisma.proposal.findMany as jest.Mock).mockResolvedValue([mockProposal]);

      const result = await governanceService.getProposals({
        page: 1,
        limit: 10,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

