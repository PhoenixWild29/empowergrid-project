/**
 * Contract Parameter Validator
 * 
 * WO-92: Validation logic for contract parameter updates
 * 
 * Features:
 * - Business rule validation
 * - Contract constraint checking
 * - Milestone validation
 * - Timeline validation
 * - Oracle configuration validation
 */

import { z } from 'zod';

// WO-92: Parameter Update Schema
export const ParameterUpdateSchema = z.object({
  changeType: z.enum([
    'MILESTONE_UPDATE',
    'MILESTONE_REORDER',
    'TIMELINE_ADJUSTMENT',
    'ORACLE_CONFIGURATION',
    'SIGNER_UPDATE',
    'THRESHOLD_UPDATE',
    'TARGET_AMOUNT_UPDATE',
  ]),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  expirationHours: z.number().int().positive().max(168).default(48), // Max 7 days
  parameters: z.record(z.any()),
});

export type ParameterUpdate = z.infer<typeof ParameterUpdateSchema>;

// WO-92: Milestone Update Schema
export const MilestoneUpdateSchema = z.object({
  milestoneId: z.string(),
  updates: z.object({
    title: z.string().optional(),
    targetAmount: z.number().positive().optional(),
    energyTarget: z.number().positive().optional(),
    dueDate: z.string().datetime().optional(),
  }),
});

// WO-92: Timeline Adjustment Schema
export const TimelineAdjustmentSchema = z.object({
  milestoneId: z.string(),
  newDueDate: z.string().datetime(),
  reason: z.string().min(10),
});

// WO-92: Oracle Configuration Schema
export const OracleConfigurationSchema = z.object({
  oracleAuthority: z.string().optional(),
  oracleData: z.record(z.any()).optional(),
  minConfidence: z.number().min(0).max(1).optional(),
  updateInterval: z.number().int().positive().optional(),
});

// WO-92: Signer Update Schema
export const SignerUpdateSchema = z.object({
  action: z.enum(['ADD', 'REMOVE']),
  signerAddress: z.string().min(32).max(44), // Solana address
});

// WO-92: Threshold Update Schema
export const ThresholdUpdateSchema = z.object({
  newThreshold: z.number().int().positive(),
});

/**
 * WO-92: Validate parameter update against contract rules
 */
export async function validateParameterUpdate(
  contractData: any,
  update: ParameterUpdate
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  switch (update.changeType) {
    case 'MILESTONE_UPDATE':
      validateMilestoneUpdate(contractData, update.parameters, errors);
      break;
    case 'MILESTONE_REORDER':
      validateMilestoneReorder(contractData, update.parameters, errors);
      break;
    case 'TIMELINE_ADJUSTMENT':
      validateTimelineAdjustment(contractData, update.parameters, errors);
      break;
    case 'ORACLE_CONFIGURATION':
      validateOracleConfiguration(update.parameters, errors);
      break;
    case 'SIGNER_UPDATE':
      validateSignerUpdate(contractData, update.parameters, errors);
      break;
    case 'THRESHOLD_UPDATE':
      validateThresholdUpdate(contractData, update.parameters, errors);
      break;
    case 'TARGET_AMOUNT_UPDATE':
      validateTargetAmountUpdate(contractData, update.parameters, errors);
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * WO-92: Validate milestone update
 */
function validateMilestoneUpdate(
  contractData: any,
  parameters: any,
  errors: string[]
): void {
  if (!parameters.milestoneId) {
    errors.push('Milestone ID is required');
  }

  if (parameters.targetAmount !== undefined) {
    if (parameters.targetAmount <= 0) {
      errors.push('Target amount must be positive');
    }

    // Check if new amount exceeds contract funding target
    if (parameters.targetAmount > contractData.fundingTarget) {
      errors.push('Milestone target amount cannot exceed contract funding target');
    }
  }

  if (parameters.energyTarget !== undefined && parameters.energyTarget <= 0) {
    errors.push('Energy target must be positive');
  }

  if (parameters.dueDate) {
    const dueDate = new Date(parameters.dueDate);
    const now = new Date();

    if (dueDate <= now) {
      errors.push('Due date must be in the future');
    }
  }
}

/**
 * WO-92: Validate milestone reorder
 */
function validateMilestoneReorder(
  contractData: any,
  parameters: any,
  errors: string[]
): void {
  if (!Array.isArray(parameters.newOrder)) {
    errors.push('New order must be an array of milestone IDs');
    return;
  }

  // Check that all milestones are included
  const currentMilestones = contractData.milestones || [];
  if (parameters.newOrder.length !== currentMilestones.length) {
    errors.push('New order must include all existing milestones');
  }

  // Check for duplicates
  const uniqueMilestones = new Set(parameters.newOrder);
  if (uniqueMilestones.size !== parameters.newOrder.length) {
    errors.push('New order contains duplicate milestone IDs');
  }
}

/**
 * WO-92: Validate timeline adjustment
 */
function validateTimelineAdjustment(
  contractData: any,
  parameters: any,
  errors: string[]
): void {
  if (!parameters.milestoneId) {
    errors.push('Milestone ID is required');
  }

  if (!parameters.newDueDate) {
    errors.push('New due date is required');
  } else {
    const newDueDate = new Date(parameters.newDueDate);
    const now = new Date();

    if (newDueDate <= now) {
      errors.push('New due date must be in the future');
    }

    // Check if moving deadline more than 90 days
    const daysDiff = Math.floor((newDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 90) {
      errors.push('Timeline adjustment cannot exceed 90 days from current date');
    }
  }
}

/**
 * WO-92: Validate oracle configuration
 */
function validateOracleConfiguration(
  parameters: any,
  errors: string[]
): void {
  if (parameters.minConfidence !== undefined) {
    if (parameters.minConfidence < 0 || parameters.minConfidence > 1) {
      errors.push('Min confidence must be between 0 and 1');
    }
  }

  if (parameters.updateInterval !== undefined) {
    if (parameters.updateInterval < 60 || parameters.updateInterval > 3600) {
      errors.push('Update interval must be between 60 and 3600 seconds');
    }
  }

  if (parameters.oracleAuthority) {
    // Validate Solana address format
    if (parameters.oracleAuthority.length < 32 || parameters.oracleAuthority.length > 44) {
      errors.push('Invalid oracle authority address format');
    }
  }
}

/**
 * WO-92: Validate signer update
 */
function validateSignerUpdate(
  contractData: any,
  parameters: any,
  errors: string[]
): void {
  if (!parameters.action || !['ADD', 'REMOVE'].includes(parameters.action)) {
    errors.push('Action must be ADD or REMOVE');
  }

  if (!parameters.signerAddress) {
    errors.push('Signer address is required');
  }

  const currentSigners = Array.isArray(contractData.signers) ? contractData.signers : [];

  if (parameters.action === 'ADD') {
    if (currentSigners.includes(parameters.signerAddress)) {
      errors.push('Signer already exists');
    }

    if (currentSigners.length >= 10) {
      errors.push('Maximum 10 signers allowed');
    }
  }

  if (parameters.action === 'REMOVE') {
    if (!currentSigners.includes(parameters.signerAddress)) {
      errors.push('Signer does not exist');
    }

    if (currentSigners.length <= 1) {
      errors.push('Cannot remove last signer');
    }

    // Check if removing would make threshold impossible
    if (currentSigners.length - 1 < contractData.requiredSignatures) {
      errors.push('Cannot remove signer: would make signature threshold impossible');
    }
  }
}

/**
 * WO-92: Validate threshold update
 */
function validateThresholdUpdate(
  contractData: any,
  parameters: any,
  errors: string[]
): void {
  if (!parameters.newThreshold) {
    errors.push('New threshold is required');
  }

  const newThreshold = parameters.newThreshold;
  const totalSigners = Array.isArray(contractData.signers) ? contractData.signers.length : 0;

  if (newThreshold < 1) {
    errors.push('Threshold must be at least 1');
  }

  if (newThreshold > totalSigners) {
    errors.push(`Threshold cannot exceed number of signers (${totalSigners})`);
  }

  // Prevent setting threshold that would make future changes impossible
  if (newThreshold > Math.floor(totalSigners * 0.67)) {
    errors.push('Threshold should not exceed 67% of total signers for governance flexibility');
  }
}

/**
 * WO-92: Validate target amount update
 */
function validateTargetAmountUpdate(
  contractData: any,
  parameters: any,
  errors: string[]
): void {
  if (!parameters.newTargetAmount) {
    errors.push('New target amount is required');
  }

  const newTarget = parameters.newTargetAmount;

  if (newTarget <= 0) {
    errors.push('Target amount must be positive');
  }

  // Cannot reduce target below current balance
  if (newTarget < contractData.currentBalance) {
    errors.push(`Target amount cannot be less than current balance (${contractData.currentBalance})`);
  }

  // Check if change is too significant (> 50% increase or any decrease)
  const percentChange = ((newTarget - contractData.fundingTarget) / contractData.fundingTarget) * 100;

  if (percentChange < 0) {
    errors.push('Target amount cannot be decreased');
  }

  if (percentChange > 50) {
    errors.push('Target amount increase cannot exceed 50% of original target');
  }
}

/**
 * WO-92: Check if parameter change requires multi-signature approval
 */
export function requiresMultiSignature(
  changeType: string,
  contractData: any
): boolean {
  // All significant changes require multi-sig if there are multiple signers
  const hasMultipleSigners = Array.isArray(contractData.signers) && contractData.signers.length > 1;

  const significantChanges = [
    'TARGET_AMOUNT_UPDATE',
    'SIGNER_UPDATE',
    'THRESHOLD_UPDATE',
    'MILESTONE_UPDATE',
  ];

  return hasMultipleSigners && significantChanges.includes(changeType);
}



