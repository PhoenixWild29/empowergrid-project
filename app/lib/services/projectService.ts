/**
 * Project Service
 * 
 * Business logic for project management
 */

import { prisma } from '../prisma';

export interface CreateProjectData {
  title: string;
  description: string;
  location: string;
  category: string;
  tags: string[];
  targetAmount: number;
  energyCapacity?: number;
  milestoneCount?: number;
  duration?: number;
  escrowAddress?: string;
  images?: string[];
  videoUrl?: string;
  creatorId: string;
}

/**
 * Create new project
 */
export async function createProject(data: CreateProjectData) {
  // Generate blockchain identifiers
  const programId = process.env.NEXT_PUBLIC_PROGRAM_ID || '11111111111111111111111111111111';
  const projectPDA = `project_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Create project in database
  const project = await prisma.project.create({
    data: {
      title: data.title,
      description: data.description,
      location: data.location,
      category: data.category,
      tags: data.tags,
      targetAmount: data.targetAmount,
      energyCapacity: data.energyCapacity,
      milestoneCount: data.milestoneCount || 1,
      duration: data.duration || 90,
      creatorId: data.creatorId,
      programId,
      projectPDA,
      escrowAddress: data.escrowAddress,
      images: data.images || [],
      videoUrl: data.videoUrl,
      status: 'DRAFT',
    },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          reputation: true,
        },
      },
    },
  });

  return project;
}

/**
 * Get project by ID with full details
 */
export async function getProjectById(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          reputation: true,
          verified: true,
          avatar: true,
        },
      },
      milestones: {
        orderBy: { order: 'asc' },
      },
      fundings: {
        include: {
          funder: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      updates: {
        orderBy: { createdAt: 'desc' },
      },
      comments: {
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  return project;
}

/**
 * Update project
 */
export async function updateProject(projectId: string, userId: string, updates: any) {
  // Verify project exists and user has permission
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  if (project.creatorId !== userId) {
    throw new Error('Unauthorized to update this project');
  }

  // Update project
  return prisma.project.update({
    where: { id: projectId },
    data: updates,
  });
}

/**
 * Delete project
 */
export async function deleteProject(projectId: string, userId: string, isAdmin: boolean = false) {
  // Verify project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      fundings: true,
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  // Check authorization
  if (project.creatorId !== userId && !isAdmin) {
    throw new Error('Unauthorized to delete this project');
  }

  // Prevent deletion if funded (unless admin)
  if (project.fundings.length > 0 && !isAdmin) {
    throw new Error('Cannot delete project with existing funding');
  }

  // Delete project
  return prisma.project.delete({
    where: { id: projectId },
  });
}

/**
 * Get projects by creator
 */
export async function getProjectsByCreator(creatorId: string) {
  return prisma.project.findMany({
    where: { creatorId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          fundings: true,
          milestones: true,
        },
      },
    },
  });
}

/**
 * Get projects by status
 */
export async function getProjectsByStatus(status: string) {
  return prisma.project.findMany({
    where: { status: status as any },
    orderBy: { createdAt: 'desc' },
    include: {
      creator: {
        select: {
          username: true,
          reputation: true,
        },
      },
    },
  });
}

