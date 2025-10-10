/**
 * WO-140: Metric Verification API Validation Models
 * 
 * Comprehensive Zod validation schemas for metric verification API requests
 * and responses, ensuring data integrity and type safety for verification workflows.
 * 
 * Features:
 * - Verification request validation
 * - Verification result validation
 * - Confidence score range validation (0-1)
 * - Audit trail validation
 * - TypeScript type inference
 */

import { z } from 'zod';

/**
 * WO-140: Verification Status Enum
 */
export const VerificationStatusSchema = z.enum([
  'PENDING',
  'VERIFIED',
  'FAILED',
  'DISPUTED',
], {
  errorMap: () => ({
    message: 'Status must be one of: PENDING, VERIFIED, FAILED, DISPUTED',
  }),
});

/**
 * WO-140: Verification Request Schema
 * 
 * Validates incoming milestone verification requests
 * 
 * Fields:
 * - milestoneId: CUID of milestone to verify
 * - algorithmId: CUID of verification algorithm to use
 * - dataPoints: Array of oracle data point IDs
 * - parameters: Optional algorithm parameters
 * - forceRecalculation: Force recalculation even if already verified
 */
export const VerificationRequestSchema = z.object({
  milestoneId: z
    .string()
    .cuid('Milestone ID must be a valid CUID'),
  
  algorithmId: z
    .string()
    .cuid('Algorithm ID must be a valid CUID'),
  
  dataPoints: z
    .array(z.string().cuid('Data point ID must be a valid CUID'))
    .min(1, 'At least one data point is required')
    .max(100, 'Maximum 100 data points allowed'),
  
  parameters: z
    .record(z.any())
    .optional(),
  
  forceRecalculation: z
    .boolean()
    .default(false),
});

/**
 * WO-140: Audit Trail Entry Schema
 * 
 * Individual audit trail entry
 */
export const AuditTrailEntrySchema = z.object({
  timestamp: z
    .string()
    .datetime('Timestamp must be a valid ISO 8601 datetime string'),
  
  action: z
    .string()
    .min(1, 'Action is required')
    .max(200, 'Action must not exceed 200 characters'),
  
  details: z
    .string()
    .min(1, 'Details are required')
    .max(1000, 'Details must not exceed 1000 characters'),
});

/**
 * WO-140: Verification Data Schema
 * 
 * Detailed verification data structure
 */
export const VerificationDataSchema = z.object({
  algorithmUsed: z
    .string()
    .min(1, 'Algorithm used is required'),
  
  dataQuality: z
    .number()
    .min(0, 'Data quality must be between 0 and 1')
    .max(1, 'Data quality must be between 0 and 1'),
  
  processingTime: z
    .number()
    .positive('Processing time must be positive')
    .int('Processing time must be an integer'),
  
  anomaliesDetected: z
    .array(z.object({
      type: z.string(),
      severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      description: z.string(),
      dataPointId: z.string().optional(),
    }))
    .default([]),
  
  // Additional optional fields
  oracleSourcesUsed: z
    .array(z.string())
    .optional(),
  
  consensusLevel: z
    .number()
    .min(0)
    .max(1)
    .optional(),
  
  rawDataSnapshot: z
    .record(z.any())
    .optional(),
});

/**
 * WO-140: Verification Result Schema
 * 
 * Complete verification result structure
 * 
 * Fields:
 * - milestoneId: Verified milestone ID
 * - status: Verification status (PENDING, VERIFIED, FAILED, DISPUTED)
 * - confidenceScore: Confidence score (0-1)
 * - verificationData: Detailed verification information
 * - auditTrail: Array of audit trail entries
 */
export const VerificationResultSchema = z.object({
  milestoneId: z
    .string()
    .cuid('Milestone ID must be a valid CUID'),
  
  status: VerificationStatusSchema,
  
  confidenceScore: z
    .number()
    .min(0, 'Confidence score must be between 0 and 1')
    .max(1, 'Confidence score must be between 0 and 1'),
  
  verificationData: VerificationDataSchema,
  
  auditTrail: z
    .array(AuditTrailEntrySchema)
    .min(1, 'At least one audit trail entry is required'),
  
  // Additional optional fields
  verificationId: z
    .string()
    .cuid()
    .optional(),
  
  verifiedAt: z
    .string()
    .datetime()
    .optional(),
  
  verifiedBy: z
    .string()
    .optional(),
  
  notes: z
    .string()
    .max(2000, 'Notes must not exceed 2000 characters')
    .optional(),
});

/**
 * WO-140: Verification Summary Schema
 * 
 * Summary of verification results for a project or milestone
 */
export const VerificationSummarySchema = z.object({
  totalVerifications: z
    .number()
    .int()
    .nonnegative(),
  
  verifiedCount: z
    .number()
    .int()
    .nonnegative(),
  
  failedCount: z
    .number()
    .int()
    .nonnegative(),
  
  disputedCount: z
    .number()
    .int()
    .nonnegative(),
  
  averageConfidence: z
    .number()
    .min(0)
    .max(1),
  
  averageProcessingTime: z
    .number()
    .positive(),
  
  lastVerificationAt: z
    .string()
    .datetime()
    .optional(),
});

/**
 * WO-140: Algorithm Configuration Schema
 * 
 * Schema for algorithm configuration parameters
 */
export const AlgorithmConfigurationSchema = z.object({
  algorithmId: z
    .string()
    .cuid(),
  
  parameters: z
    .record(z.any()),
  
  version: z
    .string()
    .regex(/^\d+\.\d+(\.\d+)?$/, 'Version must be in format X.Y or X.Y.Z'),
  
  isActive: z
    .boolean()
    .default(true),
});

/**
 * WO-140: Manual Review Request Schema
 * 
 * Schema for requesting manual review of verification
 */
export const ManualReviewRequestSchema = z.object({
  milestoneId: z
    .string()
    .cuid(),
  
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(1000, 'Reason must not exceed 1000 characters'),
  
  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .default('MEDIUM'),
  
  assignTo: z
    .string()
    .cuid()
    .optional(),
  
  attachments: z
    .array(z.string().url())
    .optional(),
});

/**
 * WO-140: Recalculation Request Schema
 * 
 * Schema for requesting verification recalculation
 */
export const RecalculationRequestSchema = z.object({
  milestoneId: z
    .string()
    .cuid()
    .optional(),
  
  projectId: z
    .string()
    .cuid()
    .optional(),
  
  algorithmId: z
    .string()
    .cuid()
    .optional(),
  
  dateRange: z
    .object({
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
    })
    .optional(),
  
  recalculateAll: z
    .boolean()
    .default(false),
})
.refine(
  (data) => data.milestoneId || data.projectId || data.recalculateAll,
  'Must provide milestoneId, projectId, or set recalculateAll to true'
);

// Export TypeScript types
export type VerificationRequest = z.infer<typeof VerificationRequestSchema>;
export type VerificationResult = z.infer<typeof VerificationResultSchema>;
export type VerificationData = z.infer<typeof VerificationDataSchema>;
export type AuditTrailEntry = z.infer<typeof AuditTrailEntrySchema>;
export type VerificationSummary = z.infer<typeof VerificationSummarySchema>;
export type AlgorithmConfiguration = z.infer<typeof AlgorithmConfigurationSchema>;
export type ManualReviewRequest = z.infer<typeof ManualReviewRequestSchema>;
export type RecalculationRequest = z.infer<typeof RecalculationRequestSchema>;
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;



