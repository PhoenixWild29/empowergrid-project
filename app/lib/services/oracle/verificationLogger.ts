/**
 * WO-135: Oracle Verification Logger
 * 
 * Comprehensive logging for all verification attempts including
 * success/failure status, error details, and performance metrics.
 * 
 * Features:
 * - Structured logging
 * - Performance metrics
 * - Error tracking
 * - Audit trail
 */

export interface VerificationLog {
  id: string;
  timestamp: Date;
  operation: 'SIGNATURE_VERIFY' | 'TIMESTAMP_VALIDATE' | 'CONFIDENCE_CALC' | 'QUALITY_CHECK';
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
  feedId?: string;
  feedAddress?: string;
  duration: number; // milliseconds
  details: any;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * WO-135: Verification Logger
 */
export class VerificationLogger {
  private logs: VerificationLog[] = [];
  private performanceMetrics: Map<string, number[]> = new Map();

  /**
   * Log verification attempt
   */
  log(entry: Omit<VerificationLog, 'id' | 'timestamp'>): VerificationLog {
    const log: VerificationLog = {
      id: this.generateLogId(),
      timestamp: new Date(),
      ...entry,
    };

    this.logs.unshift(log); // Most recent first

    // Keep only last 10,000 logs
    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(0, 10000);
    }

    // Track performance metrics
    this.trackPerformance(log.operation, log.duration);

    // Log to console
    this.consoleLog(log);

    return log;
  }

  /**
   * Log successful verification
   */
  logSuccess(
    operation: VerificationLog['operation'],
    duration: number,
    details: any,
    feedId?: string,
    feedAddress?: string
  ): VerificationLog {
    return this.log({
      operation,
      status: 'SUCCESS',
      feedId,
      feedAddress,
      duration,
      details,
    });
  }

  /**
   * Log failed verification
   */
  logFailure(
    operation: VerificationLog['operation'],
    duration: number,
    error: string,
    details: any,
    feedId?: string,
    feedAddress?: string
  ): VerificationLog {
    return this.log({
      operation,
      status: 'FAILURE',
      feedId,
      feedAddress,
      duration,
      details,
      error,
    });
  }

  /**
   * Log warning
   */
  logWarning(
    operation: VerificationLog['operation'],
    duration: number,
    message: string,
    details: any,
    feedId?: string,
    feedAddress?: string
  ): VerificationLog {
    return this.log({
      operation,
      status: 'WARNING',
      feedId,
      feedAddress,
      duration,
      details,
      error: message,
    });
  }

  /**
   * Get logs with optional filtering
   */
  getLogs(filter?: {
    operation?: VerificationLog['operation'];
    status?: VerificationLog['status'];
    feedId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): VerificationLog[] {
    let filtered = [...this.logs];

    if (filter) {
      if (filter.operation) {
        filtered = filtered.filter(l => l.operation === filter.operation);
      }
      if (filter.status) {
        filtered = filtered.filter(l => l.status === filter.status);
      }
      if (filter.feedId) {
        filtered = filtered.filter(l => l.feedId === filter.feedId);
      }
      if (filter.startDate) {
        filtered = filtered.filter(l => l.timestamp >= filter.startDate!);
      }
      if (filter.endDate) {
        filtered = filtered.filter(l => l.timestamp <= filter.endDate!);
      }
      if (filter.limit) {
        filtered = filtered.slice(0, filter.limit);
      }
    }

    return filtered;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(operation?: VerificationLog['operation']): {
    operation: string;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    p50Duration: number;
    p95Duration: number;
    p99Duration: number;
    sampleCount: number;
  }[] {
    const operations = operation
      ? [operation]
      : ['SIGNATURE_VERIFY', 'TIMESTAMP_VALIDATE', 'CONFIDENCE_CALC', 'QUALITY_CHECK'] as const;

    return operations.map(op => {
      const durations = this.performanceMetrics.get(op) || [];
      
      if (durations.length === 0) {
        return {
          operation: op,
          avgDuration: 0,
          minDuration: 0,
          maxDuration: 0,
          p50Duration: 0,
          p95Duration: 0,
          p99Duration: 0,
          sampleCount: 0,
        };
      }

      const sorted = [...durations].sort((a, b) => a - b);
      const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;

      return {
        operation: op,
        avgDuration: Math.round(avg * 100) / 100,
        minDuration: sorted[0],
        maxDuration: sorted[sorted.length - 1],
        p50Duration: sorted[Math.floor(sorted.length * 0.5)],
        p95Duration: sorted[Math.floor(sorted.length * 0.95)],
        p99Duration: sorted[Math.floor(sorted.length * 0.99)],
        sampleCount: durations.length,
      };
    });
  }

  /**
   * Get summary statistics
   */
  getSummary(feedId?: string): {
    total: number;
    successful: number;
    failed: number;
    warnings: number;
    successRate: number;
    avgDuration: number;
    byOperation: Record<VerificationLog['operation'], {
      total: number;
      successful: number;
      failed: number;
    }>;
  } {
    const logs = feedId
      ? this.logs.filter(l => l.feedId === feedId)
      : this.logs;

    const byOperation: Record<VerificationLog['operation'], {
      total: number;
      successful: number;
      failed: number;
    }> = {
      SIGNATURE_VERIFY: { total: 0, successful: 0, failed: 0 },
      TIMESTAMP_VALIDATE: { total: 0, successful: 0, failed: 0 },
      CONFIDENCE_CALC: { total: 0, successful: 0, failed: 0 },
      QUALITY_CHECK: { total: 0, successful: 0, failed: 0 },
    };

    let totalDuration = 0;

    logs.forEach(log => {
      byOperation[log.operation].total++;
      if (log.status === 'SUCCESS') {
        byOperation[log.operation].successful++;
      } else if (log.status === 'FAILURE') {
        byOperation[log.operation].failed++;
      }
      totalDuration += log.duration;
    });

    const successful = logs.filter(l => l.status === 'SUCCESS').length;
    const failed = logs.filter(l => l.status === 'FAILURE').length;
    const warnings = logs.filter(l => l.status === 'WARNING').length;

    return {
      total: logs.length,
      successful,
      failed,
      warnings,
      successRate: logs.length > 0 ? (successful / logs.length) * 100 : 0,
      avgDuration: logs.length > 0 ? totalDuration / logs.length : 0,
      byOperation,
    };
  }

  /**
   * Clear old logs
   */
  clearOldLogs(olderThan: number = 7 * 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - olderThan;
    const originalLength = this.logs.length;

    this.logs = this.logs.filter(l => l.timestamp.getTime() > cutoff);

    console.log('[WO-135] Cleared', originalLength - this.logs.length, 'old logs');
  }

  // Private helper methods

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private trackPerformance(operation: string, duration: number): void {
    let durations = this.performanceMetrics.get(operation);

    if (!durations) {
      durations = [];
      this.performanceMetrics.set(operation, durations);
    }

    durations.push(duration);

    // Keep only last 1000 measurements per operation
    if (durations.length > 1000) {
      durations.shift();
    }
  }

  private consoleLog(log: VerificationLog): void {
    const level = log.status === 'FAILURE' ? 'error' :
                  log.status === 'WARNING' ? 'warn' : 'log';

    console[level]('[WO-135] Verification:', {
      id: log.id,
      operation: log.operation,
      status: log.status,
      duration: `${log.duration}ms`,
      feedId: log.feedId,
      error: log.error,
      timestamp: log.timestamp.toISOString(),
    });
  }
}

// Singleton instance
export const verificationLogger = new VerificationLogger();



