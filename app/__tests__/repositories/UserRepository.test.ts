jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    userStats: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

import { UserRepository } from '../../lib/repositories/userRepository';
import { UserRole } from '@prisma/client';
import { prisma } from '../../lib/prisma';

// Get references to the mocked functions
const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockUserFindUnique = mockPrisma.user.findUnique as jest.MockedFunction<
  typeof mockPrisma.user.findUnique
>;
const mockUserFindFirst = mockPrisma.user.findFirst as jest.MockedFunction<
  typeof mockPrisma.user.findFirst
>;
const mockUserCreate = mockPrisma.user.create as jest.MockedFunction<
  typeof mockPrisma.user.create
>;
const mockUserUpdate = mockPrisma.user.update as jest.MockedFunction<
  typeof mockPrisma.user.update
>;
const mockUserDelete = mockPrisma.user.delete as jest.MockedFunction<
  typeof mockPrisma.user.delete
>;
const mockUserFindMany = mockPrisma.user.findMany as jest.MockedFunction<
  typeof mockPrisma.user.findMany
>;
const mockUserStatsUpdate = mockPrisma.userStats.update as jest.MockedFunction<
  typeof mockPrisma.userStats.update
>;
const mockUserStatsFindUnique = mockPrisma.userStats
  .findUnique as jest.MockedFunction<typeof mockPrisma.userStats.findUnique>;

describe('UserRepository', () => {
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = new UserRepository();
    jest.clearAllMocks();
  });

  describe('findByWalletAddress', () => {
    test('should return user when found', async () => {
      const mockUser = {
        id: 'user-1',
        walletAddress: 'test-wallet',
        username: 'testuser',
        email: null,
        phoneNumber: null,
        role: UserRole.FUNDER,
        reputation: 50,
        verified: false,
        avatar: null,
        bio: null,
        website: null,
        socialLinks: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        userStats: {
          projectsCreated: 1,
          projectsFunded: 2,
          totalFunded: 100,
          successfulProjects: 1,
        },
      };

      mockUserFindUnique.mockResolvedValue(mockUser);

      const result = await userRepository.findByWalletAddress('test-wallet');

      expect(result).toEqual(mockUser);
      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { walletAddress: 'test-wallet' },
        include: { userStats: true },
      });
    });

    test('should return null when user not found', async () => {
      mockUserFindUnique.mockResolvedValue(null);

      const result = await userRepository.findByWalletAddress('nonexistent');

      expect(result).toBeNull();
    });

    test('should throw error on database failure', async () => {
      mockUserFindUnique.mockRejectedValue(new Error('Database error'));

      await expect(userRepository.findByWalletAddress('test')).rejects.toThrow(
        'Failed to find user'
      );
    });
  });

  describe('create', () => {
    test('should create user with stats', async () => {
      const mockUser = {
        id: 'user-1',
        walletAddress: 'test-wallet',
        username: 'testuser',
        email: null,
        phoneNumber: null,
        role: UserRole.CREATOR,
        reputation: 0,
        verified: false,
        avatar: null,
        bio: null,
        website: null,
        socialLinks: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        userStats: {
          projectsCreated: 0,
          projectsFunded: 0,
          totalFunded: 0,
          successfulProjects: 0,
        },
      };

      mockUserCreate.mockResolvedValue(mockUser);

      const result = await userRepository.create({
        walletAddress: 'test-wallet',
        username: 'testuser',
        role: UserRole.CREATOR,
      });

      expect(result).toEqual(mockUser);
      expect(mockUserCreate).toHaveBeenCalledWith({
        data: {
          walletAddress: 'test-wallet',
          username: 'testuser',
          role: UserRole.CREATOR,
          userStats: {
            create: {
              projectsCreated: 0,
              projectsFunded: 0,
              totalFunded: 0,
              successfulProjects: 0,
              totalEarnings: 0,
            },
          },
        },
        include: {
          userStats: true,
        },
      });
    });

    test('should throw error on creation failure', async () => {
      mockUserCreate.mockRejectedValue(
        new Error('Unique constraint violation')
      );

      await expect(
        userRepository.create({
          walletAddress: 'test',
          username: 'test',
          role: 'GUEST',
        })
      ).rejects.toThrow('Failed to create user');
    });
  });

  describe('update', () => {
    test('should update user profile', async () => {
      const mockUpdatedUser = {
        id: 'user-1',
        walletAddress: 'test-wallet',
        username: 'updateduser',
        email: null,
        phoneNumber: null,
        role: UserRole.FUNDER,
        reputation: 0,
        verified: false,
        avatar: null,
        bio: 'New bio',
        website: null,
        socialLinks: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        userStats: {
          projectsCreated: 0,
          projectsFunded: 0,
          totalFunded: 0,
          successfulProjects: 0,
        },
      };

      mockUserUpdate.mockResolvedValue(mockUpdatedUser);

      const result = await userRepository.update('user-1', {
        username: 'updateduser',
        bio: 'New bio',
      });

      expect(result).toEqual(mockUpdatedUser);
      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          username: 'updateduser',
          bio: 'New bio',
        },
        include: { userStats: true },
      });
    });
  });

  describe('updateStats', () => {
    test('should update user statistics', async () => {
      const mockUpdatedStats = {
        id: 'stats-1',
        userId: 'user-1',
        projectsCreated: 5,
        projectsFunded: 0,
        totalFunded: 1000,
        successfulProjects: 0,
        totalEarnings: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserStatsUpdate.mockResolvedValue(mockUpdatedStats);

      const result = await userRepository.updateStats('user-1', {
        projectsCreated: 5,
        totalFunded: 1000,
      });

      expect(result).toEqual(mockUpdatedStats);
      expect(mockUserStatsUpdate).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: {
          projectsCreated: 5,
          totalFunded: 1000,
        },
      });
    });
  });

  describe('isUsernameAvailable', () => {
    test('should return true when username is available', async () => {
      mockUserFindFirst.mockResolvedValue(null);

      const result = await userRepository.isUsernameAvailable('newusername');

      expect(result).toBe(true);
    });

    test('should return false when username exists', async () => {
      mockUserFindFirst.mockResolvedValue({
        id: 'user-1',
        walletAddress: 'existing-wallet',
        username: 'existinguser',
        email: null,
        phoneNumber: null,
        role: UserRole.FUNDER,
        reputation: 0,
        verified: false,
        avatar: null,
        bio: null,
        website: null,
        socialLinks: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await userRepository.isUsernameAvailable('existinguser');

      expect(result).toBe(false);
    });

    test('should exclude specified user when checking availability', async () => {
      mockUserFindFirst.mockResolvedValue(null);

      await userRepository.isUsernameAvailable('username', 'user-1');

      expect(mockUserFindFirst).toHaveBeenCalledWith({
        where: {
          username: 'username',
          id: { not: 'user-1' },
        },
      });
    });
  });

  describe('searchByUsername', () => {
    test('should search users by username', async () => {
      const mockUsers = [
        {
          id: '1',
          walletAddress: 'wallet1',
          username: 'alice',
          email: null,
          phoneNumber: null,
          role: UserRole.FUNDER,
          reputation: 100,
          verified: false,
          avatar: null,
          bio: null,
          website: null,
          socialLinks: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          walletAddress: 'wallet2',
          username: 'bob',
          email: null,
          phoneNumber: null,
          role: UserRole.FUNDER,
          reputation: 80,
          verified: false,
          avatar: null,
          bio: null,
          website: null,
          socialLinks: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockUserFindMany.mockResolvedValue(mockUsers);

      const result = await userRepository.searchByUsername('ali', 5);

      expect(result).toEqual(mockUsers);
      expect(mockUserFindMany).toHaveBeenCalledWith({
        where: {
          username: {
            contains: 'ali',
            mode: 'insensitive',
          },
        },
        include: { userStats: true },
        take: 5,
        orderBy: { reputation: 'desc' },
      });
    });
  });

  describe('getTopUsers', () => {
    test('should get top users by reputation', async () => {
      const mockUsers = [
        {
          id: '1',
          walletAddress: 'wallet1',
          username: 'alice',
          email: null,
          phoneNumber: null,
          role: UserRole.FUNDER,
          reputation: 100,
          verified: false,
          avatar: null,
          bio: null,
          website: null,
          socialLinks: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          walletAddress: 'wallet2',
          username: 'bob',
          email: null,
          phoneNumber: null,
          role: UserRole.FUNDER,
          reputation: 80,
          verified: false,
          avatar: null,
          bio: null,
          website: null,
          socialLinks: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockUserFindMany.mockResolvedValue(mockUsers);

      const result = await userRepository.getTopUsers(10);

      expect(result).toEqual(mockUsers);
      expect(mockUserFindMany).toHaveBeenCalledWith({
        include: { userStats: true },
        orderBy: { reputation: 'desc' },
        take: 10,
      });
    });
  });
});
