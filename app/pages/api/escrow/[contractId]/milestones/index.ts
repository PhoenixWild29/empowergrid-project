/**
 * GET /api/escrow/[contractId]/milestones
 * 
 * WO-88: Retrieve milestone data with oracle integration
 * 
 * Features:
 * - Milestone completion status
 * - Verification requirements
 * - Fund allocation details
 * - Real-time oracle data
 * - Historical progress analysis
 * - Audit trail
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';
import { withOptionalAuth } from '../../../../../lib/middleware/authMiddleware';
import { getOracleData } from '../../../../../lib/services/oracleService';

async function getMilestones(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const { contractId } = req.query;
    const userId = (req as any).userId;

    if (!contractId || typeof contractId !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'contractId parameter is required',
      });
    }

    console.log('[WO-88] Fetching milestones for contract:', contractId);

    // Fetch escrow contract with project milestones
    const contract = await prisma.escrowContract.findUnique({
      where: { contractId },
      include: {
        project: {
          include: {
            creator: {
              select: { id: true, username: true, walletAddress: true },
            },
            milestones: {
              orderBy: { order: 'asc' },
              include: {
                releasedBy: {
                  select: { id: true, username: true, walletAddress: true },
                },
              },
            },
            energyMetrics: {
              orderBy: { reportedAt: 'desc' },
              take: 30, // Last 30 days
            },
          },
        },
      },
    });

    if (!contract) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Escrow contract not found',
      });
    }

    const project = contract.project;
    const isCreator = userId === project.creatorId;

    // WO-88: Fetch real-time oracle data
    let oracleData = null;
    if (contract.oracleAuthority) {
      try {
        oracleData = await getOracleData(contract.oracleAuthority, project.id);
      } catch (oracleError) {
        console.error('[WO-88] Oracle data fetch failed:', oracleError);
      }
    }

    // WO-88: Calculate energy production metrics
    const energyMetrics = project.energyMetrics;
    const totalEnergyProduced = energyMetrics.reduce((sum: number, m) => sum + m.energyProduced, 0);
    const verifiedEnergy = energyMetrics.filter(m => m.verified).reduce((sum: number, m) => sum + m.energyProduced, 0);
    const averageDailyProduction = energyMetrics.length > 0 
      ? totalEnergyProduced / energyMetrics.length 
      : 0;

    // WO-88: Process milestones with verification data
    const milestonesWithVerification = project.milestones.map((milestone) => {
      // Calculate verification progress
      const energyTarget = milestone.targetAmount * 1000; // Simplified: $1 = 1 kW target
      const energyProgress = oracleData?.energyProduction || totalEnergyProduced;
      const energyPercentComplete = (energyProgress / energyTarget) * 100;

      // Determine verification status
      const verificationStatus = calculateVerificationStatus(
        milestone.status,
        energyPercentComplete,
        milestone.submittedAt,
        milestone.releasedAt
      );

      // Automated release conditions
      const releaseConditions = {
        energyTargetMet: energyPercentComplete >= 100,
        timeElapsed: milestone.submittedAt 
          ? (Date.now() - new Date(milestone.submittedAt).getTime()) / (1000 * 60 * 60 * 24) >= 7 // 7 days
          : false,
        oracleConfidence: oracleData?.confidence || 0,
        manualApproval: milestone.status === 'RELEASED',
      };

      const eligibleForRelease = releaseConditions.energyTargetMet && 
                                 releaseConditions.oracleConfidence >= 0.8 &&
                                 milestone.status !== 'RELEASED';

      return {
        id: milestone.id,
        title: milestone.title,
        description: milestone.description,
        order: milestone.order,
        status: milestone.status,
        
        // Fund allocation
        targetAmount: milestone.targetAmount,
        fundingPercentage: (milestone.targetAmount / contract.fundingTarget) * 100,
        released: milestone.status === 'RELEASED',
        releasedAt: milestone.releasedAt,
        releasedBy: milestone.releasedBy,
        
        // Verification requirements
        verification: {
          status: verificationStatus,
          energyTarget: energyTarget,
          energyProduced: energyProgress,
          percentComplete: energyPercentComplete.toFixed(2) + '%',
          eligibleForRelease,
          releaseConditions,
        },
        
        // Oracle data integration
        oracleData: oracleData ? {
          energyProduction: oracleData.energyProduction,
          confidence: oracleData.confidence,
          lastUpdate: oracleData.lastUpdate,
          verificationScore: oracleData.verificationScore,
        } : null,
        
        // Audit trail
        audit: {
          createdAt: milestone.createdAt,
          submittedAt: milestone.submittedAt,
          releasedAt: milestone.releasedAt,
          daysSinceSubmission: milestone.submittedAt 
            ? Math.floor((Date.now() - new Date(milestone.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
            : null,
        },
      };
    });

    // WO-88: Calculate overall progress
    const totalMilestones = milestonesWithVerification.length;
    const completedMilestones = milestonesWithVerification.filter((m) => m.released).length;
    const pendingMilestones = milestonesWithVerification.filter((m) => m.status === 'PENDING' || m.status === 'SUBMITTED').length;
    const eligibleForRelease = milestonesWithVerification.filter((m) => m.verification.eligibleForRelease).length;

    const totalFundingAllocated = milestonesWithVerification.reduce((sum: number, m) => sum + m.targetAmount, 0);
    const fundingReleased = milestonesWithVerification
      .filter((m) => m.released)
      .reduce((sum: number, m) => sum + m.targetAmount, 0);

    const responseTime = Date.now() - startTime;
    console.log(`[WO-88] Milestones fetched in ${responseTime}ms`);

    // WO-88: Return comprehensive milestone data
    return res.status(200).json({
      success: true,
      contract: {
        id: contract.id,
        contractId: contract.contractId,
        projectId: contract.projectId,
        fundingTarget: contract.fundingTarget,
        currentBalance: contract.currentBalance,
        status: contract.status,
      },
      milestones: milestonesWithVerification,
      summary: {
        total: totalMilestones,
        completed: completedMilestones,
        pending: pendingMilestones,
        eligibleForRelease,
        progress: totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0,
        fundingAllocated: totalFundingAllocated,
        fundingReleased,
        fundingPending: totalFundingAllocated - fundingReleased,
      },
      energyProduction: {
        total: totalEnergyProduced,
        verified: verifiedEnergy,
        averageDaily: averageDailyProduction,
        dataPoints: energyMetrics.length,
      },
      oracleStatus: contract.oracleAuthority ? {
        configured: true,
        authority: contract.oracleAuthority,
        lastUpdate: oracleData?.lastUpdate || null,
        available: oracleData !== null,
      } : {
        configured: false,
      },
      access: {
        isCreator,
        canVerify: isCreator,
      },
      performance: {
        responseTime,
        dataSource: {
          database: true,
          oracle: oracleData !== null,
        },
      },
    });

  } catch (error) {
    console.error('[WO-88] Failed to fetch milestones:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve milestones',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * WO-88: Calculate verification status
 */
function calculateVerificationStatus(
  milestoneStatus: string,
  energyComplete: number,
  submittedAt: Date | null,
  releasedAt: Date | null
): string {
  if (releasedAt) return 'VERIFIED_RELEASED';
  if (milestoneStatus === 'RELEASED') return 'VERIFIED_RELEASED';
  if (submittedAt && energyComplete >= 100) return 'READY_FOR_VERIFICATION';
  if (submittedAt) return 'PENDING_VERIFICATION';
  if (energyComplete >= 50) return 'IN_PROGRESS';
  return 'NOT_STARTED';
}

export default withOptionalAuth(getMilestones);

