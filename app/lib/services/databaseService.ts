import { UserRepository } from '../repositories/userRepository';
import { ProjectRepository } from '../repositories/projectRepository';
import { UserProfile } from '../../types/auth';
import { User, UserStats, UserRole as PrismaUserRole } from '@prisma/client';
import { UserRole } from '../../types/auth';
import { PublicKey } from '@solana/web3.js';

export class DatabaseService {
  private userRepository: UserRepository;
  private projectRepository: ProjectRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.projectRepository = new ProjectRepository();
  }

  // User-related methods
  async getUserByWallet(walletAddress: string): Promise<User | null> {
    return this.userRepository.findByWalletAddress(walletAddress);
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async createUser(
    walletAddress: string,
    username?: string,
    role: UserRole = UserRole.FUNDER
  ): Promise<User> {
    // Generate a default username if not provided
    const defaultUsername = username || `user_${walletAddress.slice(0, 8)}`;

    return this.userRepository.create({
      walletAddress,
      username: defaultUsername,
      role: role as unknown as PrismaUserRole,
    });
  }

  async updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<User> {
    return this.userRepository.update(userId, {
      username: updates.username,
      email: updates.email,
      bio: updates.bio,
      website: updates.website,
      avatar: updates.avatar,
    });
  }

  async isUsernameAvailable(
    username: string,
    excludeUserId?: string
  ): Promise<boolean> {
    return this.userRepository.isUsernameAvailable(username, excludeUserId);
  }

  async isEmailAvailable(
    email: string,
    excludeUserId?: string
  ): Promise<boolean> {
    return this.userRepository.isEmailAvailable(email, excludeUserId);
  }

  // Project-related methods
  async getProjectById(id: string) {
    return this.projectRepository.findById(id);
  }

  async getProjectByPDA(projectPDA: string) {
    return this.projectRepository.findByPDA(projectPDA);
  }

  async createProject(projectData: {
    title: string;
    description: string;
    category: string;
    tags: string[];
    creatorId: string;
    targetAmount: number;
    milestoneCount: number;
    duration: number;
    programId: string;
    projectPDA: string;
    images?: string[];
    videoUrl?: string;
  }) {
    return this.projectRepository.create(projectData);
  }

  async updateProject(id: string, updates: any) {
    return this.projectRepository.update(id, updates);
  }

  async getProjects(filters: any = {}, page: number = 1, limit: number = 10) {
    return this.projectRepository.findMany(filters, page, limit);
  }

  async getTrendingProjects(limit: number = 10) {
    return this.projectRepository.getTrending(limit);
  }

  async getRecentlyFundedProjects(limit: number = 10) {
    return this.projectRepository.getRecentlyFunded(limit);
  }

  async updateProjectFunding(projectId: string, amount: number) {
    return this.projectRepository.updateFundingAmount(projectId, amount);
  }

  async getProjectStats() {
    return this.projectRepository.getStats();
  }

  // User statistics methods
  async updateUserStats(
    userId: string,
    stats: {
      projectsCreated?: number;
      projectsFunded?: number;
      totalFunded?: number;
      successfulProjects?: number;
      totalEarnings?: number;
    }
  ) {
    return this.userRepository.updateStats(userId, stats);
  }

  async getUserStats(userId: string) {
    return this.userRepository.getUserStats(userId);
  }

  // Search methods
  async searchUsers(query: string, limit: number = 10) {
    return this.userRepository.searchByUsername(query, limit);
  }

  async getTopUsers(limit: number = 10) {
    return this.userRepository.getTopUsers(limit);
  }

  // Utility methods
  async ensureUserExists(
    walletAddress: string,
    username?: string
  ): Promise<User> {
    let user = await this.getUserByWallet(walletAddress);

    if (!user) {
      user = await this.createUser(walletAddress, username);
    }

    return user;
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const user = await this.userRepository.findByIdWithStats(userId);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      walletAddress: new PublicKey(user.walletAddress),
      username: user.username,
      role: user.role as UserRole,
      reputation: user.reputation,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      verified: user.verified,
      stats: user.userStats
        ? {
            projectsCreated: user.userStats.projectsCreated,
            projectsFunded: user.userStats.projectsFunded,
            totalFunded: user.userStats.totalFunded,
            successfulProjects: user.userStats.successfulProjects,
          }
        : {
            projectsCreated: 0,
            projectsFunded: 0,
            totalFunded: 0,
            successfulProjects: 0,
          },
    };
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
