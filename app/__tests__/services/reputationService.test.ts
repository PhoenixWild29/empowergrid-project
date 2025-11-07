/**
 * Reputation Service Tests
 */

import {
  getUserReputation,
  logReputationActivity,
  setUserReputation,
  getReputationLeaderboard,
  getUserReputationRank,
} from '../../lib/services/reputationService';
import { prisma } from '../../lib/prisma';
import { createMockUser, resetAllMocks } from '../utils/mocks';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    reputationActivity: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('ReputationService', () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    resetAllMocks();
    jest.clearAllMocks();
  });

  describe('getUserReputation', () => {
    it('should retrieve user reputation', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        reputation: 100,
      });

      const result = await getUserReputation(mockUser.id);

      expect(result).toBeDefined();
      expect(result.reputation).toBe(100);
      expect(result.userId).toBe(mockUser.id);
      expect(result.username).toBeDefined();
    });

    it('should return default reputation for new user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        reputation: 0,
      });

      const result = await getUserReputation(mockUser.id);

      expect(result.reputation).toBe(0);
      expect(result.userId).toBe(mockUser.id);
    });
  });

  describe('logReputationActivity', () => {
    it('should log reputation activity and update score', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        reputation: 100,
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        reputation: 110,
      });
      // Mock reputationActivity.create (though it's not used in the current implementation)
      (prisma.reputationActivity.create as jest.Mock).mockResolvedValue({
        id: 'activity-1',
        userId: mockUser.id,
        activity: 'PROJECT_CREATED',
        pointsAwarded: 10,
        metadata: { projectId: 'project-123' },
        createdAt: new Date(),
      });

      const result = await logReputationActivity(
        mockUser.id,
        'PROJECT_CREATED',
        { projectId: 'project-123' }
      );

      expect(result).toBeDefined();
      expect(result.previousReputation).toBe(100);
      expect(result.pointsAwarded).toBeGreaterThan(0);
      expect(result.newReputation).toBe(110);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({
            reputation: 110,
          }),
        })
      );
    });

    it('should handle negative reputation changes', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        reputation: 100,
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        reputation: 95, // 100 - 5 = 95 (NEGATIVE_REVIEW is -5 points)
      });
      // Mock reputationActivity.create
      (prisma.reputationActivity.create as jest.Mock).mockResolvedValue({
        id: 'activity-1',
        userId: mockUser.id,
        activity: 'NEGATIVE_REVIEW',
        pointsAwarded: -5,
        metadata: {},
        createdAt: new Date(),
      });

      const result = await logReputationActivity(mockUser.id, 'NEGATIVE_REVIEW', {});

      // NEGATIVE_REVIEW should reduce reputation (negative points)
      expect(result.newReputation).toBeLessThan(result.previousReputation);
      expect(result.previousReputation).toBe(100);
      expect(result.newReputation).toBeGreaterThanOrEqual(0);
      expect(result.pointsAwarded).toBeLessThan(0); // Should be negative
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({
            reputation: expect.any(Number),
          }),
        })
      );
    });
  });

  describe('setUserReputation', () => {
    it('should set user reputation directly', async () => {
      // Mock the initial reputation lookup
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        reputation: 100,
      });
      // Mock the update result
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        reputation: 200,
      });

      const result = await setUserReputation(mockUser.id, 200, 'admin-user-id');

      expect(result).toBeDefined();
      expect(result.newReputation).toBe(200);
      expect(result.previousReputation).toBe(100);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: { reputation: true },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { reputation: 200 },
      });
    });
  });

  describe('getReputationLeaderboard', () => {
    it('should return top users by reputation', async () => {
      const topUsers = [
        { ...mockUser, id: 'user-1', reputation: 1000 },
        { ...mockUser, id: 'user-2', reputation: 900 },
        { ...mockUser, id: 'user-3', reputation: 800 },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(topUsers);

      const result = await getReputationLeaderboard(10);

      expect(result).toBeDefined();
      expect(result.length).toBe(3);
      expect(result[0].reputation).toBe(1000);
      expect(result[0].userId).toBe('user-1');
    });

    it('should respect limit parameter', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      await getReputationLeaderboard(5);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });
  });

  describe('getUserReputationRank', () => {
    it('should calculate user rank correctly', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        reputation: 100,
      });
      (prisma.user.count as jest.Mock).mockResolvedValue(5);

      const result = await getUserReputationRank(mockUser.id);

      expect(result).toBeDefined();
      expect(result.rank).toBeGreaterThan(0);
    });

    it('should throw error for non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(getUserReputationRank('non-existent')).rejects.toThrow('User not found');
    });
  });
});

