/**
 * Anomaly Detection System
 * 
 * Identifies unusual session behavior patterns and triggers alerts
 */

import { prisma } from '../prisma';

export interface AnomalyScore {
  score: number; // 0-100, higher = more anomalous
  factors: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Calculate anomaly score for session
 */
export async function calculateAnomalyScore(
  userId: string,
  sessionId: string,
  ipAddress: string,
  userAgent: string
): Promise<AnomalyScore> {
  let score = 0;
  const factors: string[] = [];

  // Factor 1: Time of access
  const hour = new Date().getHours();
  const isUnusualTime = hour < 6 || hour > 23;
  if (isUnusualTime) {
    score += 15;
    factors.push('Unusual access time');
  }

  // Factor 2: Multiple concurrent sessions
  const activeSessions = await prisma.session.count({
    where: {
      userId,
      expiresAt: { gte: new Date() },
      isValid: true,
    },
  });

  if (activeSessions > 3) {
    score += 20 * (activeSessions - 3);
    factors.push(`${activeSessions} concurrent sessions`);
  }

  // Factor 3: IP address change frequency
  const recentSessions = await prisma.session.findMany({
    where: {
      userId,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
    select: { ipAddress: true },
  });

  const uniqueIPs = new Set(recentSessions.map(s => s.ipAddress)).size;
  if (uniqueIPs > 3) {
    score += 15 * (uniqueIPs - 3);
    factors.push(`${uniqueIPs} different IP addresses in 24h`);
  }

  // Factor 4: Session creation rate
  const sessionsToday = await prisma.session.count({
    where: {
      userId,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  if (sessionsToday > 10) {
    score += 25;
    factors.push(`${sessionsToday} sessions created in 24h`);
  }

  // Factor 5: Failed authentication attempts
  const failedAttempts = await prisma.securityEvent.count({
    where: {
      userId,
      eventType: 'login_failed',
      timestamp: {
        gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
      },
    },
  });

  if (failedAttempts > 3) {
    score += 30;
    factors.push(`${failedAttempts} failed login attempts`);
  }

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (score >= 80) riskLevel = 'critical';
  else if (score >= 50) riskLevel = 'high';
  else if (score >= 25) riskLevel = 'medium';
  else riskLevel = 'low';

  return {
    score: Math.min(score, 100),
    factors,
    riskLevel,
  };
}

/**
 * Detect session anomalies
 */
export async function detectSessionAnomalies(
  userId: string,
  sessionId: string,
  ipAddress: string,
  userAgent: string
): Promise<AnomalyScore> {
  const anomalyScore = await calculateAnomalyScore(userId, sessionId, ipAddress, userAgent);

  // Log anomaly if risk level is medium or higher
  if (anomalyScore.riskLevel !== 'low') {
    await logAnomaly(userId, sessionId, anomalyScore);
  }

  // Trigger alerts for high/critical risk
  if (anomalyScore.riskLevel === 'high' || anomalyScore.riskLevel === 'critical') {
    await triggerSecurityAlert(userId, sessionId, anomalyScore);
  }

  return anomalyScore;
}

/**
 * Log anomaly detection
 */
async function logAnomaly(
  userId: string,
  sessionId: string,
  anomalyScore: AnomalyScore
): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'anomaly_detected',
        severity: anomalyScore.riskLevel === 'critical' ? 'critical' : 
                  anomalyScore.riskLevel === 'high' ? 'high' : 'medium',
        metadata: {
          sessionId,
          anomalyScore: anomalyScore.score,
          factors: anomalyScore.factors,
          riskLevel: anomalyScore.riskLevel,
        },
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error logging anomaly:', error);
  }
}

/**
 * Trigger security alert
 */
async function triggerSecurityAlert(
  userId: string,
  sessionId: string,
  anomalyScore: AnomalyScore
): Promise<void> {
  console.error(`[SECURITY ALERT] ${anomalyScore.riskLevel.toUpperCase()} risk detected`);
  console.error(`User: ${userId}`);
  console.error(`Session: ${sessionId}`);
  console.error(`Score: ${anomalyScore.score}`);
  console.error(`Factors: ${anomalyScore.factors.join(', ')}`);

  // In production, this would:
  // - Send notification to security team
  // - Send email/SMS to user
  // - Optionally terminate session
  // - Create incident ticket
}

/**
 * Get user behavior baseline
 */
export async function getUserBehaviorBaseline(userId: string): Promise<{
  typicalAccessHours: number[];
  typicalIPAddresses: string[];
  averageSessionsPerDay: number;
}> {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
    select: {
      createdAt: true,
      ipAddress: true,
    },
  });

  // Calculate typical access hours
  const accessHours = sessions.map(s => s.createdAt.getHours());
  const hourCounts = accessHours.reduce((acc, hour) => {
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const typicalAccessHours = Object.entries(hourCounts)
    .filter(([_, count]) => count > sessions.length * 0.1) // Hours with >10% of sessions
    .map(([hour]) => parseInt(hour));

  // Get typical IP addresses
  const ipCounts = sessions.reduce((acc, s) => {
    if (s.ipAddress) {
      acc[s.ipAddress] = (acc[s.ipAddress] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const typicalIPAddresses = Object.entries(ipCounts)
    .filter(([_, count]) => count > 2) // IPs used more than twice
    .map(([ip]) => ip);

  // Calculate average sessions per day
  const daysOfData = Math.min(30, Math.ceil(sessions.length / 24));
  const averageSessionsPerDay = sessions.length / daysOfData;

  return {
    typicalAccessHours,
    typicalIPAddresses,
    averageSessionsPerDay,
  };
}

