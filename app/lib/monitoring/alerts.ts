// Alert management system for EmpowerGRID

import { logger } from '../logging/logger';

// Alert severity levels
export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Alert types
export enum AlertType {
  PERFORMANCE = 'performance',
  ERROR = 'error',
  SECURITY = 'security',
  SYSTEM = 'system',
  BUSINESS = 'business',
}

// Alert interface
export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  details?: any;
  timestamp: Date;
  resolved?: boolean;
  resolvedAt?: Date;
  acknowledged?: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

// Alert rule interface
export interface AlertRule {
  id: string;
  name: string;
  type: AlertType;
  severity: AlertSeverity;
  condition: (metrics: any) => boolean;
  message: string;
  cooldown: number; // milliseconds
  enabled: boolean;
  lastTriggered?: Date;
}

// Alert manager class
export class AlertManager {
  private alerts: Alert[] = [];
  private rules: AlertRule[] = [];
  private maxAlerts = 1000;
  private alertCallbacks: ((alert: Alert) => void)[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  // Initialize default alert rules
  private initializeDefaultRules(): void {
    // Performance alerts
    this.addRule({
      id: 'high-response-time',
      name: 'High API Response Time',
      type: AlertType.PERFORMANCE,
      severity: AlertSeverity.MEDIUM,
      condition: (metrics) => metrics.averageResponseTime > 5000, // 5 seconds
      message: 'Average API response time is above 5 seconds',
      cooldown: 300000, // 5 minutes
      enabled: true,
    });

    this.addRule({
      id: 'high-error-rate',
      name: 'High Error Rate',
      type: AlertType.ERROR,
      severity: AlertSeverity.HIGH,
      condition: (metrics) => metrics.errorRate > 0.05, // 5% error rate
      message: 'Error rate is above 5%',
      cooldown: 600000, // 10 minutes
      enabled: true,
    });

    this.addRule({
      id: 'high-memory-usage',
      name: 'High Memory Usage',
      type: AlertType.SYSTEM,
      severity: AlertSeverity.MEDIUM,
      condition: (metrics) => metrics.memoryUsagePercent > 85, // 85% memory usage
      message: 'Memory usage is above 85%',
      cooldown: 300000, // 5 minutes
      enabled: true,
    });

    this.addRule({
      id: 'slow-page-load',
      name: 'Slow Page Load',
      type: AlertType.PERFORMANCE,
      severity: AlertSeverity.MEDIUM,
      condition: (metrics) => metrics.averagePageLoadTime > 3000, // 3 seconds
      message: 'Average page load time is above 3 seconds',
      cooldown: 600000, // 10 minutes
      enabled: true,
    });

    // Security alerts
    this.addRule({
      id: 'failed-auth-attempts',
      name: 'High Failed Authentication Attempts',
      type: AlertType.SECURITY,
      severity: AlertSeverity.HIGH,
      condition: (metrics) => metrics.failedAuthAttempts > 10,
      message: 'High number of failed authentication attempts detected',
      cooldown: 900000, // 15 minutes
      enabled: true,
    });

    this.addRule({
      id: 'suspicious-activity',
      name: 'Suspicious Activity Detected',
      type: AlertType.SECURITY,
      severity: AlertSeverity.CRITICAL,
      condition: (metrics) => metrics.suspiciousRequests > 5,
      message: 'Suspicious activity detected from multiple sources',
      cooldown: 1800000, // 30 minutes
      enabled: true,
    });

    // Business alerts
    this.addRule({
      id: 'low-user-engagement',
      name: 'Low User Engagement',
      type: AlertType.BUSINESS,
      severity: AlertSeverity.LOW,
      condition: (metrics) => metrics.averageSessionDuration < 30, // 30 seconds
      message: 'Average user session duration is below 30 seconds',
      cooldown: 3600000, // 1 hour
      enabled: true,
    });

    this.addRule({
      id: 'high-bounce-rate',
      name: 'High Bounce Rate',
      type: AlertType.BUSINESS,
      severity: AlertSeverity.MEDIUM,
      condition: (metrics) => metrics.bounceRate > 0.7, // 70% bounce rate
      message: 'Bounce rate is above 70%',
      cooldown: 1800000, // 30 minutes
      enabled: true,
    });
  }

  // Add alert rule
  addRule(rule: Omit<AlertRule, 'lastTriggered'>): void {
    const existingRule = this.rules.find(r => r.id === rule.id);
    if (existingRule) {
      Object.assign(existingRule, rule);
    } else {
      this.rules.push({
        ...rule,
        lastTriggered: undefined,
      });
    }

    logger.info('Alert rule added/updated', { ruleId: rule.id, ruleName: rule.name });
  }

  // Remove alert rule
  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index !== -1) {
      this.rules.splice(index, 1);
      logger.info('Alert rule removed', { ruleId });
      return true;
    }
    return false;
  }

  // Evaluate metrics against rules
  evaluateMetrics(metrics: Record<string, any>): void {
    const now = Date.now();

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      // Check cooldown
      if (rule.lastTriggered && (now - rule.lastTriggered.getTime()) < rule.cooldown) {
        continue;
      }

      // Evaluate condition
      try {
        if (rule.condition(metrics)) {
          this.triggerAlert(rule, metrics);
          rule.lastTriggered = new Date();
        }
      } catch (error) {
        logger.error('Error evaluating alert rule', {
          ruleId: rule.id,
          ruleName: rule.name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  // Trigger alert
  private triggerAlert(rule: AlertRule, metrics: any): void {
    const alert: Alert = {
      id: `${rule.id}-${Date.now()}`,
      type: rule.type,
      severity: rule.severity,
      title: rule.name,
      message: rule.message,
      details: {
        ruleId: rule.id,
        metrics: metrics,
        triggeredAt: new Date(),
      },
      timestamp: new Date(),
    };

    this.alerts.push(alert);

    // Keep only recent alerts
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }

    // Notify callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        logger.error('Error in alert callback', {
          alertId: alert.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // Log alert
    logger.warn('Alert triggered', {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
    });

    // Send notification (would integrate with external services)
    this.sendNotification(alert);
  }

  // Send notification (placeholder for external integrations)
  private sendNotification(alert: Alert): void {
    // In production, integrate with:
    // - Slack/Discord webhooks
    // - Email services (SendGrid, SES)
    // - SMS services (Twilio)
    // - PagerDuty/OpsGenie
    // - Microsoft Teams

    const notificationPayload = {
      alertId: alert.id,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      timestamp: alert.timestamp,
      type: alert.type,
    };

    // Log notification (in production, send to external service)
    logger.info('Alert notification sent', notificationPayload);

    // Example: Send to Slack webhook
    if (process.env.SLACK_WEBHOOK_URL && alert.severity !== AlertSeverity.LOW) {
      this.sendSlackNotification(alert);
    }

    // Example: Send email for critical alerts
    if (process.env.SMTP_HOST && alert.severity === AlertSeverity.CRITICAL) {
      this.sendEmailNotification(alert);
    }
  }

  // Send Slack notification
  private async sendSlackNotification(alert: Alert): Promise<void> {
    try {
      const webhookUrl = process.env.SLACK_WEBHOOK_URL;
      if (!webhookUrl) return;

      const color = this.getSeverityColor(alert.severity);
      const payload = {
        attachments: [{
          color,
          title: alert.title,
          text: alert.message,
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true,
            },
            {
              title: 'Type',
              value: alert.type,
              short: true,
            },
            {
              title: 'Time',
              value: alert.timestamp.toISOString(),
              short: true,
            },
          ],
          footer: 'EmpowerGRID Monitoring',
          ts: Math.floor(alert.timestamp.getTime() / 1000),
        }],
      };

      // In production, make HTTP request to Slack webhook
      logger.info('Slack notification would be sent', { alertId: alert.id, payload });
    } catch (error) {
      logger.error('Failed to send Slack notification', {
        alertId: alert.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Send email notification
  private async sendEmailNotification(alert: Alert): Promise<void> {
    try {
      // In production, integrate with email service
      logger.info('Email notification would be sent', {
        alertId: alert.id,
        to: process.env.ALERT_EMAIL_RECIPIENTS,
        subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
      });
    } catch (error) {
      logger.error('Failed to send email notification', {
        alertId: alert.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Get severity color for notifications
  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return 'danger';
      case AlertSeverity.HIGH:
        return 'warning';
      case AlertSeverity.MEDIUM:
        return '#ffa500'; // orange
      case AlertSeverity.LOW:
        return 'good';
      default:
        return '#808080'; // gray
    }
  }

  // Acknowledge alert
  acknowledgeAlert(alertId: string, userId?: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.acknowledged) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date();
      alert.acknowledgedBy = userId;

      logger.info('Alert acknowledged', { alertId, userId });
      return true;
    }
    return false;
  }

  // Resolve alert
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();

      logger.info('Alert resolved', { alertId });
      return true;
    }
    return false;
  }

  // Get alerts
  getAlerts(options: {
    type?: AlertType;
    severity?: AlertSeverity;
    resolved?: boolean;
    acknowledged?: boolean;
    limit?: number;
  } = {}): Alert[] {
    let filtered = this.alerts;

    if (options.type) {
      filtered = filtered.filter(a => a.type === options.type);
    }

    if (options.severity) {
      filtered = filtered.filter(a => a.severity === options.severity);
    }

    if (options.resolved !== undefined) {
      filtered = filtered.filter(a => a.resolved === options.resolved);
    }

    if (options.acknowledged !== undefined) {
      filtered = filtered.filter(a => a.acknowledged === options.acknowledged);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return options.limit ? filtered.slice(0, options.limit) : filtered;
  }

  // Get alert statistics
  getAlertStats(): {
    total: number;
    byType: Record<AlertType, number>;
    bySeverity: Record<AlertSeverity, number>;
    unresolved: number;
    unacknowledged: number;
  } {
    const stats = {
      total: this.alerts.length,
      byType: {} as Record<AlertType, number>,
      bySeverity: {} as Record<AlertSeverity, number>,
      unresolved: 0,
      unacknowledged: 0,
    };

    // Initialize counters
    Object.values(AlertType).forEach(type => {
      stats.byType[type] = 0;
    });

    Object.values(AlertSeverity).forEach(severity => {
      stats.bySeverity[severity] = 0;
    });

    // Count alerts
    for (const alert of this.alerts) {
      stats.byType[alert.type]++;
      stats.bySeverity[alert.severity]++;

      if (!alert.resolved) {
        stats.unresolved++;
      }

      if (!alert.acknowledged) {
        stats.unacknowledged++;
      }
    }

    return stats;
  }

  // Add alert callback
  onAlert(callback: (alert: Alert) => void): void {
    this.alertCallbacks.push(callback);
  }

  // Remove alert callback
  removeAlertCallback(callback: (alert: Alert) => void): void {
    const index = this.alertCallbacks.indexOf(callback);
    if (index !== -1) {
      this.alertCallbacks.splice(index, 1);
    }
  }

  // Get rules
  getRules(): AlertRule[] {
    return [...this.rules];
  }

  // Enable/disable rule
  setRuleEnabled(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
      logger.info('Alert rule enabled/disabled', { ruleId, enabled });
      return true;
    }
    return false;
  }
}

// Singleton instance
export const alertManager = new AlertManager();