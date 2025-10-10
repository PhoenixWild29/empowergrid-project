/**
 * WO-135: Oracle Timestamp Validation
 * 
 * Validates timestamps to prevent replay attacks and ensure data freshness.
 * 
 * Features:
 * - Timestamp freshness checking
 * - Replay attack prevention
 * - Configurable time windows
 * - Clock drift tolerance
 */

export interface TimestampValidationResult {
  isValid: boolean;
  timestamp: number;
  age: number; // Age in milliseconds
  error?: string;
  validatedAt: Date;
}

/**
 * WO-135: Configuration for timestamp validation
 */
export interface TimestampValidationConfig {
  maxAge?: number; // Maximum age in milliseconds (default: 5 minutes)
  clockDriftTolerance?: number; // Tolerance for future timestamps in ms (default: 60 seconds)
  minAge?: number; // Minimum age in milliseconds (default: 0)
}

const DEFAULT_CONFIG: Required<TimestampValidationConfig> = {
  maxAge: 5 * 60 * 1000, // 5 minutes
  clockDriftTolerance: 60 * 1000, // 60 seconds
  minAge: 0, // No minimum by default
};

/**
 * WO-135: Validate oracle data timestamp
 * 
 * Prevents replay attacks by ensuring timestamps are within acceptable range
 * 
 * @param timestamp - Unix timestamp in milliseconds
 * @param config - Validation configuration
 * @returns Validation result with status and details
 */
export function validateTimestamp(
  timestamp: number,
  config: TimestampValidationConfig = {}
): TimestampValidationResult {
  const validatedAt = new Date();
  const now = Date.now();
  
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  console.log('[WO-135] Validating timestamp:', {
    timestamp,
    now,
    config: finalConfig,
  });

  // Check if timestamp is a valid number
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return {
      isValid: false,
      timestamp,
      age: 0,
      error: 'Timestamp must be a positive number',
      validatedAt,
    };
  }

  // Calculate age
  const age = now - timestamp;

  // Check if timestamp is too far in the future (accounting for clock drift)
  if (age < -finalConfig.clockDriftTolerance) {
    return {
      isValid: false,
      timestamp,
      age,
      error: `Timestamp is too far in the future (${Math.abs(age)}ms ahead, tolerance: ${finalConfig.clockDriftTolerance}ms)`,
      validatedAt,
    };
  }

  // Check if timestamp is too old (stale data)
  if (age > finalConfig.maxAge) {
    return {
      isValid: false,
      timestamp,
      age,
      error: `Timestamp is too old (${age}ms old, maximum: ${finalConfig.maxAge}ms)`,
      validatedAt,
    };
  }

  // Check minimum age (if specified)
  if (age < finalConfig.minAge) {
    return {
      isValid: false,
      timestamp,
      age,
      error: `Timestamp is too recent (${age}ms old, minimum: ${finalConfig.minAge}ms)`,
      validatedAt,
    };
  }

  console.log('[WO-135] Timestamp validation passed:', { age, timestamp });

  return {
    isValid: true,
    timestamp,
    age,
    validatedAt,
  };
}

/**
 * WO-135: Check if timestamp indicates fresh data
 * 
 * @param timestamp - Unix timestamp in milliseconds
 * @param freshnessThreshold - Maximum age for "fresh" data (default: 1 minute)
 * @returns True if data is fresh
 */
export function isDataFresh(
  timestamp: number,
  freshnessThreshold: number = 60 * 1000
): boolean {
  const age = Date.now() - timestamp;
  return age >= 0 && age <= freshnessThreshold;
}

/**
 * WO-135: Validate timestamp sequence to detect replay attacks
 * 
 * Ensures timestamps are monotonically increasing
 * 
 * @param timestamps - Array of timestamps to validate
 * @returns Validation result with detected anomalies
 */
export function validateTimestampSequence(
  timestamps: number[]
): {
  isValid: boolean;
  duplicates: number[];
  outOfOrder: number[];
  gaps: Array<{ index: number; gapSize: number }>;
} {
  console.log('[WO-135] Validating timestamp sequence:', timestamps.length);

  const duplicates: number[] = [];
  const outOfOrder: number[] = [];
  const gaps: Array<{ index: number; gapSize: number }> = [];

  const seen = new Set<number>();

  for (let i = 0; i < timestamps.length; i++) {
    const current = timestamps[i];

    // Check for duplicates
    if (seen.has(current)) {
      duplicates.push(i);
    }
    seen.add(current);

    // Check for out-of-order timestamps
    if (i > 0) {
      const previous = timestamps[i - 1];
      
      if (current < previous) {
        outOfOrder.push(i);
      }

      // Check for large gaps (potential missing data)
      const gap = current - previous;
      const expectedGap = 60 * 1000; // Expected 1 minute between readings
      
      if (gap > expectedGap * 2) {
        gaps.push({ index: i, gapSize: gap });
      }
    }
  }

  const isValid = duplicates.length === 0 && outOfOrder.length === 0;

  console.log('[WO-135] Timestamp sequence validation:', {
    isValid,
    duplicates: duplicates.length,
    outOfOrder: outOfOrder.length,
    gaps: gaps.length,
  });

  return {
    isValid,
    duplicates,
    outOfOrder,
    gaps,
  };
}

/**
 * WO-135: Calculate timestamp jitter (clock drift)
 * 
 * Measures consistency of timestamp intervals
 */
export function calculateTimestampJitter(timestamps: number[]): {
  averageInterval: number;
  jitter: number;
  coefficient: number;
} {
  if (timestamps.length < 2) {
    return { averageInterval: 0, jitter: 0, coefficient: 0 };
  }

  const intervals: number[] = [];
  for (let i = 1; i < timestamps.length; i++) {
    intervals.push(timestamps[i] - timestamps[i - 1]);
  }

  const averageInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
  
  const variance = intervals.reduce(
    (sum, interval) => sum + Math.pow(interval - averageInterval, 2),
    0
  ) / intervals.length;
  
  const jitter = Math.sqrt(variance);
  const coefficient = averageInterval !== 0 ? jitter / averageInterval : 0;

  return {
    averageInterval,
    jitter,
    coefficient,
  };
}



