/**
 * Project Validation Schemas
 * 
 * Zod schemas for project management operations
 * Comprehensive validation for project creation, updates, milestones, and funding
 */

import { z } from 'zod';

/**
 * Milestone Schema for Project Creation
 * 
 * Validation:
 * - Title: 1-100 chars
 * - Description: 1-500 chars
 * - Target amount: positive number
 * - Energy target: optional positive number
 * - Due date: valid datetime string
 */
export const MilestoneSchema = z.object({
  title: z.string()
    .min(1, 'Milestone title must be at least 1 character')
    .max(100, 'Milestone title must be at most 100 characters'),
  
  description: z.string()
    .min(1, 'Milestone description must be at least 1 character')
    .max(500, 'Milestone description must be at most 500 characters'),
  
  targetAmount: z.number()
    .positive('Milestone target amount must be positive'),
  
  energyTarget: z.number()
    .positive('Energy target must be positive')
    .optional(),
  
  dueDate: z.string()
    .datetime({ message: 'Due date must be a valid datetime string' })
    .or(z.date()),
});

/**
 * Create Project Schema
 * 
 * Validation:
 * - Title: 1-200 chars
 * - Description: 10-2000 chars
 * - Location: 1-200 chars
 * - Energy capacity: 1kW - 10MW (1 - 10000 kW)
 * - Funding target: $1K - $10M
 * - Milestones: 1-10 milestones required
 */
export const CreateProjectSchema = z.object({
  title: z.string()
    .min(1, 'Title must be at least 1 character')
    .max(200, 'Title must be at most 200 characters'),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be at most 2000 characters'),
  
  location: z.string()
    .min(1, 'Location is required')
    .max(200, 'Location must be at most 200 characters'),
  
  category: z.string()
    .min(1, 'Category is required'),
  
  tags: z.array(z.string())
    .min(1, 'At least one tag is required')
    .max(10, 'Maximum 10 tags allowed')
    .optional()
    .default([]),
  
  // Funding target validation
  fundingTarget: z.number()
    .positive('Funding target must be positive')
    .max(10000000, 'Maximum funding target is $10,000,000'),
  
  targetAmount: z.number()
    .positive('Target amount must be positive')
    .max(10000000, 'Maximum funding target is $10,000,000')
    .optional(), // Alias for fundingTarget for backward compatibility
  
  // Energy capacity in kW
  energyCapacity: z.number()
    .positive('Energy capacity must be positive')
    .max(10000, 'Maximum energy capacity is 10,000 kW (10 MW) per industry standards'),
  
  // Milestones array validation
  milestones: z.array(MilestoneSchema)
    .min(1, 'At least 1 milestone is required')
    .max(10, 'Maximum 10 milestones allowed'),
  
  duration: z.number()
    .int()
    .min(7, 'Minimum project duration is 7 days')
    .max(730, 'Maximum project duration is 2 years')
    .optional()
    .default(90),
  
  images: z.array(z.string().url())
    .max(10, 'Maximum 10 images allowed')
    .optional(),
  
  videoUrl: z.string().url()
    .optional(),
})
.refine((data) => {
  // Milestone consistency check: sum of milestone amounts should not exceed funding target
  const fundingTarget = data.fundingTarget || data.targetAmount || 0;
  const milestoneSum = data.milestones.reduce((sum, m) => sum + m.targetAmount, 0);
  return milestoneSum <= fundingTarget;
}, {
  message: 'Sum of milestone target amounts cannot exceed project funding target',
  path: ['milestones'],
})
.refine((data) => {
  // Validate due dates are in chronological order
  const dates = data.milestones.map(m => new Date(m.dueDate).getTime());
  for (let i = 1; i < dates.length; i++) {
    if (dates[i] < dates[i - 1]) {
      return false;
    }
  }
  return true;
}, {
  message: 'Milestone due dates must be in chronological order',
  path: ['milestones'],
});

/**
 * Update Project Schema
 */
export const UpdateProjectSchema = z.object({
  title: z.string()
    .min(10)
    .max(200)
    .optional(),
  
  description: z.string()
    .min(50)
    .max(5000)
    .optional(),
  
  category: z.string()
    .optional(),
  
  tags: z.array(z.string())
    .max(10)
    .optional(),
  
  status: z.enum(['DRAFT', 'ACTIVE', 'FUNDED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .optional(),
  
  images: z.array(z.string().url())
    .max(10)
    .optional(),
  
  videoUrl: z.string().url()
    .optional()
    .nullable(),
});

/**
 * Project Query Filters Schema
 * 
 * WO-65: Enhanced filtering with owner/creator and date range support
 * Optimized for sub-2-second queries on 1000+ projects
 */
export const ProjectFiltersSchema = z.object({
  // Status filter
  status: z.enum(['DRAFT', 'ACTIVE', 'FUNDED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .optional(),
  
  // Location filter
  location: z.string()
    .optional(),
  
  // Energy capacity range
  minCapacity: z.number()
    .min(0)
    .optional(),
  
  maxCapacity: z.number()
    .max(10000)
    .optional(),
  
  // Funding range
  minFunding: z.number()
    .min(0)
    .optional(),
  
  maxFunding: z.number()
    .optional(),
  
  // Category filter
  category: z.string()
    .optional(),
  
  // Owner/Creator filter (WO-65 requirement)
  creatorId: z.string()
    .optional(),
  
  // Date range filters (WO-65 requirement)
  createdAfter: z.string()
    .datetime({ message: 'createdAfter must be a valid ISO datetime' })
    .or(z.date())
    .optional(),
  
  createdBefore: z.string()
    .datetime({ message: 'createdBefore must be a valid ISO datetime' })
    .or(z.date())
    .optional(),
  
  // Full-text search
  search: z.string()
    .optional(),
  
  // Pagination
  page: z.number()
    .int()
    .min(1)
    .default(1),
  
  limit: z.number()
    .int()
    .min(1)
    .max(100)
    .default(20),
  
  // Sorting (WO-65: includes name/title, createdAt, status)
  sortBy: z.enum(['createdAt', 'fundingProgress', 'targetAmount', 'title', 'status', 'updatedAt'])
    .default('createdAt'),
  
  sortDirection: z.enum(['asc', 'desc'])
    .default('desc'),
})
.refine((data) => {
  // Validate date range: createdAfter must be before createdBefore
  if (data.createdAfter && data.createdBefore) {
    const after = new Date(data.createdAfter).getTime();
    const before = new Date(data.createdBefore).getTime();
    return after <= before;
  }
  return true;
}, {
  message: 'createdAfter must be before or equal to createdBefore',
  path: ['createdAfter'],
});

/**
 * Milestone Modification Schema
 * For updating individual milestones
 */
export const UpdateMilestoneSchema = z.object({
  title: z.string()
    .min(1)
    .max(100)
    .optional(),
  
  description: z.string()
    .min(1)
    .max(500)
    .optional(),
  
  targetAmount: z.number()
    .positive()
    .optional(),
  
  energyTarget: z.number()
    .positive()
    .optional()
    .nullable(),
  
  dueDate: z.string()
    .datetime()
    .or(z.date())
    .optional(),
  
  status: z.enum(['PENDING', 'SUBMITTED', 'APPROVED', 'RELEASED', 'REJECTED'])
    .optional(),
  
  verificationData: z.record(z.any())
    .optional(),
});

/**
 * Funding Record Creation Schema
 * For validating funding transaction data
 */
export const CreateFundingRecordSchema = z.object({
  projectId: z.string()
    .min(1, 'Project ID is required'),
  
  funderId: z.string()
    .min(1, 'Funder ID is required'),
  
  amount: z.number()
    .positive('Funding amount must be positive')
    .max(10000000, 'Maximum funding amount is $10,000,000'),
  
  transactionHash: z.string()
    .min(1, 'Transaction hash is required')
    .regex(/^[1-9A-HJ-NP-Za-km-z]{87,88}$/, 'Invalid Solana transaction signature format'),
});

/**
 * Milestone Verification Schema
 * For submitting milestone completion verification
 */
export const VerifyMilestoneSchema = z.object({
  milestoneId: z.string()
    .min(1, 'Milestone ID is required'),
  
  verificationData: z.object({
    energyProduced: z.number()
      .positive()
      .optional(),
    
    completionProof: z.string()
      .min(1)
      .optional(),
    
    notes: z.string()
      .max(1000)
      .optional(),
    
    attachments: z.array(z.string().url())
      .max(10)
      .optional(),
  }),
});

/**
 * Project Status Update Schema
 */
export const UpdateProjectStatusSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'FUNDED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  reason: z.string()
    .max(500)
    .optional(),
});

/**
 * Type exports
 */
export type CreateProjectRequest = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectRequest = z.infer<typeof UpdateProjectSchema>;
export type ProjectFilters = z.infer<typeof ProjectFiltersSchema>;
export type MilestoneData = z.infer<typeof MilestoneSchema>;
export type UpdateMilestoneRequest = z.infer<typeof UpdateMilestoneSchema>;
export type CreateFundingRecordRequest = z.infer<typeof CreateFundingRecordSchema>;
export type VerifyMilestoneRequest = z.infer<typeof VerifyMilestoneSchema>;
export type UpdateProjectStatusRequest = z.infer<typeof UpdateProjectStatusSchema>;

