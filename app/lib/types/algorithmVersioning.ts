/**
 * WO-145: Algorithm Versioning Data Structure
 * 
 * TypeScript interfaces and types for algorithm versioning,
 * supporting version tracking, backward compatibility, and
 * reproducible verification results.
 */

import { AlgorithmConfig } from './algorithmConfig';

/**
 * WO-145: Algorithm Version Info
 */
export interface AlgorithmVersion {
  algorithmId: string;
  version: string;
  releaseDate: Date;
  config: AlgorithmConfig;
  changelog: string;
  isActive: boolean;
  isDeprecated: boolean;
  deprecationDate?: Date;
  backwardCompatible: boolean;
  migrationPath?: string; // Path to migration guide
}

/**
 * WO-145: Version Compatibility Matrix
 */
export interface VersionCompatibility {
  currentVersion: string;
  compatibleVersions: string[];
  breakingChanges: string[];
  migrationRequired: boolean;
}

/**
 * WO-145: Reproducible Verification Record
 */
export interface ReproducibleVerificationRecord {
  verificationId: string;
  milestoneId: string;
  algorithmId: string;
  algorithmVersion: string;
  configSnapshot: AlgorithmConfig;
  dataSnapshot: any[];
  result: any;
  timestamp: Date;
  checksumHash: string; // For data integrity
}



