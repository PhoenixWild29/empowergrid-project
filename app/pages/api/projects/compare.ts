/**
 * POST /api/projects/compare
 * 
 * WO-82: Project Comparison Tool API
 * Fetch multiple projects by ID for side-by-side comparison
 * 
 * Features:
 * - Bulk fetch up to 5 projects
 * - Returns complete project details
 * - Optimized single query
 * - Includes computed metrics
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { withOptionalAuth } from '../../../lib/middleware/authMiddleware';

/**
 * Request schema
 */
const CompareProjectsSchema = z.object({
  projectIds: z.array(z.string())
    .min(1, 'At least one project ID required')
    .max(5, 'Maximum 5 projects can be compared at once'),
});

/**
 * POST /api/projects/compare
 * 
 * Body: { projectIds: string[] }
 * Returns: { success: boolean, projects: Project[], count: number }
 */
async function compareProjects(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request body
    const validation = CompareProjectsSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const { projectIds } = validation.data;

    // Fetch all projects in a single optimized query
    const projects = await prisma.project.findMany({
      where: {
        id: {
          in: projectIds,
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
            avatar: true,
          },
        },
        milestones: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            targetAmount: true,
            energyTarget: true,
            dueDate: true,
            status: true,
            completedAt: true,
          },
        },
        _count: {
          select: {
            fundings: true,
            milestones: true,
            comments: true,
            updates: true,
          },
        },
      },
    });

    // Transform to comparison format with computed metrics
    const comparisonProjects = projects.map(p => {
      const fundingProgress = p.targetAmount > 0 
        ? (p.currentAmount / p.targetAmount) * 100 
        : 0;

      const completedMilestones = p.milestones.filter(m => m.status === 'RELEASED').length;
      const milestoneProgress = p.milestones.length > 0
        ? (completedMilestones / p.milestones.length) * 100
        : 0;

      return {
        id: p.id,
        title: p.title,
        description: p.description,
        category: p.category,
        tags: p.tags,
        status: p.status,
        location: p.location,
        
        // Funding metrics
        targetAmount: p.targetAmount,
        currentAmount: p.currentAmount,
        fundingProgress,
        
        // Energy metrics
        energyCapacity: p.energyCapacity,
        
        // Project details
        duration: p.duration,
        programId: p.programId,
        projectPDA: p.projectPDA,
        
        // Media
        images: p.images,
        videoUrl: p.videoUrl,
        
        // Timestamps
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        fundedAt: p.fundedAt,
        completedAt: p.completedAt,
        
        // Creator information
        creator: p.creator,
        creatorId: p.creatorId,
        
        // Milestones
        milestones: p.milestones,
        milestoneProgress,
        completedMilestones,
        
        // Counts
        funderCount: p._count.fundings,
        milestoneCount: p._count.milestones,
        commentCount: p._count.comments,
        updateCount: p._count.updates,
      };
    });

    // Sort to match requested order
    const orderedProjects = projectIds.map(id => 
      comparisonProjects.find(p => p.id === id)
    ).filter(Boolean); // Remove any not found

    return res.status(200).json({
      success: true,
      projects: orderedProjects,
      count: orderedProjects.length,
      requested: projectIds.length,
      notFound: projectIds.length - orderedProjects.length,
    });

  } catch (error) {
    console.error('[WO-82] Compare projects error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch projects for comparison',
    });
  }
}

export default withOptionalAuth(compareProjects);

