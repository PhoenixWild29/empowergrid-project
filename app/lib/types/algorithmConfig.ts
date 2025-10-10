/**
 * WO-145: Algorithm Configuration Data Structure
 * 
 * Core TypeScript interfaces for algorithm configuration parameters,
 * including threshold values, confidence requirements, data quality minimums,
 * and anomaly detection settings.
 * 
 * Features:
 * - Extensible configuration structure
 * - Type-safe parameters
 * - Support for multiple algorithm types
 * - JSON serialization compatibility
 */

/**
 * WO-145: Base Algorithm Configuration
 * 
 * All algorithm configurations extend this base interface
 */
export interface AlgorithmConfig {
  algorithmId: string;
  algorithmType: AlgorithmType;
  version: string;
  name: string;
  description?: string;
  isActive: boolean;
  parameters: AlgorithmParameters;
  metadata?: Record<string, any>;
}

/**
 * WO-145: Algorithm Type Enum
 */
export enum AlgorithmType {
  THRESHOLD_BASED = 'THRESHOLD_BASED',
  STATISTICAL_ANALYSIS = 'STATISTICAL_ANALYSIS',
  MACHINE_LEARNING = 'MACHINE_LEARNING',
  CONSENSUS_BASED = 'CONSENSUS_BASED',
  HYBRID = 'HYBRID',
}

/**
 * WO-145: Base Algorithm Parameters
 * 
 * All algorithm parameter types extend this base interface
 */
export interface AlgorithmParameters {
  // Common parameters for all algorithms
  confidenceRequirement: number; // 0-1 range
  dataQualityMinimum: number; // 0-1 range
  anomalyDetectionSensitivity: AnomalyDetectionSensitivity;
  
  // Optional common parameters
  timeoutMs?: number;
  retryAttempts?: number;
  logLevel?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
}

/**
 * WO-145: Threshold-Based Algorithm Parameters
 */
export interface ThresholdBasedParameters extends AlgorithmParameters {
  thresholdValues: {
    min?: number;
    max?: number;
    target: number;
    tolerance: number; // Percentage tolerance (e.g., 0.05 for 5%)
  };
  comparisonOperator: 'GREATER_THAN' | 'LESS_THAN' | 'EQUAL_TO' | 'WITHIN_RANGE';
  multipleThresholds?: Array<{
    metric: string;
    threshold: number;
    weight: number;
  }>;
}

/**
 * WO-145: Statistical Analysis Algorithm Parameters
 */
export interface StatisticalAnalysisParameters extends AlgorithmParameters {
  statisticalMethods: Array<'MEAN' | 'MEDIAN' | 'MODE' | 'STD_DEV' | 'VARIANCE' | 'CORRELATION'>;
  outlierDetection: {
    method: 'Z_SCORE' | 'IQR' | 'ISOLATION_FOREST';
    threshold: number;
    action: 'REMOVE' | 'FLAG' | 'REPLACE';
  };
  sampleSize: {
    minimum: number;
    optimal: number;
  };
  confidenceInterval: number; // e.g., 0.95 for 95% CI
  normalityTest?: boolean;
}

/**
 * WO-145: Machine Learning Algorithm Parameters
 */
export interface MachineLearningParameters extends AlgorithmParameters {
  modelType: 'REGRESSION' | 'CLASSIFICATION' | 'CLUSTERING' | 'NEURAL_NETWORK';
  modelPath?: string;
  features: string[];
  targetVariable: string;
  hyperparameters: Record<string, any>;
  trainingDataSize?: number;
  predictionThreshold: number;
  retrainingFrequency?: 'NEVER' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

/**
 * WO-145: Consensus-Based Algorithm Parameters
 */
export interface ConsensusBasedParameters extends AlgorithmParameters {
  minimumNodes: number;
  consensusThreshold: number; // e.g., 0.66 for 66% consensus
  weightedVoting: boolean;
  nodeWeights?: Record<string, number>;
  disagreementHandling: 'REJECT' | 'MANUAL_REVIEW' | 'USE_MAJORITY';
  consensusAlgorithm: 'SIMPLE_MAJORITY' | 'WEIGHTED_AVERAGE' | 'BYZANTINE_FAULT_TOLERANT';
}

/**
 * WO-145: Hybrid Algorithm Parameters
 */
export interface HybridParameters extends AlgorithmParameters {
  primaryAlgorithm: AlgorithmType;
  fallbackAlgorithms: AlgorithmType[];
  switchingCriteria: {
    conditionType: 'CONFIDENCE' | 'DATA_QUALITY' | 'TIME' | 'CUSTOM';
    threshold: number;
    comparisonOperator: string;
  };
  combinationStrategy: 'CASCADE' | 'PARALLEL' | 'WEIGHTED_AVERAGE';
  weights?: Record<AlgorithmType, number>;
}

/**
 * WO-145: Anomaly Detection Sensitivity Settings
 */
export interface AnomalyDetectionSensitivity {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CUSTOM';
  customThreshold?: number;
  detectionMethods: Array<'STATISTICAL' | 'PATTERN' | 'MACHINE_LEARNING'>;
  responseAction: 'LOG' | 'ALERT' | 'REJECT' | 'MANUAL_REVIEW';
}

/**
 * WO-145: Algorithm Performance Metrics
 */
export interface AlgorithmPerformanceMetrics {
  algorithmId: string;
  version: string;
  executionCount: number;
  averageExecutionTime: number; // milliseconds
  successRate: number; // 0-1 range
  averageConfidence: number; // 0-1 range
  lastExecuted?: Date;
  errorCount: number;
  lastError?: {
    message: string;
    timestamp: Date;
  };
}

/**
 * WO-145: Algorithm Execution Context
 * 
 * Context information for algorithm execution
 */
export interface AlgorithmExecutionContext {
  milestoneId: string;
  projectId: string;
  algorithmConfig: AlgorithmConfig;
  dataPoints: any[];
  timestamp: Date;
  triggeredBy: string;
  executionMode: 'AUTOMATIC' | 'MANUAL' | 'SCHEDULED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

/**
 * WO-145: Algorithm Execution Result
 * 
 * Result of algorithm execution
 */
export interface AlgorithmExecutionResult {
  success: boolean;
  verificationResult: 'VERIFIED' | 'FAILED' | 'PENDING' | 'DISPUTED';
  confidenceScore: number;
  processingTime: number; // milliseconds
  dataQuality: number;
  anomaliesDetected: Array<{
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
  }>;
  intermediateResults?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
}

/**
 * WO-145: Type guard to check if config is threshold-based
 */
export function isThresholdBasedConfig(
  params: AlgorithmParameters
): params is ThresholdBasedParameters {
  return 'thresholdValues' in params;
}

/**
 * WO-145: Type guard to check if config is statistical
 */
export function isStatisticalAnalysisConfig(
  params: AlgorithmParameters
): params is StatisticalAnalysisParameters {
  return 'statisticalMethods' in params;
}

/**
 * WO-145: Type guard to check if config is ML-based
 */
export function isMachineLearningConfig(
  params: AlgorithmParameters
): params is MachineLearningParameters {
  return 'modelType' in params;
}

/**
 * WO-145: Type guard to check if config is consensus-based
 */
export function isConsensusBasedConfig(
  params: AlgorithmParameters
): params is ConsensusBasedParameters {
  return 'minimumNodes' in params;
}

/**
 * WO-145: Type guard to check if config is hybrid
 */
export function isHybridConfig(
  params: AlgorithmParameters
): params is HybridParameters {
  return 'primaryAlgorithm' in params;
}



