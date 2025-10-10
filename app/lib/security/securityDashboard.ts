/**
 * Security Dashboard
 * 
 * Provides consolidated security monitoring data
 */

import { prisma } from '../prisma';

export interface SecurityMetrics {
  activeSessions: number;
  securityAlerts: number;
  anomaliesDetected: number;
  failedLogins: number;
  suspiciousActivities: number;
  topAlertTypes: { type: string; count: number }[];
  recentAlerts: any[];
}

/**
 * Get security dashboard metrics
 */
export async function getSecurityMetrics(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<SecurityMetrics> {
  const now = new Date();
  let startDate = new Date();

  switch (timeframe) {
    case 'hour':
      startDate = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case 'day':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
  }

  // Active sessions
  const activeSessions = await prisma.session.count({
    where: {
      expiresAt: { gte: now },
      isValid: true,
    },
  });

  // Security alerts
  const securityAlerts = await prisma.securityEvent.count({
    where: {
      timestamp: { gte: startDate },
      eventType: { contains: 'security_alert' },
    },
  });

  // Anomalies detected
  const anomaliesDetected = await prisma.securityEvent.count({
    where: {
      timestamp: { gte: startDate },
      eventType: 'anomaly_detected',
    },
  });

  // Failed logins
  const failedLogins = await prisma.securityEvent.count({
    where: {
      timestamp: { gte: startDate },
      eventType: 'login_failed',
    },
  });

  // Suspicious activities (high/critical severity)
  const suspiciousActivities = await prisma.securityEvent.count({
    where: {
      timestamp: { gte: startDate },
      severity: { in: ['high', 'critical'] },
    },
  });

  // Top alert types
  const alertEvents = await prisma.securityEvent.groupBy({
    by: ['eventType'],
    where: {
      timestamp: { gte: startDate },
    },
    _count: {
      eventType: true,
    },
    orderBy: {
      _count: {
        eventType: 'desc',
      },
    },
    take: 5,
  });

  const topAlertTypes = alertEvents.map(e => ({
    type: e.eventType,
    count: e._count.eventType,
  }));

  // Recent alerts
  const recentAlerts = await prisma.securityEvent.findMany({
    where: {
      timestamp: { gte: startDate },
      severity: { in: ['medium', 'high', 'critical'] },
    },
    orderBy: {
      timestamp: 'desc',
    },
    take: 10,
  });

  return {
    activeSessions,
    securityAlerts,
    anomaliesDetected,
    failedLogins,
    suspiciousActivities,
    topAlertTypes,
    recentAlerts,
  };
}

/**
 * Get user risk profile
 */
export async function getUserRiskProfile(userId: string): Promise<{
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recentAlerts: number;
  anomalies: number;
  lastIncident: Date | null;
  recommendations: string[];
}> {
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Get recent security events
  const recentAlerts = await prisma.securityEvent.count({
    where: {
      userId,
      timestamp: { gte: last24Hours },
      severity: { in: ['medium', 'high', 'critical'] },
    },
  });

  const anomalies = await prisma.securityEvent.count({
    where: {
      userId,
      timestamp: { gte: last24Hours },
      eventType: 'anomaly_detected',
    },
  });

  // Get last incident
  const lastIncident = await prisma.securityEvent.findFirst({
    where: {
      userId,
      severity: { in: ['high', 'critical'] },
    },
    orderBy: {
      timestamp: 'desc',
    },
  });

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (recentAlerts > 5 || anomalies > 3) {
    riskLevel = 'critical';
  } else if (recentAlerts > 2 || anomalies > 1) {
    riskLevel = 'high';
  } else if (recentAlerts > 0 || anomalies > 0) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  // Generate recommendations
  const recommendations: string[] = [];
  if (recentAlerts > 2) {
    recommendations.push('Review recent security alerts');
  }
  if (anomalies > 1) {
    recommendations.push('Investigate unusual access patterns');
  }
  if (lastIncident && (Date.now() - lastIncident.timestamp.getTime()) < 7 * 24 * 60 * 60 * 1000) {
    recommendations.push('Recent security incident - monitor closely');
  }

  return {
    riskLevel,
    recentAlerts,
    anomalies,
    lastIncident: lastIncident?.timestamp || null,
    recommendations,
  };
}




