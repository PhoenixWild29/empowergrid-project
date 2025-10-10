/**
 * GET /api/recommendations/similar/[projectId]
 * 
 * WO-97: Get similar projects
 * Returns projects similar to a given project
 * 
 * Features:
 * - Category matching
 * - Location matching
 * - Capacity similarity
 * - Tag overlap
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { getSimilarProjects } from '../../../../lib/services/recommendationService';

/**
 * GET /api/recommendations/similar/[projectId]
 * 
 * Query params: ?limit=5
 * Returns: { success: boolean, projects: Project[], count: number }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { projectId } = req.query;
    const limit = Math.min(parseInt(req.query.limit as string) || 5, 20);

    if (typeof projectId !== 'string') {
      return res.status(400).json({
        error: 'Invalid project ID',
      });
    }

    // Get similar projects
    const similarResults = await getSimilarProjects(projectId, limit);

    if (similarResults.length === 0) {
      return res.status(200).json({
        success: true,
        projects: [],
        count: 0,
        message: 'No similar projects found',
      });
    }

    // Fetch full project details
    const projectIds = similarResults.map(r => r.projectId);
    const projects = await prisma.project.findMany({
      where: {
        id: { in: projectIds },
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            reputation: true,
            verified: true,
          },
        },
        _count: {
          select: {
            fundings: true,
            milestones: true,
          },
        },
      },
    });

    // Merge with similarity data
    const similarProjectsWithDetails = similarResults
      .map(rec => {
        const project = projects.find(p => p.id === rec.projectId);
        if (!project) return null;

        return {
          project: {
            id: project.id,
            title: project.title,
            description: project.description,
            category: project.category,
            tags: project.tags,
            status: project.status,
            location: project.location,
            targetAmount: project.targetAmount,
            currentAmount: project.currentAmount,
            energyCapacity: project.energyCapacity,
            fundingProgress: project.targetAmount > 0
              ? (project.currentAmount / project.targetAmount) * 100
              : 0,
            creator: project.creator,
            funderCount: project._count.fundings,
            milestoneCount: project._count.milestones,
            createdAt: project.createdAt,
            images: project.images,
          },
          similarityScore: rec.score,
          similarityReason: rec.reason,
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      projects: similarProjectsWithDetails,
      count: similarProjectsWithDetails.length,
    });

  } catch (error) {
    console.error('[WO-97] Get similar projects error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch similar projects',
    });
  }
}

