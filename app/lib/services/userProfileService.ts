/**
 * User Profile Service
 * 
 * Business logic for user profile management
 */

import { prisma } from '../prisma';

export interface CreateProfileData {
  walletAddress: string;
  username: string;
  email?: string;
  bio?: string;
  website?: string;
  avatar?: string;
  socialLinks?: Record<string, string>;
  role?: 'GUEST' | 'FUNDER' | 'CREATOR' | 'ADMIN';
}

export interface UpdateProfileData {
  username?: string;
  email?: string;
  bio?: string;
  website?: string;
  avatar?: string;
  socialLinks?: Record<string, string>;
}

/**
 * Create user profile
 */
export async function createUserProfile(data: CreateProfileData) {
  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { walletAddress: data.walletAddress },
        { username: data.username },
        ...(data.email ? [{ email: data.email }] : []),
      ],
    },
  });

  if (existingUser) {
    throw new Error('User already exists');
  }

  // Create user
  const user = await prisma.user.create({
    data: {
      walletAddress: data.walletAddress,
      username: data.username,
      email: data.email || null,
      bio: data.bio || null,
      website: data.website || null,
      avatar: data.avatar || null,
      socialLinks: data.socialLinks as any || null,
      role: data.role || 'FUNDER',
      verified: false,
      reputation: 0,
    },
  });

  // Create user stats
  await prisma.userStats.create({
    data: {
      userId: user.id,
    },
  });

  return user;
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string, requestingUserId?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userStats: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // If requesting user is not the owner, filter sensitive data
  const isOwner = requestingUserId === userId;
  
  if (!isOwner) {
    // Return public profile only
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      reputation: user.reputation,
      verified: user.verified,
      avatar: user.avatar,
      bio: user.bio,
      website: user.website,
      createdAt: user.createdAt,
      userStats: user.userStats,
    };
  }

  // Return full profile for owner
  return {
    id: user.id,
    walletAddress: user.walletAddress,
    username: user.username,
    email: user.email,
    role: user.role,
    reputation: user.reputation,
    verified: user.verified,
    avatar: user.avatar,
    bio: user.bio,
    website: user.website,
    socialLinks: user.socialLinks,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    userStats: user.userStats,
  };
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, data: UpdateProfileData, requestingUserId: string) {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Check authorization
  if (userId !== requestingUserId) {
    throw new Error('Unauthorized to update this profile');
  }

  // Check if username is already taken (if being updated)
  if (data.username && data.username !== user.username) {
    const existingUser = await prisma.user.findFirst({
      where: {
        username: data.username,
        id: { not: userId },
      },
    });

    if (existingUser) {
      throw new Error('Username already taken');
    }
  }

  // Check if email is already taken (if being updated)
  if (data.email && data.email !== user.email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
        id: { not: userId },
      },
    });

    if (existingUser) {
      throw new Error('Email already in use');
    }
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data,
    include: {
      userStats: true,
    },
  });

  return updatedUser;
}

/**
 * Delete user profile
 */
export async function deleteUserProfile(userId: string, requestingUserId: string, requestingUserRole: string) {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Check authorization - user can delete own profile or admin can delete any
  if (userId !== requestingUserId && requestingUserRole !== 'ADMIN') {
    throw new Error('Unauthorized to delete this profile');
  }

  // Soft delete - anonymize user data
  await prisma.user.update({
    where: { id: userId },
    data: {
      username: `deleted_user_${userId.substring(0, 8)}`,
      email: null,
      bio: 'Account deleted',
      website: null,
      avatar: null,
      socialLinks: null as any,
    },
  });

  return { success: true, message: 'Profile deleted successfully' };
}

/**
 * List user profiles with pagination
 */
export async function listUserProfiles(options: {
  page?: number;
  limit?: number;
  role?: string;
  verified?: boolean;
  search?: string;
}) {
  const { page = 1, limit = 25, role, verified, search } = options;
  const skip = (page - 1) * limit;

  // Build filter
  const where: any = {};
  
  if (role) {
    where.role = role;
  }

  if (verified !== undefined) {
    where.verified = verified;
  }

  if (search) {
    where.username = {
      contains: search,
      mode: 'insensitive',
    };
  }

  // Get total count
  const total = await prisma.user.count({ where });

  // Get users
  const users = await prisma.user.findMany({
    where,
    skip,
    take: limit,
    select: {
      id: true,
      username: true,
      role: true,
      reputation: true,
      verified: true,
      avatar: true,
      bio: true,
      createdAt: true,
      userStats: {
        select: {
          projectsCreated: true,
          projectsFunded: true,
          successfulProjects: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

