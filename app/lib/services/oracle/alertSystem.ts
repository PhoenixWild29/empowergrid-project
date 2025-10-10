/**
 * WO-135: Oracle Alert System
 * 
 * Automated alert system that triggers notifications when oracle feeds fail
 * or data anomalies are detected beyond acceptable thresholds.
 * 
 * Features:
 * - Threshold-based alerting
 * - Multi-channel notifications (console, database, webhooks)
 * - Alert rate limiting
 * - Alert history tracking
 */

import { DataAnomaly } from './dataQualityTracker';

export interface Alert {
  id: string;
  type: 'FEED_FAILURE' | 'DATA_ANOMALY' | 'PERFORMANCE_DEGRADATION' | 'CRITICAL_ERROR';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  feedId?: string;
  message: string;
  details: any;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export interface AlertThresholds {
  failureRateThreshold: number; // Percentage
  responseTimeThreshold: number; // Milliseconds
  stalenessThreshold: number; // Milliseconds
  anomalyCountThreshold: number; // Count per hour
}

const DEFAULT_THRESHOLDS: AlertThresholds = {
  failureRateThreshold: 10, // 10% failure rate
  responseTimeThreshold: 5000, // 5 seconds
  stalenessThreshold: 600000, // 10 minutes
  anomalyCountThreshold: 5, // 5 anomalies per hour
};

/**
 * WO-135: Oracle Alert System
 */
export class OracleAlertSystem {
  private alerts: Alert[] = [];
  private alertCounts: Map<string, number> = new Map(); // For rate limiting
  private thresholds: AlertThresholds;

  constructor(thresholds: Partial<AlertThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  /**
   * Trigger alert for oracle feed failure
   */
  triggerFeedFailureAlert(
    feedId: string,
    feedAddress: string,
    error: string,
    failureRate: number
  ): Alert | null {
    console.log('[WO-135] Checking feed failure alert:', feedId, failureRate);

    // Check if failure rate exceeds threshold
    if (failureRate < this.thresholds.failureRateThreshold) {
      return null;
    }

    // Rate limit: Don't send alert if we sent one recently
    if (this.isRateLimited(`feed_failure_${feedId}`, 300000)) { // 5 minutes
      console.log('[WO-135] Alert rate limited:', feedId);
      return null;
    }

    const severity: Alert['severity'] = 
      failureRate > 50 ? 'CRITICAL' :
      failureRate > 30 ? 'HIGH' :
      failureRate > 15 ? 'MEDIUM' : 'LOW';

    const alert: Alert = {
      id: this.generateAlertId(),
      type: 'FEED_FAILURE',
      severity,
      feedId,
      message: `Oracle feed ${feedAddress} failure rate: ${failureRate.toFixed(1)}%`,
      details: {
        feedAddress,
        error,
        failureRate,
        threshold: this.thresholds.failureRateThreshold,
      },
      timestamp: new Date(),
      acknowledged: false,
    };

    this.addAlert(alert);
    this.sendAlert(alert);

    return alert;
  }

  /**
   * Trigger alert for data anomaly
   */
  triggerAnomalyAlert(anomaly: DataAnomaly): Alert | null {
    console.log('[WO-135] Checking anomaly alert:', anomaly.type, anomaly.severity);

    // Only alert on HIGH or CRITICAL anomalies
    if (anomaly.severity !== 'HIGH' && anomaly.severity !== 'CRITICAL') {
      return null;
    }

    // Rate limit
    if (this.isRateLimited(`anomaly_${anomaly.feedId}_${anomaly.type}`, 600000)) { // 10 minutes
      return null;
    }

    const alert: Alert = {
      id: this.generateAlertId(),
      type: 'DATA_ANOMALY',
      severity: anomaly.severity,
      feedId: anomaly.feedId,
      message: `Data anomaly detected: ${anomaly.description}`,
      details: {
        anomalyType: anomaly.type,
        value: anomaly.value,
        expectedValue: anomaly.expectedValue,
        description: anomaly.description,
      },
      timestamp: new Date(),
      acknowledged: false,
    };

    this.addAlert(alert);
    this.sendAlert(alert);

    return alert;
  }

  /**
   * Trigger alert for performance degradation
   */
  triggerPerformanceAlert(
    feedId: string,
    feedAddress: string,
    responseTime: number
  ): Alert | null {
    console.log('[WO-135] Checking performance alert:', feedId, responseTime);

    if (responseTime < this.thresholds.responseTimeThreshold) {
      return null;
    }

    // Rate limit
    if (this.isRateLimited(`performance_${feedId}`, 900000)) { // 15 minutes
      return null;
    }

    const severity: Alert['severity'] =
      responseTime > 30000 ? 'CRITICAL' :
      responseTime > 15000 ? 'HIGH' :
      responseTime > 10000 ? 'MEDIUM' : 'LOW';

    const alert: Alert = {
      id: this.generateAlertId(),
      type: 'PERFORMANCE_DEGRADATION',
      severity,
      feedId,
      message: `Oracle feed ${feedAddress} slow response: ${responseTime}ms`,
      details: {
        feedAddress,
        responseTime,
        threshold: this.thresholds.responseTimeThreshold,
      },
      timestamp: new Date(),
      acknowledged: false,
    };

    this.addAlert(alert);
    this.sendAlert(alert);

    return alert;
  }

  /**
   * Trigger critical error alert
   */
  triggerCriticalErrorAlert(
    feedId: string,
    error: string,
    context: any
  ): Alert {
    const alert: Alert = {
      id: this.generateAlertId(),
      type: 'CRITICAL_ERROR',
      severity: 'CRITICAL',
      feedId,
      message: `Critical error in oracle feed: ${error}`,
      details: {
        error,
        context,
      },
      timestamp: new Date(),
      acknowledged: false,
    };

    this.addAlert(alert);
    this.sendAlert(alert);

    return alert;
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, userId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);

    if (!alert) {
      return false;
    }

    alert.acknowledged = true;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userId;

    console.log('[WO-135] Alert acknowledged:', alertId, userId);

    return true;
  }

  /**
   * Get all alerts
   */
  getAlerts(filter?: {
    feedId?: string;
    type?: Alert['type'];
    severity?: Alert['severity'];
    acknowledged?: boolean;
  }): Alert[] {
    let filtered = [...this.alerts];

    if (filter) {
      if (filter.feedId) {
        filtered = filtered.filter(a => a.feedId === filter.feedId);
      }
      if (filter.type) {
        filtered = filtered.filter(a => a.type === filter.type);
      }
      if (filter.severity) {
        filtered = filtered.filter(a => a.severity === filter.severity);
      }
      if (filter.acknowledged !== undefined) {
        filtered = filtered.filter(a => a.acknowledged === filter.acknowledged);
      }
    }

    return filtered;
  }

  /**
   * Get unacknowledged alerts
   */
  getUnacknowledgedAlerts(): Alert[] {
    return this.alerts.filter(a => !a.acknowledged);
  }

  /**
   * Get alert summary
   */
  getAlertSummary(): {
    total: number;
    unacknowledged: number;
    bySeverity: Record<Alert['severity'], number>;
    byType: Record<Alert['type'], number>;
  } {
    const summary = {
      total: this.alerts.length,
      unacknowledged: this.alerts.filter(a => !a.acknowledged).length,
      bySeverity: {
        CRITICAL: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
      } as Record<Alert['severity'], number>,
      byType: {
        FEED_FAILURE: 0,
        DATA_ANOMALY: 0,
        PERFORMANCE_DEGRADATION: 0,
        CRITICAL_ERROR: 0,
      } as Record<Alert['type'], number>,
    };

    this.alerts.forEach(alert => {
      summary.bySeverity[alert.severity]++;
      summary.byType[alert.type]++;
    });

    return summary;
  }

  /**
   * Clear old alerts
   */
  clearOldAlerts(olderThan: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - olderThan;
    const originalLength = this.alerts.length;

    this.alerts = this.alerts.filter(
      a => a.timestamp.getTime() > cutoff || !a.acknowledged
    );

    console.log('[WO-135] Cleared', originalLength - this.alerts.length, 'old alerts');
  }

  // Private helper methods

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addAlert(alert: Alert): void {
    this.alerts.unshift(alert); // Add to beginning (most recent first)

    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(0, 1000);
    }
  }

  private sendAlert(alert: Alert): void {
    // Log to console
    const logLevel = alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? 'error' : 'warn';
    console[logLevel]('[WO-135] ALERT:', {
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      feedId: alert.feedId,
      timestamp: alert.timestamp.toISOString(),
    });

    // In production, would send to:
    // - Database for persistence
    // - Email/SMS notification service
    // - Slack/Discord webhooks
    // - PagerDuty/OpsGenie for critical alerts
    // - Monitoring dashboards
  }

  private isRateLimited(key: string, windowMs: number): boolean {
    const now = Date.now();
    const lastAlert = this.alertCounts.get(key);

    if (!lastAlert || now - lastAlert > windowMs) {
      this.alertCounts.set(key, now);
      return false;
    }

    return true;
  }
}

// Singleton instance
export const oracleAlertSystem = new OracleAlertSystem();



