/**
 * User Profile Repository
 * 
 * Database access layer for user profiles
 */

import { prisma } from '../prisma';
import { User, UserStats } from '@prisma/client';

export type UserWithStats = User & {
  userStats: UserStats | null;
};

/**
 * Find user by ID
 */
export async function findUserById(userId: string): Promise<UserWithStats | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      userStats: true,
    },
  });
}

/**
 * Find user by wallet address
 */
export async function findUserByWalletAddress(walletAddress: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { walletAddress },
  });
}

/**
 * Find user by username
 */
export async function findUserByUsername(username: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { username },
  });
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
  });
}

/**
 * Create user
 */
export async function createUser(data: {
  walletAddress: string;
  username: string;
  email?: string;
  role?: string;
}): Promise<User> {
  return prisma.user.create({
    data: {
      walletAddress: data.walletAddress,
      username: data.username,
      email: data.email || null,
      role: (data.role as any) || 'FUNDER',
      verified: false,
      reputation: 0,
    },
  });
}

/**
 * Update user
 */
export async function updateUser(userId: string, data: any): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
}

/**
 * Delete user
 */
export async function deleteUser(userId: string): Promise<User> {
  return prisma.user.delete({
    where: { id: userId },
  });
}

/**
 * Search users
 */
export async function searchUsers(
  searchTerm: string,
  options: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<User[]> {
  const { limit = 10, offset = 0 } = options;

  return prisma.user.findMany({
    where: {
      OR: [
        {
          username: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
      ],
    },
    take: limit,
    skip: offset,
  });
}

/**
 * Get users by role
 */
export async function getUsersByRole(role: string): Promise<User[]> {
  return prisma.user.findMany({
    where: { role: role as any },
  });
}

/**
 * Get user count
 */
export async function getUserCount(): Promise<number> {
  return prisma.user.count();
}

