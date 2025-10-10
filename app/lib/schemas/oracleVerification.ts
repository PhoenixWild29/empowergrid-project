/**
 * Oracle Verification Data Models
 * 
 * WO-104: TypeScript data models for oracle verification integration
 * 
 * Features:
 * - Zod schema validation for oracle data
 * - Type-safe validation for Switchboard oracle feeds
 * - JSON serialization support
 * - Positive number validation for energy production
 */

import { z } from 'zod';

// WO-104: OracleVerification Schema
export const OracleVerificationSchema = z.object({
  milestoneId: z.string()
    .min(1, 'Milestone ID is required')
    .describe('Unique identifier for the milestone being verified'),
  
  energyProduced: z.number()
    .positive('Energy produced must be a positive number')
    .describe('Energy production in kWh'),
  
  verificationTimestamp: z.number()
    .int('Verification timestamp must be an integer')
    .positive('Verification timestamp must be positive')
    .describe('Unix timestamp of verification'),
  
  oracleSignature: z.string()
    .min(1, 'Oracle signature is required')
    .describe('Cryptographic signature from the oracle'),
  
  switchboardFeedAddress: z.string()
    .min(32, 'Switchboard feed address must be valid')
    .describe('Solana address of the Switchboard feed'),
});

// WO-104: TypeScript type derived from schema
export type OracleVerification = z.infer<typeof OracleVerificationSchema>;

// WO-104: Extended schema with optional fields for API responses
export const OracleVerificationResponseSchema = OracleVerificationSchema.extend({
  id: z.string().optional().describe('Database record ID'),
  createdAt: z.string().optional().describe('ISO timestamp of record creation'),
  confidence: z.number()
    .min(0)
    .max(1)
    .optional()
    .describe('Oracle confidence score (0-1)'),
  dataSource: z.string().optional().describe('Name of the data source'),
});

export type OracleVerificationResponse = z.infer<typeof OracleVerificationResponseSchema>;

// WO-104: Batch verification schema for multiple milestones
export const BatchOracleVerificationSchema = z.object({
  verifications: z.array(OracleVerificationSchema)
    .min(1, 'At least one verification is required')
    .max(50, 'Maximum 50 verifications per batch'),
  
  batchTimestamp: z.number()
    .int()
    .positive()
    .describe('Timestamp when batch was created'),
  
  batchSignature: z.string()
    .min(1, 'Batch signature is required')
    .describe('Aggregated signature for the entire batch'),
});

export type BatchOracleVerification = z.infer<typeof BatchOracleVerificationSchema>;

// WO-104: Validation helper functions
export function validateOracleVerification(data: unknown): OracleVerification {
  return OracleVerificationSchema.parse(data);
}

export function validateBatchOracleVerification(data: unknown): BatchOracleVerification {
  return BatchOracleVerificationSchema.parse(data);
}

// WO-104: Safe validation with error handling
export function safeValidateOracleVerification(
  data: unknown
): { success: true; data: OracleVerification } | { success: false; error: z.ZodError } {
  const result = OracleVerificationSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

// WO-104: Verification status enum for tracking
export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
  DISPUTED = 'DISPUTED',
}

// WO-104: Complete verification record with status
export const OracleVerificationRecordSchema = OracleVerificationResponseSchema.extend({
  status: z.nativeEnum(VerificationStatus)
    .default(VerificationStatus.PENDING)
    .describe('Current status of the verification'),
  
  verifiedBy: z.string().optional().describe('User ID who verified'),
  verifiedAt: z.string().optional().describe('ISO timestamp of verification'),
  failureReason: z.string().optional().describe('Reason for verification failure'),
  disputeReason: z.string().optional().describe('Reason for dispute'),
});

export type OracleVerificationRecord = z.infer<typeof OracleVerificationRecordSchema>;

// WO-104: Switchboard-specific configuration
export const SwitchboardConfigSchema = z.object({
  programId: z.string()
    .min(32, 'Program ID must be valid')
    .describe('Switchboard program ID on Solana'),
  
  aggregatorAddress: z.string()
    .min(32, 'Aggregator address must be valid')
    .describe('Switchboard aggregator account address'),
  
  updateInterval: z.number()
    .int()
    .positive()
    .describe('Update interval in seconds'),
  
  minConfidence: z.number()
    .min(0)
    .max(1)
    .default(0.8)
    .describe('Minimum confidence threshold (0-1)'),
  
  maxStaleness: z.number()
    .int()
    .positive()
    .default(300)
    .describe('Maximum age of data in seconds before considered stale'),
});

export type SwitchboardConfig = z.infer<typeof SwitchboardConfigSchema>;

// WO-104: Oracle data quality metrics
export const OracleDataQualitySchema = z.object({
  confidence: z.number().min(0).max(1).describe('Data confidence score'),
  staleness: z.number().int().nonnegative().describe('Age of data in seconds'),
  sourceCount: z.number().int().positive().describe('Number of data sources'),
  consensusReached: z.boolean().describe('Whether consensus was reached'),
  lastUpdate: z.number().int().positive().describe('Unix timestamp of last update'),
});

export type OracleDataQuality = z.infer<typeof OracleDataQualitySchema>;

// WO-104: Complete oracle feed data with quality metrics
export const OracleFeedDataSchema = z.object({
  verification: OracleVerificationSchema,
  quality: OracleDataQualitySchema,
  switchboardConfig: SwitchboardConfigSchema,
  metadata: z.record(z.unknown()).optional().describe('Additional metadata'),
});

export type OracleFeedData = z.infer<typeof OracleFeedDataSchema>;



