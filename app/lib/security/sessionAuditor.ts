/**
 * Session Audit System
 * 
 * Captures all session lifecycle events for compliance and investigation
 */

import { prisma } from '../prisma';

export type SessionEventType =
  | 'session_created'
  | 'session_validated'
  | 'session_refreshed'
  | 'session_invalidated'
  | 'session_expired'
  | 'session_renewed';

export interface SessionAuditEntry {
  userId: string;
  sessionId: string;
  eventType: SessionEventType;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * Log session lifecycle event
 */
export async function auditSessionEvent(entry: SessionAuditEntry): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        userId: entry.userId,
        eventType: entry.eventType,
        severity: 'info',
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        metadata: {
          sessionId: entry.sessionId,
          ...entry.metadata,
        },
        timestamp: entry.timestamp,
      },
    });

    console.log(`[AUDIT] ${entry.eventType} - User: ${entry.userId}, Session: ${entry.sessionId}`);
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
}

/**
 * Audit session creation
 */
export async function auditSessionCreation(
  userId: string,
  sessionId: string,
  ipAddress: string,
  userAgent: string,
  metadata?: Record<string, any>
): Promise<void> {
  await auditSessionEvent({
    userId,
    sessionId,
    eventType: 'session_created',
    ipAddress,
    userAgent,
    metadata,
    timestamp: new Date(),
  });
}

/**
 * Audit session validation
 */
export async function auditSessionValidation(
  userId: string,
  sessionId: string,
  ipAddress: string,
  success: boolean
): Promise<void> {
  await auditSessionEvent({
    userId,
    sessionId,
    eventType: 'session_validated',
    ipAddress,
    metadata: { success },
    timestamp: new Date(),
  });
}

/**
 * Audit session refresh
 */
export async function auditSessionRefresh(
  userId: string,
  sessionId: string,
  ipAddress: string,
  newSessionId?: string
): Promise<void> {
  await auditSessionEvent({
    userId,
    sessionId,
    eventType: 'session_refreshed',
    ipAddress,
    metadata: { newSessionId },
    timestamp: new Date(),
  });
}

/**
 * Audit session invalidation
 */
export async function auditSessionInvalidation(
  userId: string,
  sessionId: string,
  reason: string
): Promise<void> {
  await auditSessionEvent({
    userId,
    sessionId,
    eventType: 'session_invalidated',
    metadata: { reason },
    timestamp: new Date(),
  });
}

/**
 * Get audit trail for user
 */
export async function getUserAuditTrail(
  userId: string,
  options: {
    startDate?: Date;
    endDate?: Date;
    eventType?: SessionEventType;
    limit?: number;
  } = {}
) {
  const { startDate, endDate, eventType, limit = 100 } = options;

  return prisma.securityEvent.findMany({
    where: {
      userId,
      ...(eventType && { eventType }),
      ...(startDate && { timestamp: { gte: startDate } }),
      ...(endDate && { timestamp: { lte: endDate } }),
    },
    orderBy: {
      timestamp: 'desc',
    },
    take: limit,
  });
}

/**
 * Generate compliance report
 */
export async function generateComplianceReport(
  startDate: Date,
  endDate: Date
): Promise<any> {
  // Get all audit events in date range
  const events = await prisma.securityEvent.findMany({
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
  });

  // Generate statistics
  const stats = {
    totalEvents: events.length,
    eventsByType: {} as Record<string, number>,
    eventsBySeverity: {} as Record<string, number>,
    uniqueUsers: new Set(events.map(e => e.userId)).size,
    securityAlerts: events.filter(e => e.eventType.includes('security_alert')).length,
  };

  // Count events by type
  events.forEach(event => {
    stats.eventsByType[event.eventType] = (stats.eventsByType[event.eventType] || 0) + 1;
    stats.eventsBySeverity[event.severity] = (stats.eventsBySeverity[event.severity] || 0) + 1;
  });

  return {
    reportPeriod: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    statistics: stats,
    events: events.slice(0, 1000), // Include first 1000 events
  };
}




