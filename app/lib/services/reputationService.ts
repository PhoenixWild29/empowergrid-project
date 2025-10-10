/**
 * Reputation Service
 * 
 * Business logic for user reputation management
 */

import { prisma } from '../prisma';

/**
 * Activity types and their point values
 */
export const REPUTATION_ACTIVITIES = {
  PROJECT_CREATED: 10,
  PROJECT_COMPLETED: 25,
  PROJECT_FUNDED: 5,
  MILESTONE_COMPLETED: 15,
  COMMENT_POSTED: 1,
  PROFILE_VERIFIED: 20,
  FIRST_LOGIN: 5,
  REFERRAL_SUCCESS: 10,
  POSITIVE_REVIEW: 3,
  NEGATIVE_REVIEW: -5,
} as const;

export type ReputationActivity = keyof typeof REPUTATION_ACTIVITIES;

/**
 * Get user reputation score
 */
export async function getUserReputation(userId: string): Promise<{
  userId: string;
  username: string;
  reputation: number;
  verified: boolean;
  role: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      reputation: true,
      verified: true,
      role: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return {
    userId: user.id,
    username: user.username,
    reputation: user.reputation,
    verified: user.verified,
    role: user.role,
  };
}

/**
 * Log reputation activity
 */
export async function logReputationActivity(
  userId: string,
  activity: ReputationActivity,
  metadata?: Record<string, any>
): Promise<{
  previousReputation: number;
  pointsAwarded: number;
  newReputation: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { reputation: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const points = REPUTATION_ACTIVITIES[activity];
  const previousReputation = user.reputation;
  const newReputation = Math.max(0, previousReputation + points); // Reputation can't go below 0

  // Update user reputation
  await prisma.user.update({
    where: { id: userId },
    data: { reputation: newReputation },
  });

  // Log the activity (in production, store in activity log table)
  console.log(`Reputation activity: ${activity}`, {
    userId,
    pointsAwarded: points,
    previousReputation,
    newReputation,
    metadata,
  });

  return {
    previousReputation,
    pointsAwarded: points,
    newReputation,
  };
}

/**
 * Set user reputation (admin only)
 */
export async function setUserReputation(
  userId: string,
  reputation: number,
  adminUserId: string,
  reason?: string
): Promise<{
  previousReputation: number;
  newReputation: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { reputation: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const previousReputation = user.reputation;

  // Update reputation
  await prisma.user.update({
    where: { id: userId },
    data: { reputation },
  });

  // Log admin action
  console.log(`Admin reputation update`, {
    userId,
    adminUserId,
    previousReputation,
    newReputation: reputation,
    reason: reason || 'Manual adjustment',
  });

  return {
    previousReputation,
    newReputation: reputation,
  };
}

/**
 * Get reputation leaderboard
 */
export async function getReputationLeaderboard(limit: number = 10): Promise<Array<{
  userId: string;
  username: string;
  reputation: number;
  verified: boolean;
  role: string;
}>> {
  const users = await prisma.user.findMany({
    orderBy: {
      reputation: 'desc',
    },
    take: limit,
    select: {
      id: true,
      username: true,
      reputation: true,
      verified: true,
      role: true,
    },
  });

  return users.map(u => ({
    userId: u.id,
    username: u.username,
    reputation: u.reputation,
    verified: u.verified,
    role: u.role,
  }));
}

/**
 * Get reputation rank for user
 */
export async function getUserReputationRank(userId: string): Promise<{
  rank: number;
  totalUsers: number;
  percentile: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { reputation: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Count users with higher reputation
  const higherRanked = await prisma.user.count({
    where: {
      reputation: {
        gt: user.reputation,
      },
    },
  });

  const totalUsers = await prisma.user.count();
  const rank = higherRanked + 1;
  const percentile = ((totalUsers - rank) / totalUsers) * 100;

  return {
    rank,
    totalUsers,
    percentile: Math.round(percentile * 100) / 100,
  };
}




