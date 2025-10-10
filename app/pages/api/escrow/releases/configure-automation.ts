/**
 * POST /api/escrow/releases/configure-automation
 * 
 * WO-117: Configure automated fund release parameters
 * 
 * Features:
 * - Trigger condition configuration
 * - Verification threshold setup
 * - Release schedule configuration
 * - Fallback mechanisms
 * - Manual override settings
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../lib/middleware/authMiddleware';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';

// WO-117: Automation configuration schema
const AutomationConfigSchema = z.object({
  contractId: z.string().cuid(),
  projectId: z.string().cuid(),
  milestoneId: z.string().cuid().optional(),
  
  // Trigger conditions
  triggerConditions: z.object({
    milestoneCompletion: z.boolean().default(true),
    oracleThreshold: z.number().min(0).max(100).optional(),
    timeDelay: z.number().int().min(0).optional(), // seconds
  }),
  
  // Verification thresholds
  verificationThresholds: z.object({
    minConfidenceScore: z.number().min(0).max(100).default(80),
    requiredDataPoints: z.number().int().min(1).default(3),
    anomalyTolerance: z.number().min(0).max(100).default(10),
  }),
  
  // Release schedule
  releaseSchedule: z.object({
    immediate: z.boolean().default(false),
    cronExpression: z.string().optional(),
    delaySeconds: z.number().int().min(0).optional(),
  }),
  
  // Fallback mechanisms
  fallbackMechanisms: z.object({
    enableManualReview: z.boolean().default(true),
    notifyOnFailure: z.boolean().default(true),
    maxRetries: z.number().int().min(0).max(5).default(3),
  }),
  
  // Manual override
  manualOverride: z.object({
    enabled: z.boolean().default(true),
    requiresApprovals: z.number().int().min(1).default(2),
    approvalTimeout: z.number().int().min(3600).default(86400), // seconds
  }),
});

async function configureAutomationHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    console.log('[WO-117] Configuring automation');

    // WO-117: Validate configuration
    const config = AutomationConfigSchema.parse(req.body);
    const userId = (req as any).user?.id;

    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: config.projectId },
    });

    if (!project) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Project not found',
      });
    }

    if (project.creatorId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Unauthorized to configure automation for this project',
      });
    }

    // WO-117: Validate cron expression if provided
    if (config.releaseSchedule.cronExpression) {
      const isValidCron = validateCronExpression(config.releaseSchedule.cronExpression);
      if (!isValidCron) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Invalid cron expression format',
          field: 'releaseSchedule.cronExpression',
        });
      }
    }

    // Find or create fund allocation
    let allocation = await (prisma as any).fundAllocation.findFirst({
      where: {
        projectId: config.projectId,
        milestoneId: config.milestoneId || null,
      },
    });

    if (!allocation) {
      allocation = await (prisma as any).fundAllocation.create({
        data: {
        projectId: config.projectId,
        milestoneId: config.milestoneId,
        totalAmount: 0, // Will be set when funds are deposited
        allocatedAmount: 0,
        remainingBalance: 0,
          allocationType: config.milestoneId ? 'MILESTONE_BASED' : 'TIME_BASED',
          status: 'ACTIVE',
        },
      });
    }

    // Create release condition
    const condition = await (prisma as any).releaseCondition.create({
      data: {
        allocationId: allocation.id,
        conditionType: config.milestoneId ? 'MILESTONE_COMPLETION' : 'TIME_THRESHOLD',
        conditionData: {
          triggerConditions: config.triggerConditions,
          verificationThresholds: config.verificationThresholds,
          releaseSchedule: config.releaseSchedule,
          fallbackMechanisms: config.fallbackMechanisms,
          manualOverride: config.manualOverride,
        },
        requiresMilestoneCompletion: config.triggerConditions.milestoneCompletion,
        milestoneId: config.milestoneId,
        requiresVerification: true,
        minConfidenceScore: config.verificationThresholds.minConfidenceScore / 100, // Convert to 0-1
        autoReleaseEnabled: !config.fallbackMechanisms.enableManualReview,
        releaseDelay: config.releaseSchedule.delaySeconds,
      },
    });

    const responseTime = Date.now() - startTime;

    return res.status(201).json({
      success: true,
      message: 'Automation configured successfully',
      configuration: {
        allocationId: allocation.id,
        conditionId: condition.id,
        projectId: config.projectId,
        milestoneId: config.milestoneId,
        autoReleaseEnabled: condition.autoReleaseEnabled,
        status: 'ACTIVE',
      },
      validation: {
        cronExpressionValid: config.releaseSchedule.cronExpression ? true : null,
        thresholdsValid: true,
        configurationComplete: true,
      },
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[WO-117] Configuration error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.issues,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to configure automation',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * WO-117: Validate cron expression format
 */
function validateCronExpression(cron: string): boolean {
  // Basic cron validation: 5 or 6 fields separated by spaces
  const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
  
  return cronRegex.test(cron);
}

export default withAuth(configureAutomationHandler);



