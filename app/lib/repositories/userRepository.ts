import { prisma } from '../prisma';
import { User, UserRole, UserStats } from '@prisma/client';
import { PublicKey } from '@solana/web3.js';

export interface CreateUserData {
  walletAddress: string;
  username: string;
  email?: string;
  role: UserRole;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  bio?: string;
  website?: string;
  socialLinks?: any;
  avatar?: string;
}

export class UserRepository {
  /**
   * Find user by wallet address
   */
  async findByWalletAddress(walletAddress: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { walletAddress },
        include: {
          userStats: true,
        },
      });
    } catch (error) {
      console.error('Error finding user by wallet address:', error);
      throw new Error('Failed to find user');
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { id },
        include: {
          userStats: true,
        },
      });
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw new Error('Failed to find user');
    }
  }

  /**
   * Find user by ID with stats
   */
  async findByIdWithStats(id: string) {
    try {
      return await prisma.user.findUnique({
        where: { id },
        include: {
          userStats: true,
        },
      });
    } catch (error) {
      console.error('Error finding user by ID with stats:', error);
      throw new Error('Failed to find user');
    }
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { username },
        include: {
          userStats: true,
        },
      });
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw new Error('Failed to find user');
    }
  }

  /**
   * Create a new user
   */
  async create(userData: CreateUserData): Promise<User> {
    try {
      const user = await prisma.user.create({
        data: {
          ...userData,
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

      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  /**
   * Update user profile
   */
  async update(id: string, updateData: UpdateUserData): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id },
        data: updateData,
        include: {
          userStats: true,
        },
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  /**
   * Update user statistics
   */
  async updateStats(userId: string, stats: Partial<UserStats>): Promise<UserStats> {
    try {
      return await prisma.userStats.update({
        where: { userId },
        data: stats,
      });
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw new Error('Failed to update user statistics');
    }
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  /**
   * Check if username is available
   */
  async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    try {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          ...(excludeUserId && { id: { not: excludeUserId } }),
        },
      });

      return !existingUser;
    } catch (error) {
      console.error('Error checking username availability:', error);
      throw new Error('Failed to check username availability');
    }
  }

  /**
   * Check if email is available
   */
  async isEmailAvailable(email: string, excludeUserId?: string): Promise<boolean> {
    try {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          ...(excludeUserId && { id: { not: excludeUserId } }),
        },
      });

      return !existingUser;
    } catch (error) {
      console.error('Error checking email availability:', error);
      throw new Error('Failed to check email availability');
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      return await prisma.userStats.findUnique({
        where: { userId },
      });
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw new Error('Failed to get user statistics');
    }
  }

  /**
   * Search users by username
   */
  async searchByUsername(query: string, limit: number = 10): Promise<User[]> {
    try {
      return await prisma.user.findMany({
        where: {
          username: {
            contains: query,
            mode: 'insensitive',
          },
        },
        include: {
          userStats: true,
        },
        take: limit,
        orderBy: {
          reputation: 'desc',
        },
      });
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error('Failed to search users');
    }
  }

  /**
   * Get top users by reputation
   */
  async getTopUsers(limit: number = 10): Promise<User[]> {
    try {
      return await prisma.user.findMany({
        include: {
          userStats: true,
        },
        orderBy: {
          reputation: 'desc',
        },
        take: limit,
      });
    } catch (error) {
      console.error('Error getting top users:', error);
      throw new Error('Failed to get top users');
    }
  }
}