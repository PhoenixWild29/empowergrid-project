/**
 * WO-130: Oracle Data Validation Schemas
 * 
 * Comprehensive Zod validation schemas for oracle feed configuration
 * and data validation to ensure data integrity and security.
 * 
 * Features:
 * - Feed address validation (Solana public key format)
 * - Feed type enum validation
 * - Name and description constraints
 * - Update frequency range validation
 * - Data point validation with confidence scores
 * - Signature and timestamp validation
 */

import { z } from 'zod';

/**
 * WO-130: Oracle Feed Type Enum
 */
export const OracleFeedTypeSchema = z.enum([
  'ENERGY_PRODUCTION',
  'WEATHER',
  'EQUIPMENT_STATUS',
], {
  errorMap: () => ({
    message: 'Feed type must be one of: ENERGY_PRODUCTION, WEATHER, EQUIPMENT_STATUS',
  }),
});

/**
 * WO-130: Oracle Feed Configuration Schema
 * 
 * Validates feed configuration for creating or updating oracle feeds.
 * 
 * Constraints:
 * - feedAddress: 32-44 characters (Solana public key format)
 * - feedType: ENERGY_PRODUCTION | WEATHER | EQUIPMENT_STATUS
 * - name: 1-100 characters
 * - description: max 500 characters (optional)
 * - updateFrequency: 60-86400 seconds (1 minute to 24 hours)
 * - thresholdValue: positive number (optional)
 */
export const OracleFeedConfigurationSchema = z.object({
  feedAddress: z
    .string()
    .min(32, 'Feed address must be at least 32 characters (Solana public key)')
    .max(44, 'Feed address must not exceed 44 characters (Solana public key)')
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, 'Feed address must be a valid base58 string'),
  
  feedType: OracleFeedTypeSchema,
  
  name: z
    .string()
    .min(1, 'Feed name is required')
    .max(100, 'Feed name must not exceed 100 characters')
    .trim(),
  
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .trim()
    .optional(),
  
  updateFrequency: z
    .number()
    .int('Update frequency must be an integer')
    .min(60, 'Update frequency must be at least 60 seconds (1 minute)')
    .max(86400, 'Update frequency must not exceed 86400 seconds (24 hours)'),
  
  thresholdValue: z
    .number()
    .positive('Threshold value must be positive')
    .optional(),
  
  // Additional optional fields
  aggregatorKey: z
    .string()
    .min(32, 'Aggregator key must be at least 32 characters')
    .max(44, 'Aggregator key must not exceed 44 characters')
    .optional(),
  
  minConfidence: z
    .number()
    .min(0, 'Minimum confidence must be between 0 and 1')
    .max(1, 'Minimum confidence must be between 0 and 1')
    .default(0.8),
  
  maxStaleness: z
    .number()
    .int('Max staleness must be an integer')
    .min(60, 'Max staleness must be at least 60 seconds')
    .max(3600, 'Max staleness must not exceed 3600 seconds (1 hour)')
    .default(300),
});

/**
 * WO-130: Oracle Data Validation Schema
 * 
 * Validates incoming oracle data points for storage and processing.
 * 
 * Constraints:
 * - feedAddress: valid Solana public key string
 * - value: numeric (any valid number)
 * - timestamp: Unix timestamp in milliseconds
 * - signature: valid signature string (optional)
 * - aggregatorRound: string representation of BigInt (optional)
 * - confidence: 0-1 range (data quality score)
 */
export const OracleDataValidationSchema = z.object({
  feedAddress: z
    .string()
    .min(32, 'Feed address must be at least 32 characters')
    .max(44, 'Feed address must not exceed 44 characters')
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, 'Feed address must be a valid base58 string'),
  
  value: z
    .number()
    .finite('Value must be a finite number'),
  
  timestamp: z
    .number()
    .int('Timestamp must be an integer')
    .positive('Timestamp must be positive')
    .refine(
      (ts) => ts > Date.now() - 86400000 && ts <= Date.now() + 60000,
      'Timestamp must be within the last 24 hours and not in the future (>1 minute)'
    ),
  
  signature: z
    .string()
    .min(64, 'Signature must be at least 64 characters')
    .max(128, 'Signature must not exceed 128 characters')
    .optional(),
  
  aggregatorRound: z
    .string()
    .regex(/^\d+$/, 'Aggregator round must be a numeric string')
    .optional(),
  
  confidence: z
    .number()
    .min(0, 'Confidence must be between 0 and 1 (0 = no confidence, 1 = full confidence)')
    .max(1, 'Confidence must be between 0 and 1 (0 = no confidence, 1 = full confidence)'),
  
  // Additional optional fields
  dataSource: z
    .string()
    .max(100, 'Data source must not exceed 100 characters')
    .optional(),
  
  metadata: z
    .record(z.any())
    .optional(),
});

/**
 * WO-130: Oracle Data Point Creation Schema
 * 
 * Schema for creating a new oracle data point with feedId reference
 */
export const OracleDataPointCreationSchema = z.object({
  feedId: z
    .string()
    .cuid('Feed ID must be a valid CUID'),
  
  value: z
    .number()
    .finite('Value must be a finite number'),
  
  confidence: z
    .number()
    .min(0, 'Confidence must be between 0 and 1')
    .max(1, 'Confidence must be between 0 and 1'),
  
  timestamp: z
    .coerce.date()
    .refine(
      (date) => date <= new Date(),
      'Timestamp cannot be in the future'
    ),
  
  signature: z
    .string()
    .min(64, 'Signature must be at least 64 characters')
    .optional(),
  
  aggregatorRound: z
    .bigint()
    .optional(),
  
  dataSource: z
    .string()
    .max(100, 'Data source must not exceed 100 characters')
    .optional(),
  
  metadata: z
    .record(z.any())
    .optional(),
});

/**
 * WO-130: Project Oracle Feed Association Schema
 * 
 * Schema for associating an oracle feed with a project
 */
export const ProjectOracleFeedSchema = z.object({
  projectId: z
    .string()
    .cuid('Project ID must be a valid CUID'),
  
  feedId: z
    .string()
    .cuid('Feed ID must be a valid CUID'),
  
  thresholdValue: z
    .number()
    .positive('Threshold value must be positive')
    .optional(),
  
  isActive: z
    .boolean()
    .default(true),
});

/**
 * WO-130: Oracle Request Schema
 * 
 * Schema for submitting oracle data requests
 */
export const OracleRequestSchema = z.object({
  projectId: z
    .string()
    .cuid('Project ID must be a valid CUID'),
  
  feedAddress: z
    .string()
    .min(32, 'Feed address must be at least 32 characters')
    .max(44, 'Feed address must not exceed 44 characters'),
  
  dataType: OracleFeedTypeSchema,
  
  parameters: z
    .record(z.any())
    .optional(),
  
  webhookUrl: z
    .string()
    .url('Webhook URL must be a valid URL')
    .optional(),
});

/**
 * WO-130: Oracle Verification Request Schema
 * 
 * Schema for milestone verification using oracle data
 */
export const OracleVerificationRequestSchema = z.object({
  milestoneId: z
    .string()
    .cuid('Milestone ID must be a valid CUID'),
  
  projectId: z
    .string()
    .cuid('Project ID must be a valid CUID'),
  
  triggerRelease: z
    .boolean()
    .default(false),
  
  manualOverride: z
    .boolean()
    .default(false),
  
  overrideReason: z
    .string()
    .min(10, 'Override reason must be at least 10 characters')
    .max(500, 'Override reason must not exceed 500 characters')
    .optional(),
});

// Export TypeScript types
export type OracleFeedConfiguration = z.infer<typeof OracleFeedConfigurationSchema>;
export type OracleDataValidation = z.infer<typeof OracleDataValidationSchema>;
export type OracleDataPointCreation = z.infer<typeof OracleDataPointCreationSchema>;
export type ProjectOracleFeedAssociation = z.infer<typeof ProjectOracleFeedSchema>;
export type OracleRequest = z.infer<typeof OracleRequestSchema>;
export type OracleVerificationRequest = z.infer<typeof OracleVerificationRequestSchema>;
export type OracleFeedType = z.infer<typeof OracleFeedTypeSchema>;



