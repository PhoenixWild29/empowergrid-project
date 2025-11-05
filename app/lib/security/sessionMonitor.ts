/**
 * Session Security Monitor
 * 
 * Detects and logs suspicious session patterns
 */

import { prisma } from '../prisma';

export interface SessionMonitorAlert {
  type: 'concurrent_sessions' | 'ip_change' | 'rapid_refresh' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  details: any;
  timestamp: Date;
}

/**
 * Check for multiple concurrent sessions
 */
export async function detectConcurrentSessions(userId: string): Promise<SessionMonitorAlert | null> {
  try {
    const activeSessions = await prisma.session.count({
      where: {
        userId,
        expiresAt: {
          gte: new Date(),
        },
        isValid: true,
      },
    });

    // Alert if more than 3 concurrent sessions
    if (activeSessions > 3) {
      return {
        type: 'concurrent_sessions',
        severity: activeSessions > 5 ? 'high' : 'medium',
        userId,
        details: {
          sessionCount: activeSessions,
          threshold: 3,
        },
        timestamp: new Date(),
      };
    }

    return null;
  } catch (error) {
    console.error('Error detecting concurrent sessions:', error);
    return null;
  }
}

/**
 * Detect unusual IP address changes
 */
export async function detectIPChange(
  userId: string,
  currentIP: string,
  sessionId: string
): Promise<SessionMonitorAlert | null> {
  try {
    // Get recent sessions
    const recentSessions = await prisma.session.findMany({
      where: {
        userId,
        id: { not: sessionId },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // Check if current IP is significantly different
    const recentIPs = recentSessions.map(s => s.ipAddress).filter(Boolean);
    const ipChanged = !recentIPs.includes(currentIP);

    if (ipChanged && recentIPs.length > 0) {
      return {
        type: 'ip_change',
        severity: 'medium',
        userId,
        details: {
          previousIPs: recentIPs,
          currentIP,
          sessionId,
        },
        timestamp: new Date(),
      };
    }

    return null;
  } catch (error) {
    console.error('Error detecting IP change:', error);
    return null;
  }
}

/**
 * Detect rapid token refresh attempts
 */
export async function detectRapidRefresh(userId: string): Promise<SessionMonitorAlert | null> {
  try {
    // Check for refresh attempts in the last 5 minutes
    const recentRefreshes = await prisma.securityEvent.count({
      where: {
        userId,
        eventType: 'token_refresh',
        timestamp: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
    });

    // Alert if more than 10 refreshes in 5 minutes
    if (recentRefreshes > 10) {
      return {
        type: 'rapid_refresh',
        severity: recentRefreshes > 20 ? 'high' : 'medium',
        userId,
        details: {
          refreshCount: recentRefreshes,
          timeWindow: '5 minutes',
          threshold: 10,
        },
        timestamp: new Date(),
      };
    }

    return null;
  } catch (error) {
    console.error('Error detecting rapid refresh:', error);
    return null;
  }
}

/**
 * Monitor session and detect suspicious patterns
 */
export async function monitorSession(
  userId: string,
  sessionId: string,
  ipAddress: string
): Promise<SessionMonitorAlert[]> {
  const alerts: SessionMonitorAlert[] = [];

  // Check for concurrent sessions
  const concurrentAlert = await detectConcurrentSessions(userId);
  if (concurrentAlert) alerts.push(concurrentAlert);

  // Check for IP changes
  const ipChangeAlert = await detectIPChange(userId, ipAddress, sessionId);
  if (ipChangeAlert) alerts.push(ipChangeAlert);

  // Check for rapid refresh
  const rapidRefreshAlert = await detectRapidRefresh(userId);
  if (rapidRefreshAlert) alerts.push(rapidRefreshAlert);

  // Log all alerts
  for (const alert of alerts) {
    await logSecurityAlert(alert);
  }

  return alerts;
}

/**
 * Log security alert
 */
async function logSecurityAlert(alert: SessionMonitorAlert): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        userId: alert.userId,
        eventType: `security_alert_${alert.type}`,
        severity: alert.severity,
        metadata: alert.details,
        timestamp: alert.timestamp,
      },
    });
  } catch (error) {
    console.error('Error logging security alert:', error);
  }
}






