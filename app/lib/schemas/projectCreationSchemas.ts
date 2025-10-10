/**
 * Project Creation Form Validation Schemas
 * 
 * Comprehensive Zod validation schemas for all steps of the project creation form
 */

import { z } from 'zod';

/**
 * Step 1: Project Basic Info Schema
 */
export const ProjectBasicInfoSchema = z.object({
  projectName: z.string()
    .min(1, 'Project name is required')
    .max(200, 'Project name must be at most 200 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Project name can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be at most 2000 characters'),
  
  location: z.string()
    .min(1, 'Location is required')
    .max(200, 'Location must be at most 200 characters'),
  
  locationCoordinates: z.object({
    latitude: z.number()
      .min(-90, 'Latitude must be between -90 and 90')
      .max(90, 'Latitude must be between -90 and 90')
      .optional(),
    longitude: z.number()
      .min(-180, 'Longitude must be between -180 and 180')
      .max(180, 'Longitude must be between -180 and 180')
      .optional(),
  }).optional(),
  
  projectType: z.enum(['Solar', 'Wind', 'Hydro', 'Biomass', 'Geothermal', 'Hybrid'], {
    errorMap: () => ({ message: 'Please select a valid project type' }),
  }),
});

/**
 * Step 2: Technical Specifications Schema
 */
export const TechnicalSpecificationsSchema = z.object({
  energyCapacity: z.number()
    .min(1, 'Energy capacity must be at least 1 kW')
    .max(10000, 'Energy capacity cannot exceed 10,000 kW (10 MW) per industry standards')
    .positive('Energy capacity must be a positive number'),
  
  efficiencyRating: z.number()
    .min(0, 'Efficiency rating must be at least 0%')
    .max(100, 'Efficiency rating cannot exceed 100%')
    .optional(),
  
  equipmentType: z.string()
    .min(1, 'Equipment type is required')
    .max(100, 'Equipment type must be at most 100 characters'),
  
  equipmentManufacturer: z.string()
    .max(100, 'Manufacturer name must be at most 100 characters')
    .optional(),
  
  installationDate: z.string()
    .datetime({ message: 'Invalid installation date' })
    .or(z.date())
    .optional(),
  
  warrantyYears: z.number()
    .int('Warranty must be a whole number of years')
    .min(0)
    .max(50)
    .optional(),
});

/**
 * Step 3: Funding Structure Schema
 */
export const FundingStructureSchema = z.object({
  fundingTarget: z.number()
    .min(1000, 'Minimum funding target is $1,000')
    .max(10000000, 'Maximum funding target is $10,000,000')
    .positive('Funding target must be positive'),
  
  milestoneAllocation: z.array(z.number()
    .min(0, 'Allocation percentage cannot be negative')
    .max(100, 'Allocation percentage cannot exceed 100%')
  )
    .min(1, 'At least one milestone allocation is required')
    .max(10, 'Maximum 10 milestone allocations allowed')
    .refine((allocations) => {
      const sum = allocations.reduce((acc, val) => acc + val, 0);
      return Math.abs(sum - 100) < 0.01; // Allow for floating point precision
    }, {
      message: 'Milestone allocations must sum to 100%',
    }),
  
  fundingTimeline: z.number()
    .int('Timeline must be in whole days')
    .min(7, 'Minimum funding timeline is 7 days')
    .max(730, 'Maximum funding timeline is 730 days (2 years)'),
  
  currency: z.enum(['USD', 'USDC', 'SOL'], {
    errorMap: () => ({ message: 'Please select a valid currency' }),
  }).default('USDC'),
});

/**
 * Step 4: Milestone Definition Schema
 */
const SingleMilestoneSchema = z.object({
  title: z.string()
    .min(1, 'Milestone title is required')
    .max(100, 'Milestone title must be at most 100 characters'),
  
  description: z.string()
    .min(1, 'Milestone description is required')
    .max(500, 'Milestone description must be at most 500 characters'),
  
  energyTarget: z.number()
    .positive('Energy target must be positive')
    .max(1000000, 'Energy target cannot exceed 1,000,000 kWh'),
  
  deadline: z.string()
    .datetime({ message: 'Invalid deadline format' })
    .or(z.date()),
  
  deliverables: z.string()
    .min(1, 'Deliverables description is required')
    .max(1000, 'Deliverables description must be at most 1000 characters'),
  
  allocation: z.number()
    .min(0)
    .max(100)
    .optional(),
});

export const MilestoneDefinitionSchema = z.object({
  milestones: z.array(SingleMilestoneSchema)
    .min(1, 'At least 1 milestone is required')
    .max(10, 'Maximum 10 milestones allowed')
    .refine((milestones) => {
      // Validate deadlines are in chronological order
      for (let i = 1; i < milestones.length; i++) {
        const prev = new Date(milestones[i - 1].deadline);
        const curr = new Date(milestones[i].deadline);
        if (curr <= prev) {
          return false;
        }
      }
      return true;
    }, {
      message: 'Milestone deadlines must be in chronological order',
    })
    .refine((milestones) => {
      // Validate total energy targets are reasonable
      const totalEnergy = milestones.reduce((sum, m) => sum + m.energyTarget, 0);
      return totalEnergy > 0;
    }, {
      message: 'Total energy targets across all milestones must be greater than 0',
    }),
});

/**
 * Complete Project Creation Schema
 * Combines all step schemas
 */
export const CompleteProjectCreationSchema = ProjectBasicInfoSchema
  .merge(TechnicalSpecificationsSchema)
  .merge(FundingStructureSchema)
  .merge(MilestoneDefinitionSchema)
  .refine((data) => {
    // Business rule: funding target should reasonably match energy capacity
    const costPerKW = data.fundingTarget / data.energyCapacity;
    return costPerKW >= 100 && costPerKW <= 10000; // Reasonable range for renewable energy
  }, {
    message: 'Funding target appears unreasonable for the specified energy capacity',
    path: ['fundingTarget'],
  });

/**
 * Type exports
 */
export type ProjectBasicInfo = z.infer<typeof ProjectBasicInfoSchema>;
export type TechnicalSpecifications = z.infer<typeof TechnicalSpecificationsSchema>;
export type FundingStructure = z.infer<typeof FundingStructureSchema>;
export type MilestoneDefinition = z.infer<typeof MilestoneDefinitionSchema>;
export type CompleteProjectCreation = z.infer<typeof CompleteProjectCreationSchema>;
export type SingleMilestone = z.infer<typeof SingleMilestoneSchema>;




