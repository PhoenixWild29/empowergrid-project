/**
 * Governance Proposals API Tests
 */

import { createMocks } from 'node-mocks-http';
import { createMockProposal, createMockUser, resetAllMocks } from '../../../../utils/mocks';

// Mock prisma - need 5 levels up to reach app root, then into lib
jest.mock('../../../../../lib/prisma', () => ({
  prisma: {
    proposal: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    governanceSettings: {
      findFirst: jest.fn(),
    },
  },
}));

import { prisma } from '../../../../../lib/prisma';

jest.mock('../../../../../lib/middleware/authMiddleware', () => ({
  withAuth: jest.fn((handler) => handler),
  withOptionalAuth: jest.fn((handler) => handler),
}));

// Import handler after mocks are set up  
// Use @ alias configured in jest.config.js
import handler from '@/pages/api/governance/proposals/index';

describe('/api/governance/proposals', () => {
  const mockUser = createMockUser();
  const mockProposal = createMockProposal({ creatorId: mockUser.id });

  beforeEach(() => {
    resetAllMocks();
    jest.clearAllMocks();
    (prisma.governanceSettings.findFirst as jest.Mock).mockResolvedValue({
      isActive: true,
      proposalThreshold: 100,
    });
  });

  describe('GET /api/governance/proposals', () => {
    it('should list proposals successfully', async () => {
      // Mock proposal with required structure (proposer and votes)
      const proposalWithRelations = {
        ...mockProposal,
        proposer: {
          id: mockUser.id,
          username: mockUser.username,
          walletAddress: mockUser.walletAddress,
        },
        votes: [],
      };
      
      (prisma.proposal.findMany as jest.Mock).mockResolvedValue([proposalWithRelations]);
      (prisma.proposal.count as jest.Mock).mockResolvedValue(1);

      const { req, res } = createMocks({
        method: 'GET',
        query: {},
      });
      (req as any).user = { id: mockUser.id };

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.proposals).toBeDefined();
      expect(Array.isArray(data.proposals)).toBe(true);
    });

    it('should filter proposals by status', async () => {
      const proposalWithRelations = {
        ...mockProposal,
        proposer: {
          id: mockUser.id,
          username: mockUser.username,
          walletAddress: mockUser.walletAddress,
        },
        votes: [],
      };
      
      (prisma.proposal.findMany as jest.Mock).mockResolvedValue([proposalWithRelations]);
      (prisma.proposal.count as jest.Mock).mockResolvedValue(1);

      const { req, res } = createMocks({
        method: 'GET',
        query: { status: 'ACTIVE' },
      });
      (req as any).user = { id: mockUser.id };

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(prisma.proposal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
          }),
        })
      );
    });

    it('should support pagination', async () => {
      const proposalWithRelations = {
        ...mockProposal,
        proposer: {
          id: mockUser.id,
          username: mockUser.username,
          walletAddress: mockUser.walletAddress,
        },
        votes: [],
      };
      
      (prisma.proposal.findMany as jest.Mock).mockResolvedValue([proposalWithRelations]);
      (prisma.proposal.count as jest.Mock).mockResolvedValue(1);

      const { req, res } = createMocks({
        method: 'GET',
        query: { page: '2', limit: '10' },
      });
      (req as any).user = { id: mockUser.id };

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(prisma.proposal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });
  });

  describe('POST /api/governance/proposals', () => {
    it('should create proposal successfully', async () => {
      const proposalData = {
        title: 'Test Proposal',
        description: 'Test description that is long enough',
        proposalType: 'GENERAL',
        votingPeriodDays: 7,
        minQuorum: 10,
      };

      const createdProposal = {
        ...mockProposal,
        ...proposalData,
        proposer: {
          id: mockUser.id,
          username: mockUser.username,
          walletAddress: mockUser.walletAddress,
        },
      };

      (prisma.proposal.create as jest.Mock).mockResolvedValue(createdProposal);

      const { req, res } = createMocks({
        method: 'POST',
        body: proposalData,
      });
      (req as any).user = { id: mockUser.id };

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.proposal).toBeDefined();
      expect(prisma.proposal.create).toHaveBeenCalled();
    });

    it('should validate proposal data', async () => {
      const invalidData = {
        title: '',
        description: '',
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: invalidData,
      });
      (req as any).user = { id: mockUser.id };

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });
  });
});

