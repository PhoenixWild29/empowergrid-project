/**
 * GET /api/escrow/releases/[contractId]/status
 * 
 * WO-117: Real-time release status with forecasting
 * 
 * Features:
 * - Current trigger monitoring state
 * - Verification progress percentage
 * - Pending release operations count
 * - Release timeline forecasting
 * - Prediction confidence scores
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../../lib/middleware/authMiddleware';
import { prisma } from '../../../../../lib/prisma';

async function releaseStatusHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const { contractId } = req.query;

    if (!contractId || typeof contractId !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'contractId parameter is required',
      });
    }

    console.log('[WO-117] Fetching release status:', contractId);

    // Get escrow contract
    const contract = await (prisma as any).escrowContract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Escrow contract not found',
      });
    }

    // Get fund allocations for this contract/project
    const allocations = await (prisma as any).fundAllocation.findMany({
      where: {
        projectId: contract.projectId,
      },
      include: {
        releaseConditions: true,
        transactions: {
          where: {
            transactionStatus: { in: ['PENDING', 'PROCESSING'] },
          },
        },
      },
    });

    // Get pending transactions count
    const pendingReleases = allocations.reduce(
      (sum: number, alloc: any) => sum + alloc.transactions.length,
      0
    );

    // Calculate verification progress
    const activeConditions = allocations.flatMap((a: any) => a.releaseConditions.filter((c: any) => c.isActive));
    const metConditions = activeConditions.filter((c: any) => c.conditionMet).length;
    const verificationProgress = activeConditions.length > 0
      ? Math.round((metConditions / activeConditions.length) * 100)
      : 0;

    // WO-117: Trigger monitoring state
    const triggerMonitoring = {
      isActive: activeConditions.length > 0,
      conditionsMonitored: activeConditions.length,
      conditionsMet: metConditions,
      nextCheckScheduled: activeConditions.length > 0
        ? new Date(Date.now() + 60000).toISOString() // Next check in 1 minute
        : null,
    };

    // WO-117: Release timeline forecasting
    const forecast = calculateReleaseForecasting(allocations, activeConditions);

    const responseTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      status: {
        contractId,
        projectId: contract.projectId,
        
        // WO-117: Trigger monitoring state
        triggerMonitoring,
        
        // WO-117: Verification progress
        verificationProgress,
        
        // WO-117: Pending releases
        pendingReleases,
        
        // WO-117: Automation metrics
        automationMetrics: {
          totalAllocations: allocations.length,
          activeAllocations: allocations.filter((a: any) => a.status === 'ACTIVE').length,
          completedTransactions: await (prisma as any).automatedTransaction.count({
            where: {
              allocation: {
                projectId: contract.projectId,
              },
              transactionStatus: 'CONFIRMED',
            },
          }),
        },
        
        // WO-117: Release timeline forecasting
        forecast,
      },
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[WO-117] Release status error:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve release status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * WO-117: Calculate release forecasting
 */
function calculateReleaseForecasting(allocations: any[], conditions: any[]): {
  estimatedReleaseDate: string | null;
  confidenceScore: number;
  riskAssessment: 'LOW' | 'MEDIUM' | 'HIGH';
  milestonesRemaining: number;
} {
  if (conditions.length === 0) {
    return {
      estimatedReleaseDate: null,
      confidenceScore: 0,
      riskAssessment: 'LOW',
      milestonesRemaining: 0,
    };
  }

  const unmetConditions = conditions.filter((c: any) => !c.conditionMet);
  const milestonesRemaining = unmetConditions.length;

  // Estimate: 7 days per milestone
  const daysToComplete = milestonesRemaining * 7;
  const estimatedDate = new Date(Date.now() + daysToComplete * 24 * 60 * 60 * 1000);

  // Confidence based on historical completion rates
  const completionRate = conditions.length > 0
    ? ((conditions.length - unmetConditions.length) / conditions.length)
    : 0;
  
  const confidenceScore = Math.round(completionRate * 100);

  // Risk assessment
  const riskAssessment: 'LOW' | 'MEDIUM' | 'HIGH' =
    milestonesRemaining === 0 ? 'LOW' :
    milestonesRemaining <= 2 ? 'MEDIUM' : 'HIGH';

  return {
    estimatedReleaseDate: estimatedDate.toISOString(),
    confidenceScore,
    riskAssessment,
    milestonesRemaining,
  };
}

export default withAuth(releaseStatusHandler);



