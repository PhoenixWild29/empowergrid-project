/**
 * GET /api/recommendations/for-you
 * 
 * WO-97: Get personalized project recommendations
 * Returns projects recommended based on user behavior and preferences
 * 
 * Features:
 * - Content-based filtering
 * - Collaborative filtering
 * - Personalized scoring
 * - Explanation for each recommendation
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/middleware/authMiddleware';
import { prisma } from '../../../lib/prisma';
import {
  generateRecommendationsForUser,
  saveRecommendations,
} from '../../../lib/services/recommendationService';

/**
 * GET /api/recommendations/for-you
 * 
 * Query params: ?limit=10
 * Returns: { success: boolean, recommendations: Project[], count: number }
 */
async function getPersonalizedRecommendations(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = (req as any).userId;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    // Generate recommendations
    const recommendationResults = await generateRecommendationsForUser(userId, limit);

    if (recommendationResults.length === 0) {
      // No recommendations yet - return empty with helpful message
      return res.status(200).json({
        success: true,
        recommendations: [],
        count: 0,
        message: 'No recommendations available yet. Browse and interact with projects to get personalized suggestions!',
      });
    }

    // Fetch full project details
    const projectIds = recommendationResults.map(r => r.projectId);
    const projects = await prisma.project.findMany({
      where: {
        id: { in: projectIds },
        status: { in: ['ACTIVE', 'FUNDED'] },
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

    // Merge recommendation scores with project data
    const recommendationsWithProjects = recommendationResults
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
          score: rec.score,
          reason: rec.reason,
          algorithm: rec.algorithm,
        };
      })
      .filter(Boolean);

    // Save recommendations for tracking (async, don't wait)
    saveRecommendations(userId, recommendationResults).catch(err => {
      console.error('[WO-97] Failed to save recommendations:', err);
    });

    return res.status(200).json({
      success: true,
      recommendations: recommendationsWithProjects,
      count: recommendationsWithProjects.length,
    });

  } catch (error) {
    console.error('[WO-97] Get recommendations error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate recommendations',
    });
  }
}

export default withAuth(getPersonalizedRecommendations);

