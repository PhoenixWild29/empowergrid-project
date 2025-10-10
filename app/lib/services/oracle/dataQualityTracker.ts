/**
 * WO-135: Oracle Data Quality Tracking
 * 
 * Monitors oracle feed performance, tracks failure rates,
 * and detects data anomalies for quality assurance.
 * 
 * Features:
 * - Feed performance monitoring
 * - Failure rate tracking
 * - Anomaly detection
 * - Quality metrics calculation
 * - Historical trend analysis
 */

export interface FeedPerformanceMetrics {
  feedId: string;
  feedAddress: string;
  uptime: number; // Percentage
  successRate: number; // Percentage
  avgResponseTime: number; // Milliseconds
  failureCount: number;
  totalRequests: number;
  lastUpdate: Date;
  dataQuality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
}

export interface DataAnomaly {
  type: 'OUTLIER' | 'MISSING_DATA' | 'STALE_DATA' | 'INCONSISTENT_DATA';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  feedId: string;
  timestamp: Date;
  description: string;
  value?: number;
  expectedValue?: number;
}

/**
 * WO-135: Track oracle feed performance metrics
 */
export class DataQualityTracker {
  private performanceCache: Map<string, FeedPerformanceMetrics> = new Map();
  private anomalyHistory: DataAnomaly[] = [];

  /**
   * Record a successful oracle data fetch
   */
  recordSuccess(
    feedId: string,
    feedAddress: string,
    responseTime: number
  ): void {
    console.log('[WO-135] Recording successful fetch:', feedId);

    const metrics = this.getOrCreateMetrics(feedId, feedAddress);
    
    metrics.totalRequests++;
    metrics.avgResponseTime = 
      (metrics.avgResponseTime * (metrics.totalRequests - 1) + responseTime) / metrics.totalRequests;
    metrics.lastUpdate = new Date();
    
    this.updateQualityRating(metrics);
    this.performanceCache.set(feedId, metrics);
  }

  /**
   * Record a failed oracle data fetch
   */
  recordFailure(
    feedId: string,
    feedAddress: string,
    error: string
  ): void {
    console.error('[WO-135] Recording failed fetch:', feedId, error);

    const metrics = this.getOrCreateMetrics(feedId, feedAddress);
    
    metrics.totalRequests++;
    metrics.failureCount++;
    metrics.lastUpdate = new Date();
    
    this.updateQualityRating(metrics);
    this.performanceCache.set(feedId, metrics);

    // Create anomaly record
    this.recordAnomaly({
      type: 'MISSING_DATA',
      severity: this.calculateFailureSeverity(metrics.failureCount, metrics.totalRequests),
      feedId,
      timestamp: new Date(),
      description: `Failed to fetch data: ${error}`,
    });
  }

  /**
   * Detect data anomalies in a value
   */
  detectAnomaly(
    feedId: string,
    value: number,
    historicalValues: number[],
    threshold: number = 3 // Standard deviations
  ): DataAnomaly | null {
    if (historicalValues.length < 10) {
      // Not enough data for anomaly detection
      return null;
    }

    const mean = historicalValues.reduce((sum, v) => sum + v, 0) / historicalValues.length;
    const variance = historicalValues.reduce(
      (sum, v) => sum + Math.pow(v - mean, 2),
      0
    ) / historicalValues.length;
    const stdDev = Math.sqrt(variance);

    // Check if value is an outlier
    const zScore = Math.abs((value - mean) / stdDev);
    
    if (zScore > threshold) {
      const anomaly: DataAnomaly = {
        type: 'OUTLIER',
        severity: zScore > 5 ? 'CRITICAL' :
                  zScore > 4 ? 'HIGH' :
                  zScore > 3 ? 'MEDIUM' : 'LOW',
        feedId,
        timestamp: new Date(),
        description: `Value ${value} is ${zScore.toFixed(2)} standard deviations from mean (${mean.toFixed(2)})`,
        value,
        expectedValue: mean,
      };

      this.recordAnomaly(anomaly);
      return anomaly;
    }

    return null;
  }

  /**
   * Check for stale data
   */
  checkStaleness(
    feedId: string,
    lastUpdate: Date,
    maxStaleness: number // milliseconds
  ): DataAnomaly | null {
    const age = Date.now() - lastUpdate.getTime();

    if (age > maxStaleness) {
      const anomaly: DataAnomaly = {
        type: 'STALE_DATA',
        severity: age > maxStaleness * 3 ? 'CRITICAL' :
                  age > maxStaleness * 2 ? 'HIGH' :
                  age > maxStaleness * 1.5 ? 'MEDIUM' : 'LOW',
        feedId,
        timestamp: new Date(),
        description: `Data is ${Math.round(age / 1000)}s old (max: ${Math.round(maxStaleness / 1000)}s)`,
      };

      this.recordAnomaly(anomaly);
      return anomaly;
    }

    return null;
  }

  /**
   * Check data consistency across multiple sources
   */
  checkConsistency(
    feedId: string,
    values: number[],
    maxVariation: number = 0.15 // 15% variation
  ): DataAnomaly | null {
    if (values.length < 2) return null;

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const maxDeviation = Math.max(...values.map(v => Math.abs(v - mean) / mean));

    if (maxDeviation > maxVariation) {
      const anomaly: DataAnomaly = {
        type: 'INCONSISTENT_DATA',
        severity: maxDeviation > maxVariation * 2 ? 'HIGH' :
                  maxDeviation > maxVariation * 1.5 ? 'MEDIUM' : 'LOW',
        feedId,
        timestamp: new Date(),
        description: `Data inconsistency: ${(maxDeviation * 100).toFixed(1)}% deviation (max: ${(maxVariation * 100).toFixed(1)}%)`,
      };

      this.recordAnomaly(anomaly);
      return anomaly;
    }

    return null;
  }

  /**
   * Get performance metrics for a feed
   */
  getMetrics(feedId: string): FeedPerformanceMetrics | undefined {
    return this.performanceCache.get(feedId);
  }

  /**
   * Get all anomalies for a feed
   */
  getAnomalies(feedId: string, limit: number = 100): DataAnomaly[] {
    return this.anomalyHistory
      .filter(a => a.feedId === feedId)
      .slice(0, limit);
  }

  /**
   * Get recent anomalies across all feeds
   */
  getRecentAnomalies(limit: number = 100): DataAnomaly[] {
    return this.anomalyHistory.slice(0, limit);
  }

  /**
   * Get anomaly count by severity
   */
  getAnomalySummary(feedId?: string): {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  } {
    const anomalies = feedId
      ? this.anomalyHistory.filter(a => a.feedId === feedId)
      : this.anomalyHistory;

    return {
      total: anomalies.length,
      critical: anomalies.filter(a => a.severity === 'CRITICAL').length,
      high: anomalies.filter(a => a.severity === 'HIGH').length,
      medium: anomalies.filter(a => a.severity === 'MEDIUM').length,
      low: anomalies.filter(a => a.severity === 'LOW').length,
    };
  }

  /**
   * Clear old anomalies (keep last 1000)
   */
  cleanupAnomalies(): void {
    if (this.anomalyHistory.length > 1000) {
      this.anomalyHistory = this.anomalyHistory.slice(0, 1000);
      console.log('[WO-135] Cleaned up old anomalies');
    }
  }

  // Private helper methods

  private getOrCreateMetrics(
    feedId: string,
    feedAddress: string
  ): FeedPerformanceMetrics {
    let metrics = this.performanceCache.get(feedId);

    if (!metrics) {
      metrics = {
        feedId,
        feedAddress,
        uptime: 100,
        successRate: 100,
        avgResponseTime: 0,
        failureCount: 0,
        totalRequests: 0,
        lastUpdate: new Date(),
        dataQuality: 'EXCELLENT',
      };
    }

    return metrics;
  }

  private updateQualityRating(metrics: FeedPerformanceMetrics): void {
    metrics.successRate = metrics.totalRequests > 0
      ? ((metrics.totalRequests - metrics.failureCount) / metrics.totalRequests) * 100
      : 100;

    // Calculate uptime based on success rate and response time
    const responseScore = metrics.avgResponseTime < 1000 ? 1.0 :
                         metrics.avgResponseTime < 3000 ? 0.9 :
                         metrics.avgResponseTime < 5000 ? 0.7 : 0.5;
    
    metrics.uptime = metrics.successRate * responseScore;

    // Determine overall quality rating
    if (metrics.successRate >= 99 && metrics.avgResponseTime < 1000) {
      metrics.dataQuality = 'EXCELLENT';
    } else if (metrics.successRate >= 95 && metrics.avgResponseTime < 3000) {
      metrics.dataQuality = 'GOOD';
    } else if (metrics.successRate >= 90 && metrics.avgResponseTime < 5000) {
      metrics.dataQuality = 'FAIR';
    } else {
      metrics.dataQuality = 'POOR';
    }
  }

  private calculateFailureSeverity(
    failureCount: number,
    totalRequests: number
  ): DataAnomaly['severity'] {
    const failureRate = failureCount / totalRequests;

    if (failureRate > 0.5) return 'CRITICAL';
    if (failureRate > 0.2) return 'HIGH';
    if (failureRate > 0.1) return 'MEDIUM';
    return 'LOW';
  }

  private recordAnomaly(anomaly: DataAnomaly): void {
    console.warn('[WO-135] Anomaly detected:', anomaly);
    
    // Add to beginning of array (most recent first)
    this.anomalyHistory.unshift(anomaly);
    
    // Keep only last 1000 anomalies
    if (this.anomalyHistory.length > 1000) {
      this.anomalyHistory = this.anomalyHistory.slice(0, 1000);
    }
  }
}

// Singleton instance
export const dataQualityTracker = new DataQualityTracker();



