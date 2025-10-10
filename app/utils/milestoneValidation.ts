/**
 * Milestone Validation Utilities
 * 
 * Centralized validation logic for milestones:
 * - Chronological order validation
 * - Total energy production validation
 * - Total funding allocation validation
 * - Form submission prevention
 */

import { Milestone } from '../types/projectCreation';

export interface MilestoneValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate chronological order of milestones
 */
export function validateChronologicalOrder(milestones: Milestone[]): MilestoneValidationResult {
  const errors: string[] = [];

  for (let i = 1; i < milestones.length; i++) {
    const prevDate = new Date(milestones[i - 1].deadline);
    const currDate = new Date(milestones[i].deadline);

    if (currDate <= prevDate) {
      errors.push(
        `Milestone "${milestones[i].title}" deadline must be after "${milestones[i - 1].title}"`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  };
}

/**
 * Validate total energy production matches project capacity
 */
export function validateTotalEnergyProduction(
  milestones: Milestone[],
  projectCapacity: number
): MilestoneValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const totalEnergy = milestones.reduce((sum, m) => sum + m.energyTarget, 0);

  if (totalEnergy === 0) {
    errors.push('Total energy production target across all milestones must be greater than 0');
  }

  // Warning if total energy significantly differs from project capacity estimate
  if (projectCapacity > 0) {
    // Rough estimate: 1 kW produces about 1,500 kWh/year on average
    const estimatedAnnualProduction = projectCapacity * 1500;
    const difference = Math.abs(totalEnergy - estimatedAnnualProduction) / estimatedAnnualProduction;

    if (difference > 0.5) {
      warnings.push(
        `Total milestone energy targets (${totalEnergy.toLocaleString()} kWh) differ significantly from estimated project capacity (${estimatedAnnualProduction.toLocaleString()} kWh/year)`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate funding allocation sums to 100%
 */
export function validateFundingAllocation(
  milestones: Array<Milestone & { allocation?: number }>
): MilestoneValidationResult {
  const errors: string[] = [];

  const allocations = milestones.map((m) => m.allocation || 0);
  const total = allocations.reduce((sum, val) => sum + val, 0);

  if (Math.abs(total - 100) > 0.01) {
    errors.push(
      `Milestone funding allocations must sum to 100% (current: ${total.toFixed(1)}%)`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  };
}

/**
 * Validate all milestone consistency rules
 */
export function validateMilestoneConsistency(
  milestones: Milestone[],
  projectCapacity: number,
  projectFunding: number
): MilestoneValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Check chronological order
  const chronoResult = validateChronologicalOrder(milestones);
  allErrors.push(...chronoResult.errors);

  // Check energy production
  const energyResult = validateTotalEnergyProduction(milestones, projectCapacity);
  allErrors.push(...energyResult.errors);
  allWarnings.push(...energyResult.warnings);

  // Check funding allocation if allocations are provided
  const hasAllocations = milestones.some((m) => (m as any).allocation);
  if (hasAllocations) {
    const fundingResult = validateFundingAllocation(milestones as any);
    allErrors.push(...fundingResult.errors);
  }

  // Check milestone count
  if (milestones.length < 1) {
    allErrors.push('At least 1 milestone is required');
  }

  if (milestones.length > 10) {
    allErrors.push('Maximum 10 milestones allowed');
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * Check if milestones are ready for submission
 */
export function canSubmitMilestones(
  milestones: Milestone[],
  projectCapacity: number,
  projectFunding: number
): boolean {
  const validation = validateMilestoneConsistency(milestones, projectCapacity, projectFunding);
  return validation.valid;
}

/**
 * Calculate running totals for display
 */
export function calculateMilestoneTotals(milestones: Milestone[]) {
  return {
    totalEnergy: milestones.reduce((sum, m) => sum + m.energyTarget, 0),
    totalFunding: milestones.reduce((sum, m) => sum + ((m as any).allocation || 0), 0),
    count: milestones.length,
    completionEstimate: milestones.length > 0
      ? new Date(Math.max(...milestones.map((m) => new Date(m.deadline).getTime())))
      : null,
  };
}

export default {
  validateChronologicalOrder,
  validateTotalEnergyProduction,
  validateFundingAllocation,
  validateMilestoneConsistency,
  canSubmitMilestones,
  calculateMilestoneTotals,
};




