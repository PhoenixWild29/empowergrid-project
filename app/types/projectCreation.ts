/**
 * Project Creation Data Models
 * 
 * Comprehensive type definitions for project creation workflow
 * Extends existing project management models with validation metadata
 */

import { z } from 'zod';
import {
  ProjectBasicInfoSchema,
  TechnicalSpecificationsSchema,
  FundingStructureSchema,
  MilestoneDefinitionSchema,
  CompleteProjectCreationSchema,
} from '../lib/schemas/projectCreationSchemas';

/**
 * Project Details
 * Captures core project information
 */
export interface ProjectDetails {
  projectName: string; // Mandatory, 1-200 chars
  description: string; // Mandatory, 10-2000 chars
  location: string; // Mandatory, 1-200 chars
  locationCoordinates?: {
    latitude: number; // Optional, -90 to 90
    longitude: number; // Optional, -180 to 180
  };
  projectType: 'Solar' | 'Wind' | 'Hydro' | 'Biomass' | 'Geothermal' | 'Hybrid'; // Mandatory
  createdAt?: Date;
  createdBy?: string; // User ID
}

/**
 * Funding Requirements
 * Captures financial aspects of the project
 */
export interface FundingRequirements {
  fundingTarget: number; // Mandatory, $1,000 to $10,000,000
  currency: 'USD' | 'USDC' | 'SOL'; // Mandatory, default USDC
  fundingTimeline: number; // Mandatory, 7-730 days
  milestoneAllocation: number[]; // Mandatory, must sum to 100%
  fundingSources?: string[]; // Optional
  financialConstraints?: string; // Optional
}

/**
 * Milestone
 * Captures individual milestone information
 */
export interface Milestone {
  title: string; // Mandatory, 1-100 chars
  description: string; // Mandatory, 1-500 chars
  energyTarget: number; // Mandatory, positive, max 1M kWh
  deadline: string; // Mandatory, valid datetime
  deliverables: string; // Mandatory, 1-1000 chars
  allocation?: number; // Optional, percentage of total funding
  order?: number; // Optional, for sequencing
}

/**
 * Technical Specifications
 * Captures technical details of the project
 */
export interface TechnicalSpecifications {
  energyCapacity: number; // Mandatory, 1-10,000 kW
  efficiencyRating?: number; // Optional, 0-100%
  equipmentType: string; // Mandatory, max 100 chars
  equipmentManufacturer?: string; // Optional, max 100 chars
  installationDate?: string; // Optional, valid datetime
  warrantyYears?: number; // Optional, 0-50 years
}

/**
 * Complete Project Creation Form
 * Combines all sections with validation metadata
 */
export interface ProjectCreationForm {
  // Project Details
  projectDetails: ProjectDetails;
  
  // Technical Specifications
  technicalSpecs: TechnicalSpecifications;
  
  // Funding Requirements
  fundingRequirements: FundingRequirements;
  
  // Milestones
  milestones: Milestone[];
  
  // Metadata
  isDraft: boolean;
  lastModified: Date;
  completionPercentage: number;
}

/**
 * Validation Error Structure
 * For providing actionable feedback on validation failures
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
  constraints?: {
    min?: number | string;
    max?: number | string;
    pattern?: string;
    required?: boolean;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Form Validation Functions
 */

/**
 * Validate project details
 */
export function validateProjectDetails(data: Partial<ProjectDetails>): ValidationResult {
  try {
    ProjectBasicInfoSchema.parse(data);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
          value: (data as any)[e.path[0]],
        })),
      };
    }
    return { valid: false, errors: [] };
  }
}

/**
 * Validate technical specifications
 */
export function validateTechnicalSpecs(data: Partial<TechnicalSpecifications>): ValidationResult {
  try {
    TechnicalSpecificationsSchema.parse(data);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
          value: (data as any)[e.path[0]],
        })),
      };
    }
    return { valid: false, errors: [] };
  }
}

/**
 * Validate funding requirements
 */
export function validateFundingRequirements(data: Partial<FundingRequirements>): ValidationResult {
  try {
    FundingStructureSchema.parse(data);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
          value: (data as any)[e.path[0]],
        })),
      };
    }
    return { valid: false, errors: [] };
  }
}

/**
 * Validate milestones
 */
export function validateMilestones(data: { milestones: Milestone[] }): ValidationResult {
  try {
    MilestoneDefinitionSchema.parse(data);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })),
      };
    }
    return { valid: false, errors: [] };
  }
}

/**
 * Validate complete project creation form
 */
export function validateCompleteForm(data: Partial<ProjectCreationForm>): ValidationResult {
  try {
    const flattenedData = {
      ...data.projectDetails,
      ...data.technicalSpecs,
      ...data.fundingRequirements,
      milestones: data.milestones || [],
    };
    
    CompleteProjectCreationSchema.parse(flattenedData);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })),
      };
    }
    return { valid: false, errors: [] };
  }
}

/**
 * Check if form is complete
 */
export function isFormComplete(data: Partial<ProjectCreationForm>): boolean {
  const result = validateCompleteForm(data);
  return result.valid;
}

/**
 * Calculate form completion percentage
 */
export function calculateCompletionPercentage(data: Partial<ProjectCreationForm>): number {
  const requiredFields = [
    'projectDetails.projectName',
    'projectDetails.description',
    'projectDetails.location',
    'projectDetails.projectType',
    'technicalSpecs.energyCapacity',
    'technicalSpecs.equipmentType',
    'fundingRequirements.fundingTarget',
    'fundingRequirements.fundingTimeline',
    'milestones',
  ];

  const completedFields = requiredFields.filter((fieldPath) => {
    const parts = fieldPath.split('.');
    let value: any = data;
    
    for (const part of parts) {
      value = value?.[part as keyof typeof value];
    }
    
    if (fieldPath === 'milestones') {
      return Array.isArray(value) && value.length > 0;
    }
    
    return value !== undefined && value !== null && value !== '' && value !== 0;
  });

  return (completedFields.length / requiredFields.length) * 100;
}

/**
 * Type exports from Zod schemas
 */
export type ProjectBasicInfo = z.infer<typeof ProjectBasicInfoSchema>;
export type TechnicalSpecs = z.infer<typeof TechnicalSpecificationsSchema>;
export type FundingStructure = z.infer<typeof FundingStructureSchema>;
export type MilestoneDefinition = z.infer<typeof MilestoneDefinitionSchema>;
export type CompleteProjectCreation = z.infer<typeof CompleteProjectCreationSchema>;

export default {
  validateProjectDetails,
  validateTechnicalSpecs,
  validateFundingRequirements,
  validateMilestones,
  validateCompleteForm,
  isFormComplete,
  calculateCompletionPercentage,
};






