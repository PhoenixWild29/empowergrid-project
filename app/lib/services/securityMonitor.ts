import { logger, logSecurityEvent } from '../logging/logger';

/**
 * Security event types
 */
export enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  TOKEN_REFRESH = 'token_refresh',
  
  // Rate limit events
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  PROGRESSIVE_DELAY_APPLIED = 'progressive_delay_applied',
  
  // Token events
  BLACKLISTED_TOKEN_USED = 'blacklisted_token_used',
  EXPIRED_TOKEN_USED = 'expired_token_used',
  INVALID_TOKEN_USED = 'invalid_token_used',
  
  // Session events
  SESSION_ENUMERATION_ATTEMPT = 'session_enumeration_attempt',
  SESSION_HIJACK_ATTEMPT = 'session_hijack_attempt',
  CONCURRENT_SESSION_LIMIT = 'concurrent_session_limit',
  
  // Attack patterns
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
  CREDENTIAL_STUFFING = 'credential_stuffing',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
}

/**
 * Security event data
 */
export interface SecurityEvent {
  type: SecurityEventType;
  timestamp: Date;
  ipAddress: string;
  userAgent?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * Attack pattern detection thresholds
 */
const ATTACK_THRESHOLDS = {
  // Multiple failed logins from same IP
  BRUTE_FORCE: {
    FAILURES: 5,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  },
  
  // Multiple failed logins across different wallet addresses
  CREDENTIAL_STUFFING: {
    FAILURES: 10,
    UNIQUE_WALLETS: 5,
    WINDOW_MS: 30 * 60 * 1000, // 30 minutes
  },
  
  // Rapid session enumeration attempts
  SESSION_ENUMERATION: {
    ATTEMPTS: 20,
    WINDOW_MS: 5 * 60 * 1000, // 5 minutes
  },
  
  // Too many blacklisted token attempts
  BLACKLIST_ABUSE: {
    ATTEMPTS: 3,
    WINDOW_MS: 10 * 60 * 1000, // 10 minutes
  },
};

/**
 * Security monitoring service
 * Tracks security events and detects attack patterns
 */
export class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private maxEvents = 10000; // Keep last 10k events in memory

  /**
   * Record a security event
   * 
   * @param event - Security event to record
   */
  recordEvent(event: SecurityEvent): void {
    this.events.push(event);

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Check for attack patterns
    this.detectAttackPatterns(event);

    // Log event
    logger.info('Security event recorded', {
      type: event.type,
      ipAddress: event.ipAddress,
      userId: event.userId,
      metadata: event.metadata,
    });
  }

  /**
   * Detect attack patterns based on recent events
   * 
   * @param latestEvent - The most recent event
   */
  private detectAttackPatterns(latestEvent: SecurityEvent): void {
    const now = Date.now();

    // Check for brute force attack
    if (latestEvent.type === SecurityEventType.LOGIN_FAILURE) {
      this.detectBruteForce(latestEvent, now);
    }

    // Check for credential stuffing
    if (latestEvent.type === SecurityEventType.LOGIN_FAILURE) {
      this.detectCredentialStuffing(latestEvent, now);
    }

    // Check for session enumeration
    if (latestEvent.type === SecurityEventType.SESSION_ENUMERATION_ATTEMPT) {
      this.detectSessionEnumeration(latestEvent, now);
    }

    // Check for blacklist abuse
    if (latestEvent.type === SecurityEventType.BLACKLISTED_TOKEN_USED) {
      this.detectBlacklistAbuse(latestEvent, now);
    }
  }

  /**
   * Detect brute force attack (multiple failures from same IP)
   */
  private detectBruteForce(event: SecurityEvent, now: number): void {
    const threshold = ATTACK_THRESHOLDS.BRUTE_FORCE;
    const windowStart = now - threshold.WINDOW_MS;

    const recentFailures = this.events.filter(e =>
      e.type === SecurityEventType.LOGIN_FAILURE &&
      e.ipAddress === event.ipAddress &&
      e.timestamp.getTime() > windowStart
    );

    if (recentFailures.length >= threshold.FAILURES) {
      logger.warn('Brute force attack detected', {
        ipAddress: event.ipAddress,
        failures: recentFailures.length,
        window: `${threshold.WINDOW_MS / 1000}s`,
      });

      logSecurityEvent(
        'brute_force_attack_detected',
        undefined,
        event.ipAddress,
        {
          failures: recentFailures.length,
          window: threshold.WINDOW_MS,
        }
      );
    }
  }

  /**
   * Detect credential stuffing (many failures with different wallets)
   */
  private detectCredentialStuffing(event: SecurityEvent, now: number): void {
    const threshold = ATTACK_THRESHOLDS.CREDENTIAL_STUFFING;
    const windowStart = now - threshold.WINDOW_MS;

    const recentFailures = this.events.filter(e =>
      e.type === SecurityEventType.LOGIN_FAILURE &&
      e.ipAddress === event.ipAddress &&
      e.timestamp.getTime() > windowStart
    );

    // Count unique wallet addresses
    const uniqueWallets = new Set(
      recentFailures
        .map(e => e.metadata?.walletAddress)
        .filter(w => w)
    );

    if (
      recentFailures.length >= threshold.FAILURES &&
      uniqueWallets.size >= threshold.UNIQUE_WALLETS
    ) {
      logger.warn('Credential stuffing attack detected', {
        ipAddress: event.ipAddress,
        failures: recentFailures.length,
        uniqueWallets: uniqueWallets.size,
      });

      logSecurityEvent(
        'credential_stuffing_detected',
        undefined,
        event.ipAddress,
        {
          failures: recentFailures.length,
          uniqueWallets: uniqueWallets.size,
        }
      );
    }
  }

  /**
   * Detect session enumeration attempts
   */
  private detectSessionEnumeration(event: SecurityEvent, now: number): void {
    const threshold = ATTACK_THRESHOLDS.SESSION_ENUMERATION;
    const windowStart = now - threshold.WINDOW_MS;

    const recentAttempts = this.events.filter(e =>
      e.type === SecurityEventType.SESSION_ENUMERATION_ATTEMPT &&
      e.ipAddress === event.ipAddress &&
      e.timestamp.getTime() > windowStart
    );

    if (recentAttempts.length >= threshold.ATTEMPTS) {
      logger.warn('Session enumeration attack detected', {
        ipAddress: event.ipAddress,
        attempts: recentAttempts.length,
      });

      logSecurityEvent(
        'session_enumeration_attack_detected',
        undefined,
        event.ipAddress,
        {
          attempts: recentAttempts.length,
        }
      );
    }
  }

  /**
   * Detect blacklist abuse (repeated use of blacklisted tokens)
   */
  private detectBlacklistAbuse(event: SecurityEvent, now: number): void {
    const threshold = ATTACK_THRESHOLDS.BLACKLIST_ABUSE;
    const windowStart = now - threshold.WINDOW_MS;

    const recentAttempts = this.events.filter(e =>
      e.type === SecurityEventType.BLACKLISTED_TOKEN_USED &&
      e.ipAddress === event.ipAddress &&
      e.timestamp.getTime() > windowStart
    );

    if (recentAttempts.length >= threshold.ATTEMPTS) {
      logger.warn('Blacklist abuse detected', {
        ipAddress: event.ipAddress,
        attempts: recentAttempts.length,
      });

      logSecurityEvent(
        'blacklist_abuse_detected',
        undefined,
        event.ipAddress,
        {
          attempts: recentAttempts.length,
        }
      );
    }
  }

  /**
   * Get security statistics
   */
  getStatistics(windowMs: number = 24 * 60 * 60 * 1000): {
    totalEvents: number;
    byType: Record<string, number>;
    uniqueIPs: number;
    recentEvents: number;
  } {
    const now = Date.now();
    const windowStart = now - windowMs;

    const recentEvents = this.events.filter(e =>
      e.timestamp.getTime() > windowStart
    );

    const byType: Record<string, number> = {};
    const uniqueIPs = new Set<string>();

    recentEvents.forEach(event => {
      byType[event.type] = (byType[event.type] || 0) + 1;
      uniqueIPs.add(event.ipAddress);
    });

    return {
      totalEvents: this.events.length,
      byType,
      uniqueIPs: uniqueIPs.size,
      recentEvents: recentEvents.length,
    };
  }

  /**
   * Get events for a specific IP address
   */
  getEventsForIP(
    ipAddress: string,
    windowMs: number = 60 * 60 * 1000
  ): SecurityEvent[] {
    const now = Date.now();
    const windowStart = now - windowMs;

    return this.events.filter(e =>
      e.ipAddress === ipAddress &&
      e.timestamp.getTime() > windowStart
    );
  }

  /**
   * Get recent attack patterns
   */
  getRecentAttacks(windowMs: number = 60 * 60 * 1000): {
    bruteForce: number;
    credentialStuffing: number;
    sessionEnumeration: number;
    blacklistAbuse: number;
  } {
    const now = Date.now();
    const windowStart = now - windowMs;

    const recentEvents = this.events.filter(e =>
      e.timestamp.getTime() > windowStart
    );

    return {
      bruteForce: recentEvents.filter(e => e.metadata?.attackType === 'brute_force').length,
      credentialStuffing: recentEvents.filter(e => e.metadata?.attackType === 'credential_stuffing').length,
      sessionEnumeration: recentEvents.filter(e => e.type === SecurityEventType.SESSION_ENUMERATION_ATTEMPT).length,
      blacklistAbuse: recentEvents.filter(e => e.type === SecurityEventType.BLACKLISTED_TOKEN_USED).length,
    };
  }

  /**
   * Clear old events (for memory management)
   */
  cleanup(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    const cutoff = now - maxAgeMs;
    const initialCount = this.events.length;

    this.events = this.events.filter(e => e.timestamp.getTime() > cutoff);

    const removed = initialCount - this.events.length;

    if (removed > 0) {
      logger.info('Security events cleaned up', {
        removed,
        remaining: this.events.length,
      });
    }

    return removed;
  }

  /**
   * Clear all events
   */
  clearAll(): void {
    this.events = [];
  }
}

// Singleton instance
export const securityMonitor = new SecurityMonitor();

/**
 * Helper function to record security events
 */
export function recordSecurityEvent(
  type: SecurityEventType,
  ipAddress: string,
  userId?: string,
  metadata?: Record<string, any>,
  userAgent?: string
): void {
  securityMonitor.recordEvent({
    type,
    timestamp: new Date(),
    ipAddress,
    userAgent,
    userId,
    metadata,
  });
}






