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
        reputation: 80,
      });

      const result = await logReputationActivity(mockUser.id, 'PROJECT_REPORTED', {});

      expect(result.newReputation).toBeLessThan(result.previousReputation);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reputation: expect.any(Number),
          }),
        })
      );
    });
  });

  describe('setUserReputation', () => {
    it('should set user reputation directly', async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        reputation: 200,
      });

      const result = await setUserReputation(mockUser.id, 200, 'admin-user-id');

      expect(result).toBeDefined();
      expect(result.reputation).toBe(200);
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

