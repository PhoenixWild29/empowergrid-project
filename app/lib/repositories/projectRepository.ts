import { prisma } from '../prisma';
import { Project, ProjectStatus, Prisma } from '@prisma/client';

export interface CreateProjectData {
  title: string;
  description: string;
  location: string;
  category: string;
  tags: string[];
  creatorId: string;
  targetAmount: number;
  energyCapacity?: number;
  milestoneCount: number;
  duration: number;
  programId: string;
  projectPDA: string;
  escrowAddress?: string;
  images?: string[];
  videoUrl?: string;
}

export interface UpdateProjectData {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  status?: ProjectStatus;
  currentAmount?: number;
  images?: string[];
  videoUrl?: string;
  fundedAt?: Date;
  completedAt?: Date;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  category?: string;
  creatorId?: string;
  minTargetAmount?: number;
  maxTargetAmount?: number;
  tags?: string[];
  search?: string;
}

export class ProjectRepository {
  /**
   * Find project by ID
   */
  async findById(id: string): Promise<Project | null> {
    try {
      return await prisma.project.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
              reputation: true,
              verified: true,
            },
          },
          milestones: {
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              fundings: true,
              comments: true,
              updates: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error finding project by ID:', error);
      throw new Error('Failed to find project');
    }
  }

  /**
   * Find project by PDA
   */
  async findByPDA(projectPDA: string): Promise<Project | null> {
    try {
      return await prisma.project.findUnique({
        where: { projectPDA },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
              reputation: true,
              verified: true,
            },
          },
          milestones: {
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              fundings: true,
              comments: true,
              updates: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error finding project by PDA:', error);
      throw new Error('Failed to find project');
    }
  }

  /**
   * Create a new project
   */
  async create(projectData: CreateProjectData): Promise<Project> {
    try {
      return await prisma.project.create({
        data: projectData,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
              reputation: true,
              verified: true,
            },
          },
          milestones: true,
        },
      });
    } catch (error) {
      console.error('Error creating project:', error);
      throw new Error('Failed to create project');
    }
  }

  /**
   * Update project
   */
  async update(id: string, updateData: UpdateProjectData): Promise<Project> {
    try {
      return await prisma.project.update({
        where: { id },
        data: updateData,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
              reputation: true,
              verified: true,
            },
          },
          milestones: {
            orderBy: { order: 'asc' },
          },
        },
      });
    } catch (error) {
      console.error('Error updating project:', error);
      throw new Error('Failed to update project');
    }
  }

  /**
   * Delete project
   */
  async delete(id: string): Promise<void> {
    try {
      await prisma.project.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      throw new Error('Failed to delete project');
    }
  }

  /**
   * Get projects with filters and pagination
   */
  async findMany(
    filters: ProjectFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ projects: Project[]; total: number }> {
    try {
      const where: Prisma.ProjectWhereInput = {};

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.category) {
        where.category = filters.category;
      }

      if (filters.creatorId) {
        where.creatorId = filters.creatorId;
      }

      if (
        filters.minTargetAmount !== undefined ||
        filters.maxTargetAmount !== undefined
      ) {
        where.targetAmount = {};
        if (filters.minTargetAmount !== undefined) {
          where.targetAmount.gte = filters.minTargetAmount;
        }
        if (filters.maxTargetAmount !== undefined) {
          where.targetAmount.lte = filters.maxTargetAmount;
        }
      }

      if (filters.tags && filters.tags.length > 0) {
        where.tags = {
          hasSome: filters.tags,
        };
      }

      if (filters.search) {
        where.OR = [
          {
            title: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
          {
            creator: {
              username: {
                contains: filters.search,
                mode: 'insensitive',
              },
            },
          },
        ];
      }

      const [projects, total] = await Promise.all([
        prisma.project.findMany({
          where,
          include: {
            creator: {
              select: {
                id: true,
                username: true,
                walletAddress: true,
                reputation: true,
                verified: true,
              },
            },
            _count: {
              select: {
                fundings: true,
                comments: true,
                updates: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.project.count({ where }),
      ]);

      return { projects, total };
    } catch (error) {
      console.error('Error finding projects:', error);
      throw new Error('Failed to find projects');
    }
  }

  /**
   * Get projects by creator
   */
  async findByCreator(
    creatorId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ projects: Project[]; total: number }> {
    return this.findMany({ creatorId }, page, limit);
  }

  /**
   * Get trending projects (most funded recently)
   */
  async getTrending(limit: number = 10): Promise<Project[]> {
    try {
      return await prisma.project.findMany({
        where: {
          status: {
            in: [ProjectStatus.ACTIVE, ProjectStatus.FUNDED],
          },
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
              reputation: true,
              verified: true,
            },
          },
          _count: {
            select: {
              fundings: true,
            },
          },
        },
        orderBy: {
          currentAmount: 'desc',
        },
        take: limit,
      });
    } catch (error) {
      console.error('Error getting trending projects:', error);
      throw new Error('Failed to get trending projects');
    }
  }

  /**
   * Get recently funded projects
   */
  async getRecentlyFunded(limit: number = 10): Promise<Project[]> {
    try {
      return await prisma.project.findMany({
        where: {
          fundedAt: {
            not: null,
          },
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
              reputation: true,
              verified: true,
            },
          },
        },
        orderBy: {
          fundedAt: 'desc',
        },
        take: limit,
      });
    } catch (error) {
      console.error('Error getting recently funded projects:', error);
      throw new Error('Failed to get recently funded projects');
    }
  }

  /**
   * Update project funding amount
   */
  async updateFundingAmount(
    id: string,
    additionalAmount: number
  ): Promise<Project> {
    try {
      const project = await prisma.project.findUnique({
        where: { id },
        select: {
          currentAmount: true,
          targetAmount: true,
          status: true,
          fundedAt: true,
        },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      const newAmount = project.currentAmount + additionalAmount;
      const shouldBeFunded = newAmount >= project.targetAmount;
      const newStatus =
        shouldBeFunded && project.status === ProjectStatus.ACTIVE
          ? ProjectStatus.FUNDED
          : project.status;

      return await prisma.project.update({
        where: { id },
        data: {
          currentAmount: newAmount,
          status: newStatus,
          ...(shouldBeFunded && !project.fundedAt && { fundedAt: new Date() }),
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
              reputation: true,
              verified: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error updating funding amount:', error);
      throw new Error('Failed to update funding amount');
    }
  }

  /**
   * Get project statistics
   */
  async getStats(): Promise<{
    totalProjects: number;
    activeProjects: number;
    fundedProjects: number;
    completedProjects: number;
    totalFunding: number;
  }> {
    try {
      const [
        totalProjects,
        activeProjects,
        fundedProjects,
        completedProjects,
        totalFundingResult,
      ] = await Promise.all([
        prisma.project.count(),
        prisma.project.count({ where: { status: ProjectStatus.ACTIVE } }),
        prisma.project.count({ where: { status: ProjectStatus.FUNDED } }),
        prisma.project.count({ where: { status: ProjectStatus.COMPLETED } }),
        prisma.project.aggregate({
          _sum: {
            currentAmount: true,
          },
        }),
      ]);

      return {
        totalProjects,
        activeProjects,
        fundedProjects,
        completedProjects,
        totalFunding: totalFundingResult._sum.currentAmount || 0,
      };
    } catch (error) {
      console.error('Error getting project stats:', error);
      throw new Error('Failed to get project statistics');
    }
  }
}
