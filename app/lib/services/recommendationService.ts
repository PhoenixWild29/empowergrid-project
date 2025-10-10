/**
 * Recommendation Service
 * 
 * WO-97: Personalized Project Recommendation System
 * Generates personalized project recommendations based on user behavior
 * 
 * Features:
 * - Content-based filtering
 * - Collaborative filtering (simple version)
 * - Trending projects
 * - Similar projects
 */

import { prisma } from '../prisma';

export interface RecommendationResult {
  projectId: string;
  score: number;
  reason: string;
  algorithm: string;
}

/**
 * Generate personalized recommendations for a user
 * Combines multiple recommendation strategies
 */
export async function generateRecommendationsForUser(
  userId: string,
  limit: number = 10
): Promise<RecommendationResult[]> {
  try {
    // Get user preferences
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    // Get user behavior history
    const behaviors = await prisma.userBehavior.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        project: {
          select: {
            id: true,
            category: true,
            location: true,
            energyCapacity: true,
            targetAmount: true,
            status: true,
          },
        },
      },
    });

    // Get projects user has already interacted with
    const interactedProjectIds = new Set(behaviors.map(b => b.projectId));

    // Generate recommendations using multiple strategies
    const contentBased = await getContentBasedRecommendations(userId, preferences, behaviors, limit);
    const collaborative = await getCollaborativeRecommendations(userId, behaviors, limit);
    const trending = await getTrendingProjects(limit);

    // Combine and deduplicate recommendations
    const allRecommendations = [...contentBased, ...collaborative, ...trending];
    
    // Filter out already interacted projects
    const filteredRecommendations = allRecommendations.filter(
      rec => !interactedProjectIds.has(rec.projectId)
    );

    // Deduplicate and sort by score
    const uniqueRecommendations = deduplicateRecommendations(filteredRecommendations);
    
    // Return top N recommendations
    return uniqueRecommendations.slice(0, limit);
  } catch (error) {
    console.error('[WO-97] Generate recommendations error:', error);
    throw error;
  }
}

/**
 * Content-based recommendations
 * Recommends projects similar to what the user has liked
 */
async function getContentBasedRecommendations(
  userId: string,
  preferences: any,
  behaviors: any[],
  limit: number
): Promise<RecommendationResult[]> {
  try {
    // Extract patterns from positive behaviors (funded, bookmarked)
    const positiveBehaviors = behaviors.filter(
      b => b.actionType === 'funded' || b.actionType === 'bookmarked'
    );

    if (positiveBehaviors.length === 0 && !preferences) {
      return [];
    }

    // Build query based on preferences
    const where: any = {
      status: { in: ['ACTIVE', 'FUNDED'] },
    };

    if (preferences) {
      const orConditions: any[] = [];

      if (preferences.preferredCategories.length > 0) {
        orConditions.push({
          category: { in: preferences.preferredCategories },
        });
      }

      if (preferences.preferredLocations.length > 0) {
        orConditions.push({
          location: { in: preferences.preferredLocations },
        });
      }

      if (preferences.minCapacity || preferences.maxCapacity) {
        orConditions.push({
          energyCapacity: {
            gte: preferences.minCapacity || 0,
            lte: preferences.maxCapacity || 10000,
          },
        });
      }

      if (orConditions.length > 0) {
        where.OR = orConditions;
      }
    }

    // Find matching projects
    const projects = await prisma.project.findMany({
      where,
      take: limit * 2,
      orderBy: [
        { currentAmount: 'desc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        title: true,
        category: true,
        location: true,
        energyCapacity: true,
        targetAmount: true,
        currentAmount: true,
        status: true,
      },
    });

    return projects.map((project, index) => ({
      projectId: project.id,
      score: 80 - (index * 2), // Decreasing scores
      reason: 'Matches your interests and preferences',
      algorithm: 'content',
    }));
  } catch (error) {
    console.error('[WO-97] Content-based recommendations error:', error);
    return [];
  }
}

/**
 * Collaborative filtering recommendations
 * Recommends projects that similar users have liked
 */
async function getCollaborativeRecommendations(
  userId: string,
  userBehaviors: any[],
  limit: number
): Promise<RecommendationResult[]> {
  try {
    // Get projects user has interacted with
    const userProjectIds = userBehaviors.map(b => b.projectId);

    if (userProjectIds.length === 0) {
      return [];
    }

    // Find other users who interacted with the same projects
    const similarUsers = await prisma.userBehavior.groupBy({
      by: ['userId'],
      where: {
        projectId: { in: userProjectIds },
        userId: { not: userId },
        actionType: { in: ['funded', 'bookmarked'] },
      },
      _count: {
        projectId: true,
      },
      orderBy: {
        _count: {
          projectId: 'desc',
        },
      },
      take: 20,
    });

    if (similarUsers.length === 0) {
      return [];
    }

    const similarUserIds = similarUsers.map(u => u.userId);

    // Find projects these similar users have interacted with
    const recommendations = await prisma.userBehavior.groupBy({
      by: ['projectId'],
      where: {
        userId: { in: similarUserIds },
        projectId: { notIn: userProjectIds },
        actionType: { in: ['funded', 'bookmarked'] },
      },
      _count: {
        userId: true,
      },
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
      take: limit,
    });

    // Verify projects exist and are active
    const projectIds = recommendations.map(r => r.projectId);
    const projects = await prisma.project.findMany({
      where: {
        id: { in: projectIds },
        status: { in: ['ACTIVE', 'FUNDED'] },
      },
      select: { id: true },
    });

    const validProjectIds = new Set(projects.map(p => p.id));

    return recommendations
      .filter(rec => validProjectIds.has(rec.projectId))
      .map((rec, index) => ({
        projectId: rec.projectId,
        score: 75 - (index * 3),
        reason: `Popular with ${rec._count.userId} similar investors`,
        algorithm: 'collaborative',
      }));
  } catch (error) {
    console.error('[WO-97] Collaborative recommendations error:', error);
    return [];
  }
}

/**
 * Get trending projects based on recent activity
 */
export async function getTrendingProjects(limit: number = 10): Promise<RecommendationResult[]> {
  try {
    // Get projects with most recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendingProjects = await prisma.project.findMany({
      where: {
        status: { in: ['ACTIVE', 'FUNDED'] },
        updatedAt: { gte: sevenDaysAgo },
      },
      orderBy: [
        { currentAmount: 'desc' },
        { updatedAt: 'desc' },
      ],
      take: limit,
      select: {
        id: true,
        currentAmount: true,
        targetAmount: true,
        _count: {
          select: {
            fundings: true,
          },
        },
      },
    });

    return trendingProjects.map((project, index) => {
      const fundingProgress = project.targetAmount > 0
        ? (project.currentAmount / project.targetAmount) * 100
        : 0;

      return {
        projectId: project.id,
        score: 70 - (index * 2),
        reason: `Trending: ${project._count.fundings} recent fundings, ${fundingProgress.toFixed(0)}% funded`,
        algorithm: 'trending',
      };
    });
  } catch (error) {
    console.error('[WO-97] Trending projects error:', error);
    return [];
  }
}

/**
 * Get similar projects based on project attributes
 */
export async function getSimilarProjects(
  projectId: string,
  limit: number = 5
): Promise<RecommendationResult[]> {
  try {
    // Get the source project
    const sourceProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        category: true,
        location: true,
        energyCapacity: true,
        targetAmount: true,
        tags: true,
      },
    });

    if (!sourceProject) {
      return [];
    }

    // Find similar projects
    const similarProjects = await prisma.project.findMany({
      where: {
        id: { not: projectId },
        status: { in: ['ACTIVE', 'FUNDED'] },
        OR: [
          { category: sourceProject.category },
          { location: sourceProject.location },
          { tags: { hasSome: sourceProject.tags } },
        ],
      },
      take: limit * 2,
      select: {
        id: true,
        category: true,
        location: true,
        energyCapacity: true,
        targetAmount: true,
        tags: true,
      },
    });

    // Calculate similarity scores
    const scoredProjects = similarProjects.map(project => {
      let score = 50;

      // Category match (30 points)
      if (project.category === sourceProject.category) {
        score += 30;
      }

      // Location match (20 points)
      if (project.location === sourceProject.location) {
        score += 20;
      }

      // Capacity similarity (15 points)
      if (project.energyCapacity && sourceProject.energyCapacity) {
        const capacityRatio = Math.min(
          project.energyCapacity / sourceProject.energyCapacity,
          sourceProject.energyCapacity / project.energyCapacity
        );
        score += capacityRatio * 15;
      }

      // Funding similarity (10 points)
      const fundingRatio = Math.min(
        project.targetAmount / sourceProject.targetAmount,
        sourceProject.targetAmount / project.targetAmount
      );
      score += fundingRatio * 10;

      // Tag overlap (15 points)
      const commonTags = project.tags.filter(tag => 
        sourceProject.tags.includes(tag)
      );
      score += (commonTags.length / Math.max(project.tags.length, sourceProject.tags.length || 1)) * 15;

      return {
        projectId: project.id,
        score: Math.min(score, 100),
        reason: getSimilarityReason(project, sourceProject),
        algorithm: 'similar',
      };
    });

    // Sort by score and return top N
    return scoredProjects
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error('[WO-97] Similar projects error:', error);
    return [];
  }
}

/**
 * Generate human-readable similarity reason
 */
function getSimilarityReason(project: any, sourceProject: any): string {
  const reasons: string[] = [];

  if (project.category === sourceProject.category) {
    reasons.push(`same category (${project.category})`);
  }

  if (project.location === sourceProject.location) {
    reasons.push('same location');
  }

  if (project.energyCapacity && sourceProject.energyCapacity) {
    const ratio = project.energyCapacity / sourceProject.energyCapacity;
    if (ratio >= 0.8 && ratio <= 1.2) {
      reasons.push('similar capacity');
    }
  }

  return reasons.length > 0
    ? `Similar project: ${reasons.join(', ')}`
    : 'Similar project based on multiple factors';
}

/**
 * Deduplicate and merge recommendations
 */
function deduplicateRecommendations(
  recommendations: RecommendationResult[]
): RecommendationResult[] {
  const map = new Map<string, RecommendationResult>();

  for (const rec of recommendations) {
    const existing = map.get(rec.projectId);
    
    if (!existing || rec.score > existing.score) {
      map.set(rec.projectId, rec);
    }
  }

  return Array.from(map.values()).sort((a, b) => b.score - a.score);
}

/**
 * Save recommendations to database for tracking
 */
export async function saveRecommendations(
  userId: string,
  recommendations: RecommendationResult[],
  expiresInDays: number = 7
): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    await prisma.recommendation.createMany({
      data: recommendations.map(rec => ({
        userId,
        projectId: rec.projectId,
        score: rec.score,
        reason: rec.reason,
        algorithm: rec.algorithm,
        expiresAt,
      })),
      skipDuplicates: true,
    });
  } catch (error) {
    console.error('[WO-97] Save recommendations error:', error);
    // Don't throw - saving is best-effort
  }
}

/**
 * Clean up expired recommendations
 */
export async function cleanupExpiredRecommendations(): Promise<number> {
  try {
    const result = await prisma.recommendation.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return result.count;
  } catch (error) {
    console.error('[WO-97] Cleanup recommendations error:', error);
    return 0;
  }
}

