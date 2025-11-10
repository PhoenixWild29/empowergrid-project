import { NextApiRequest, NextApiResponse } from 'next';
import { withOptionalAuth, withAuth } from '../../../../lib/middleware/authMiddleware';
import { prisma } from '../../../../lib/prisma';
import { UpdateProjectSchema } from '../../../../lib/schemas/projectSchemas';
import { UserRole } from '../../../../types/auth';

/**
 * GET /api/projects/[id]
 * 
 * Get detailed project information
 * 
 * WO-67: Comprehensive data retrieval for project details dashboard
 * 
 * Features:
 * - Complete project details
 * - Funding status & progress
 * - Milestone information
 * - Energy production metrics
 * - Funder information
 * - Creator details
 * - Comments and updates
 * - Computed financial metrics
 */
async function getProject(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    // WO-67: Validate project ID format
    if (typeof id !== 'string') {
      return res.status(400).json({
        error: 'Invalid project ID',
        message: 'Project ID must be a string',
      });
    }

    if (id.length === 0) {
      return res.status(400).json({
        error: 'Invalid project ID',
        message: 'Project ID cannot be empty',
      });
    }

    // WO-67: Comprehensive data retrieval - single optimized query
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            reputation: true,
            verified: true,
            avatar: true,
            bio: true,
            website: true,
            walletAddress: true,
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
                reputation: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        updates: {
          orderBy: { createdAt: 'desc' },
          take: 10, // WO-67: More updates for dashboard
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar: true,
                reputation: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20, // WO-67: Include comments
        },
        energyMetrics: {
          orderBy: { reportedAt: 'desc' },
          take: 30, // WO-67: Last 30 days of metrics
        },
        _count: {
          select: {
            fundings: true,
            milestones: true,
            comments: true,
            updates: true,
            energyMetrics: true,
          },
        },
      },
    });

    // WO-67: Handle project not found
    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
        message: `No project exists with ID: ${id}`,
      });
    }

    // WO-67: Calculate comprehensive metrics
    const milestones = (project as any).milestones || [];
    const fundings = (project as any).fundings || [];
    const energyMetrics = (project as any).energyMetrics || [];

    const fundingProgress = project.targetAmount > 0 
      ? (project.currentAmount / project.targetAmount) * 100 
      : 0;

    const completedMilestones = milestones.filter((m: any) => m.status === 'RELEASED').length;
    const milestoneProgress = milestones.length > 0
      ? (completedMilestones / milestones.length) * 100
      : 0;

    // WO-67: Energy production totals
    const totalEnergyProduced = energyMetrics.reduce(
      (sum: number, m: any) => sum + (m.energyProduced || 0),
      0
    );

    const verifiedEnergyProduced = energyMetrics
      .filter((m: any) => m.verified)
      .reduce((sum: number, m: any) => sum + (m.energyProduced || 0), 0);

    // WO-67: Financial metrics
    const averageFundingAmount = fundings.length > 0
      ? project.currentAmount / fundings.length
      : 0;

    const fundingVelocity = calculateFundingVelocity(fundings, project.createdAt);

    // WO-67: Project timeline metrics
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(project.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    const daysUntilCompletion = project.duration - daysSinceCreation;
    const completionPercentage = Math.min((daysSinceCreation / project.duration) * 100, 100);

    const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
    const annualYield = Number(
      numberFormatter.format(5 + Math.min(fundingProgress / 12, 4))
    );
    const co2Offset = Math.round(((project.energyCapacity || 1) * 1.25 + fundingProgress / 10) * 10) / 10;
    const householdsPowered = Math.round(((project.energyCapacity || 0.75) * 320) + fundingProgress * 2);

    // WO-67: Structured response with all data
    return res.status(200).json({
      success: true,
      project: {
        // Basic information
        id: project.id,
        title: project.title,
        description: project.description,
        category: project.category,
        tags: project.tags,
        status: project.status,
        location: project.location,
        
        // Technical specifications
        energyCapacity: project.energyCapacity,
        duration: project.duration,
        milestoneCount: project.milestoneCount,
        
        // Financial information
        targetAmount: project.targetAmount,
        currentAmount: project.currentAmount,
        fundingProgress,
        annualYield,
        co2Offset,
        householdsPowered,
        
        // Blockchain information
        programId: project.programId,
        projectPDA: project.projectPDA,
        escrowAddress: project.escrowAddress,
        
        // Media
        images: project.images,
        videoUrl: project.videoUrl,
        
        // Timestamps
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        fundedAt: project.fundedAt,
        completedAt: project.completedAt,
        
        // Creator information
        creator: project.creator,
        
        // Milestones
        milestones: project.milestones,
        milestoneProgress,
        completedMilestones,
        
        // Funding data
        fundings: project.fundings,
        averageFundingAmount,
        fundingVelocity,
        
        // Comments and updates
        comments: project.comments,
        updates: project.updates,
        
        // Energy metrics
        energyMetrics: project.energyMetrics,
        totalEnergyProduced,
        verifiedEnergyProduced,
        
        // Counts
        counts: project._count,
        
        // Timeline metrics
        daysSinceCreation,
        daysUntilCompletion,
        completionPercentage,
      },
    });
  } catch (error) {
    console.error('Get project error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to load project',
    });
  }
}

/**
 * Calculate funding velocity (SOL per day)
 */
function calculateFundingVelocity(fundings: any[], createdAt: Date): number {
  if (fundings.length === 0) {
    return 0;
  }

  const firstFundingDate = new Date(
    fundings[fundings.length - 1]?.createdAt || createdAt
  );

  const daysSinceFirstFunding = Math.max(
    (Date.now() - firstFundingDate.getTime()) / (1000 * 60 * 60 * 24),
    1
  );

  const totalFunded = fundings.reduce(
    (sum, funding) => sum + (funding.amount || 0),
    0
  );

  return totalFunded / daysSinceFirstFunding;
}

/**
 * PUT /api/projects/[id]
 * 
 * Update project
 * 
 * Features:
 * - Creator can update own projects
 * - Admin can update any project
 * - Validates all updates
 */
async function updateProject(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const userId = (req as any).userId;
    const rawRole = (req as any).userRole ?? (req as any).user?.role;
    const userRole =
      typeof rawRole === 'string' ? rawRole.toLowerCase() : '';

    if (typeof id !== 'string') {
      return res.status(400).json({
        error: 'Invalid project ID',
      });
    }

    // Get existing project
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
      });
    }

    // Check authorization
    if (project.creatorId !== userId && userRole !== UserRole.ADMIN) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own projects',
      });
    }

    // Validate update data
    const validationResult = UpdateProjectSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: validationResult.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: validationResult.data,
    });

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      project: updatedProject,
    });
  } catch (error) {
    console.error('Update project error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update project',
    });
  }
}

/**
 * DELETE /api/projects/[id]
 * 
 * Delete project
 * 
 * Features:
 * - Creator can delete own projects (if not funded)
 * - Admin can delete any project
 */
async function deleteProject(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const userId = (req as any).userId;
    const rawRole = (req as any).userRole ?? (req as any).user?.role;
    const userRole =
      typeof rawRole === 'string' ? rawRole.toLowerCase() : '';

    if (typeof id !== 'string') {
      return res.status(400).json({
        error: 'Invalid project ID',
      });
    }

    // Get existing project
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        fundings: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
      });
    }

    // Check authorization
    if (project.creatorId !== userId && userRole !== UserRole.ADMIN) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own projects',
      });
    }

    // Prevent deletion if project has funding
    if (project.fundings.length > 0 && userRole !== UserRole.ADMIN) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Cannot delete project with existing funding',
      });
    }

    // Delete project
    await prisma.project.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete project',
    });
  }
}

/**
 * Main handler
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return getProject(req, res);
  } else if (req.method === 'PUT') {
    return updateProject(req, res);
  } else if (req.method === 'DELETE') {
    return deleteProject(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Apply appropriate middleware based on method
export default async function (req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return withOptionalAuth(handler)(req, res);
  } else {
    return withAuth(handler)(req, res);
  }
}

