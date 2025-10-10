/**
 * GET /api/recommendations/trending
 * 
 * WO-97: Get trending projects
 * Returns projects with recent momentum and community activity
 * 
 * Features:
 * - Based on recent funding activity
 * - Recent updates and engagement
 * - No authentication required (public)
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { getTrendingProjects } from '../../../lib/services/recommendationService';

/**
 * GET /api/recommendations/trending
 * 
 * Query params: ?limit=10&days=7
 * Returns: { success: boolean, projects: Project[], count: number }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const days = Math.min(parseInt(req.query.days as string) || 7, 30);

    // Calculate date threshold
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    // Get trending projects based on recent activity
    const trendingProjects = await prisma.project.findMany({
      where: {
        status: { in: ['ACTIVE', 'FUNDED'] },
        updatedAt: { gte: dateThreshold },
      },
      orderBy: [
        { currentAmount: 'desc' },
        { updatedAt: 'desc' },
      ],
      take: limit,
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
            comments: true,
          },
        },
      },
    });

    // Format response
    const formattedProjects = trendingProjects.map(project => ({
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
      commentCount: project._count.comments,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      images: project.images,
      
      // Trending metrics
      trendingScore: calculateTrendingScore(project),
      trendingReason: getTrendingReason(project, days),
    }));

    return res.status(200).json({
      success: true,
      projects: formattedProjects,
      count: formattedProjects.length,
      period: `Last ${days} days`,
    });

  } catch (error) {
    console.error('[WO-97] Get trending projects error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch trending projects',
    });
  }
}

/**
 * Calculate trending score
 */
function calculateTrendingScore(project: any): number {
  let score = 50;

  // Recent funding activity (30 points)
  const fundingScore = Math.min(project._count.fundings * 2, 30);
  score += fundingScore;

  // Funding progress (20 points)
  const progressScore = Math.min((project.currentAmount / project.targetAmount) * 20, 20);
  score += progressScore;

  // Community engagement (20 points)
  const engagementScore = Math.min((project._count.comments + project._count.fundings) * 0.5, 20);
  score += engagementScore;

  // Recency bonus (10 points)
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(project.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const recencyScore = Math.max(10 - daysSinceUpdate, 0);
  score += recencyScore;

  return Math.min(score, 100);
}

/**
 * Get human-readable trending reason
 */
function getTrendingReason(project: any, days: number): string {
  const reasons: string[] = [];

  if (project._count.fundings > 0) {
    reasons.push(`${project._count.fundings} recent ${project._count.fundings === 1 ? 'funder' : 'funders'}`);
  }

  const fundingProgress = (project.currentAmount / project.targetAmount) * 100;
  if (fundingProgress > 75) {
    reasons.push(`${fundingProgress.toFixed(0)}% funded`);
  }

  if (project._count.comments > 5) {
    reasons.push(`${project._count.comments} comments`);
  }

  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(project.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceUpdate === 0) {
    reasons.push('updated today');
  } else if (daysSinceUpdate === 1) {
    reasons.push('updated yesterday');
  }

  return reasons.length > 0
    ? `Trending: ${reasons.join(', ')}`
    : `Active in the last ${days} days`;
}

