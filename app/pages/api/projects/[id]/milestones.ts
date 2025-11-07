/**
 * GET /api/projects/[id]/milestones
 * 
 * WO-59: Milestone management with oracle integration
 * 
 * Features:
 * - Return milestone data with completion status
 * - Real-time progress tracking
 * - Historical performance data
 * - Projected completion timelines
 * - Oracle verification data integration
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../lib/middleware/authMiddleware';
import { prisma } from '../../../../lib/prisma';
import { getOracleData } from '../../../../lib/services/oracleService';

async function projectMilestonesHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Project ID parameter is required',
      });
    }

    console.log('[WO-59] Fetching milestones for project:', id);

    // Fetch project with milestones and escrow contract
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
          include: {
            verifications: {
              orderBy: { verificationTimestamp: 'desc' },
              take: 5, // Last 5 verification attempts
            },
          },
        },
        escrowContract: {
          select: {
            contractId: true,
            oracleAuthority: true,
            status: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Project not found',
      });
    }

    // WO-59: Fetch real-time oracle data if available
    let currentOracleData = null;
    if (project.escrowContract?.oracleAuthority) {
      currentOracleData = await getOracleData(
        project.escrowContract.oracleAuthority,
        project.id
      );
    }

    // WO-59: Enhance each milestone with progress tracking and projections
    const enhancedMilestones = await Promise.all(
      project.milestones.map(async (milestone) => {
        // Calculate progress
        const energyTarget = milestone.energyTarget || 0;
        const energyProduced = currentOracleData?.energyProduction || 0;
        const progressPercentage = energyTarget > 0 
          ? Math.min((energyProduced / energyTarget) * 100, 100)
          : 0;

        // Historical performance (from verification attempts)
        const verificationHistory = milestone.verifications.map((v: any) => ({
          id: v.id,
          status: v.status,
          energyProduced: v.energyProduced,
          timestamp: v.verificationTimestamp,
          verified: v.verified,
        }));

        // Calculate projected completion
        const daysUntilDue = Math.ceil(
          (new Date(milestone.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        const projectedCompletion = progressPercentage >= 100
          ? 'Completed'
          : progressPercentage > 50
          ? `On track (${daysUntilDue} days remaining)`
          : `At risk (${daysUntilDue} days remaining)`;

        return {
          id: milestone.id,
          title: milestone.title,
          description: milestone.description,
          order: milestone.order,
          targetAmount: milestone.targetAmount,
          energyTarget: milestone.energyTarget,
          dueDate: milestone.dueDate,
          status: milestone.status,
          
          // WO-59: Progress tracking
          progress: {
            percentage: Math.round(progressPercentage),
            energyProduced,
            energyTarget,
            meetsTarget: energyProduced >= energyTarget,
            projectedCompletion,
            daysUntilDue,
          },
          
          // WO-59: Historical performance
          history: {
            verificationAttempts: verificationHistory.length,
            lastVerification: verificationHistory[0] || null,
            performanceData: verificationHistory,
          },
          
          // WO-59: Oracle data
          oracleData: currentOracleData ? {
            energyProduction: currentOracleData.energyProduction,
            confidence: currentOracleData.confidence,
            lastUpdate: currentOracleData.lastUpdate,
            dataSource: currentOracleData.dataSource,
          } : null,
          
          // Completion info
          releasedAt: milestone.releasedAt,
          completedAt: milestone.completedAt,
        };
      })
    );

    // WO-59: Calculate overall project milestone summary
    const summary = {
      total: enhancedMilestones.length,
      completed: enhancedMilestones.filter(m => m.status === 'APPROVED').length,
      pending: enhancedMilestones.filter(m => m.status === 'PENDING').length,
      inProgress: enhancedMilestones.filter(m => m.status === 'SUBMITTED').length,
      overallProgress: enhancedMilestones.length > 0 
        ? enhancedMilestones.reduce((sum, m) => sum + m.progress.percentage, 0) / enhancedMilestones.length
        : 0,
    };

    const responseTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      milestones: enhancedMilestones,
      summary,
      oracleStatus: currentOracleData ? 'CONNECTED' : 'NO_ORACLE',
      metadata: {
        projectId: project.id,
        projectTitle: project.title,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[WO-59] Milestone fetch error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve milestones',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuth(projectMilestonesHandler);

