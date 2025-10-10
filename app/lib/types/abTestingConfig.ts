/**
 * WO-145: A/B Testing Configuration Data Structure
 * 
 * TypeScript interfaces for A/B testing configuration,
 * including test group definitions, traffic splitting,
 * and performance comparison metrics.
 */

/**
 * WO-145: A/B Test Configuration
 */
export interface ABTestConfig {
  testId: string;
  name: string;
  description: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  startDate: Date;
  endDate?: Date;
  testGroups: TestGroup[];
  trafficSplitting: TrafficSplitting;
  performanceMetrics: PerformanceMetric[];
  winningCriteria: WinningCriteria;
}

/**
 * WO-145: Test Group Definition
 */
export interface TestGroup {
  groupId: string;
  name: string;
  algorithmId: string;
  algorithmVersion: string;
  trafficPercentage: number; // 0-100
  isControl: boolean;
}

/**
 * WO-145: Traffic Splitting Parameters
 */
export interface TrafficSplitting {
  method: 'RANDOM' | 'USER_ID_HASH' | 'PROJECT_ID_HASH' | 'GEOGRAPHIC';
  seedValue?: string;
  stickySession: boolean; // Keep users in same group
  rolloutPercentage: number; // % of total traffic in test
}

/**
 * WO-145: Performance Metric Definition
 */
export interface PerformanceMetric {
  metricId: string;
  name: string;
  type: 'ACCURACY' | 'CONFIDENCE' | 'PROCESSING_TIME' | 'ERROR_RATE' | 'USER_SATISFACTION';
  aggregation: 'MEAN' | 'MEDIAN' | 'P95' | 'P99' | 'SUM' | 'COUNT';
  weight: number; // Importance weight (0-1)
}

/**
 * WO-145: Winning Criteria
 */
export interface WinningCriteria {
  minimumSampleSize: number;
  statisticalSignificance: number; // p-value threshold
  minimumLift: number; // Minimum improvement percentage
  evaluationPeriod: number; // Days
}

/**
 * WO-145: A/B Test Results
 */
export interface ABTestResults {
  testId: string;
  groupResults: GroupResult[];
  overallAnalysis: {
    winningGroup?: string;
    statisticalSignificance: boolean;
    confidence: number;
    recommendation: 'DEPLOY' | 'CONTINUE_TESTING' | 'ABORT';
  };
}

/**
 * WO-145: Group Result
 */
export interface GroupResult {
  groupId: string;
  sampleSize: number;
  metrics: Record<string, number>;
  performanceScore: number;
}



