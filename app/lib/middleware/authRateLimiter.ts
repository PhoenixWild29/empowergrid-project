import { NextApiRequest, NextApiResponse } from 'next';
import { getClientIdentifier } from './security';
import { logger, logSecurityEvent } from '../logging/logger';

/**
 * Authentication-specific rate limiting configuration
 * Stricter limits than general API rate limiting
 */
export const AUTH_RATE_LIMITS = {
  // Challenge endpoint - users requesting authentication challenges
  CHALLENGE: {
    MAX_REQUESTS: 20,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    NAME: 'challenge',
  },
  
  // Login endpoint - actual authentication attempts (most critical)
  LOGIN: {
    MAX_REQUESTS: 5,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    NAME: 'login',
  },
  
  // Refresh endpoint - token refresh attempts
  REFRESH: {
    MAX_REQUESTS: 10,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    NAME: 'refresh',
  },
  
  // Logout endpoint - logout requests
  LOGOUT: {
    MAX_REQUESTS: 20,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    NAME: 'logout',
  },
  
  // Session validation endpoint
  SESSION: {
    MAX_REQUESTS: 50,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    NAME: 'session',
  },
} as const;

/**
 * Progressive delay configuration for near-limit requests
 */
const PROGRESSIVE_DELAYS = {
  THRESHOLD_1: 0.6, // 60% of limit
  DELAY_1: 0, // No delay
  
  THRESHOLD_2: 0.8, // 80% of limit
  DELAY_2: 500, // 500ms delay
  
  THRESHOLD_3: 0.9, // 90% of limit
  DELAY_3: 1000, // 1 second delay
};

/**
 * Request tracking for rate limiting
 */
interface RequestRecord {
  timestamp: number;
  endpoint: string;
  identifier: string;
}

/**
 * Authentication Rate Limiter
 * More restrictive than general API rate limiting
 */
class AuthRateLimiter {
  private requests: Map<string, RequestRecord[]> = new Map();
  private lockouts: Map<string, number> = new Map(); // Lockout expiry timestamps

  /**
   * Check if a client is rate limited for authentication endpoint
   * 
   * @param identifier - Client identifier (IP address)
   * @param endpointType - Type of auth endpoint
   * @returns Object with isLimited status and retry info
   */
  checkRateLimit(
    identifier: string,
    endpointType: keyof typeof AUTH_RATE_LIMITS
  ): {
    isLimited: boolean;
    remainingRequests: number;
    resetTime: number;
    retryAfter: number;
    shouldDelay: number;
  } {
    const config = AUTH_RATE_LIMITS[endpointType];
    const key = `${identifier}:${config.NAME}`;
    const now = Date.now();
    const windowStart = now - config.WINDOW_MS;

    // Check if client is currently locked out
    const lockoutUntil = this.lockouts.get(key);
    if (lockoutUntil && now < lockoutUntil) {
      const retryAfter = Math.ceil((lockoutUntil - now) / 1000);
      return {
        isLimited: true,
        remainingRequests: 0,
        resetTime: lockoutUntil,
        retryAfter,
        shouldDelay: 0,
      };
    }

    // Get existing requests for this identifier and endpoint
    let requests = this.requests.get(key) || [];

    // Filter out requests outside the current window
    requests = requests.filter(record => record.timestamp > windowStart);

    // Update the stored requests
    this.requests.set(key, requests);

    const requestCount = requests.length;
    const remainingRequests = Math.max(0, config.MAX_REQUESTS - requestCount);

    // Check if limit exceeded
    if (requestCount >= config.MAX_REQUESTS) {
      // Set lockout period (same as window)
      this.lockouts.set(key, now + config.WINDOW_MS);

      logger.warn('Auth rate limit exceeded', {
        identifier,
        endpoint: config.NAME,
        requestCount,
        maxRequests: config.MAX_REQUESTS,
      });

      logSecurityEvent(
        'auth_rate_limit_exceeded',
        undefined,
        identifier,
        {
          endpoint: config.NAME,
          requestCount,
          maxRequests: config.MAX_REQUESTS,
        }
      );

      return {
        isLimited: true,
        remainingRequests: 0,
        resetTime: now + config.WINDOW_MS,
        retryAfter: Math.ceil(config.WINDOW_MS / 1000),
        shouldDelay: 0,
      };
    }

    // Calculate progressive delay
    const usageRatio = requestCount / config.MAX_REQUESTS;
    let shouldDelay = 0;

    if (usageRatio >= PROGRESSIVE_DELAYS.THRESHOLD_3) {
      shouldDelay = PROGRESSIVE_DELAYS.DELAY_3;
    } else if (usageRatio >= PROGRESSIVE_DELAYS.THRESHOLD_2) {
      shouldDelay = PROGRESSIVE_DELAYS.DELAY_2;
    } else if (usageRatio >= PROGRESSIVE_DELAYS.THRESHOLD_1) {
      shouldDelay = PROGRESSIVE_DELAYS.DELAY_1;
    }

    // Add current request
    requests.push({
      timestamp: now,
      endpoint: config.NAME,
      identifier,
    });
    this.requests.set(key, requests);

    // Cleanup old entries periodically
    this.cleanup(windowStart);

    return {
      isLimited: false,
      remainingRequests,
      resetTime: now + config.WINDOW_MS,
      retryAfter: 0,
      shouldDelay,
    };
  }

  /**
   * Record a failed authentication attempt
   * Tracks failures for security monitoring
   * 
   * @param identifier - Client identifier
   * @param endpointType - Type of auth endpoint
   * @param reason - Failure reason
   */
  recordFailure(
    identifier: string,
    endpointType: keyof typeof AUTH_RATE_LIMITS,
    reason: string
  ): void {
    const config = AUTH_RATE_LIMITS[endpointType];

    logger.warn('Authentication failure recorded', {
      identifier,
      endpoint: config.NAME,
      reason,
    });

    logSecurityEvent(
      'auth_failure',
      undefined,
      identifier,
      {
        endpoint: config.NAME,
        reason,
      }
    );
  }

  /**
   * Reset rate limit for a specific identifier and endpoint
   * Use with caution - mainly for admin overrides
   * 
   * @param identifier - Client identifier
   * @param endpointType - Type of auth endpoint
   */
  reset(identifier: string, endpointType: keyof typeof AUTH_RATE_LIMITS): void {
    const config = AUTH_RATE_LIMITS[endpointType];
    const key = `${identifier}:${config.NAME}`;
    
    this.requests.delete(key);
    this.lockouts.delete(key);

    logger.info('Auth rate limit reset', {
      identifier,
      endpoint: config.NAME,
    });
  }

  /**
   * Get current rate limit status for monitoring
   * 
   * @param identifier - Client identifier
   * @param endpointType - Type of auth endpoint
   */
  getStatus(
    identifier: string,
    endpointType: keyof typeof AUTH_RATE_LIMITS
  ): {
    requestCount: number;
    maxRequests: number;
    remainingRequests: number;
    isLockedOut: boolean;
    lockoutExpiry?: number;
  } {
    const config = AUTH_RATE_LIMITS[endpointType];
    const key = `${identifier}:${config.NAME}`;
    const now = Date.now();
    const windowStart = now - config.WINDOW_MS;

    // Check lockout
    const lockoutUntil = this.lockouts.get(key);
    const isLockedOut = lockoutUntil ? now < lockoutUntil : false;

    // Get request count
    let requests = this.requests.get(key) || [];
    requests = requests.filter(record => record.timestamp > windowStart);
    
    const requestCount = requests.length;
    const remainingRequests = Math.max(0, config.MAX_REQUESTS - requestCount);

    return {
      requestCount,
      maxRequests: config.MAX_REQUESTS,
      remainingRequests,
      isLockedOut,
      lockoutExpiry: isLockedOut ? lockoutUntil : undefined,
    };
  }

  /**
   * Clean up old rate limit entries
   * Removes expired requests and lockouts
   */
  private cleanup(windowStart: number): void {
    // Only cleanup occasionally to avoid performance impact
    if (Math.random() > 0.99) { // 1% chance
      const now = Date.now();

      // Cleanup old requests
      this.requests.forEach((records, key) => {
        const validRecords = records.filter(r => r.timestamp > windowStart);
        if (validRecords.length === 0) {
          this.requests.delete(key);
        } else {
          this.requests.set(key, validRecords);
        }
      });

      // Cleanup expired lockouts
      this.lockouts.forEach((expiry, key) => {
        if (now > expiry) {
          this.lockouts.delete(key);
        }
      });
    }
  }

  /**
   * Clear all rate limit data
   * Use with caution - mainly for testing
   */
  clearAll(): void {
    this.requests.clear();
    this.lockouts.clear();
  }

  /**
   * Get statistics for monitoring
   */
  getStatistics(): {
    totalTrackedIPs: number;
    totalRequests: number;
    activeLockouts: number;
  } {
    const now = Date.now();
    let totalRequests = 0;

    this.requests.forEach(records => {
      totalRequests += records.length;
    });

    let activeLockouts = 0;
    this.lockouts.forEach(expiry => {
      if (now < expiry) {
        activeLockouts++;
      }
    });

    return {
      totalTrackedIPs: this.requests.size,
      totalRequests,
      activeLockouts,
    };
  }
}

// Singleton instance
export const authRateLimiter = new AuthRateLimiter();

/**
 * Middleware function to apply authentication rate limiting
 * 
 * @param endpointType - Type of authentication endpoint
 * @returns Middleware function
 */
export function applyAuthRateLimit(
  endpointType: keyof typeof AUTH_RATE_LIMITS
) {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<boolean> => {
    const identifier = getClientIdentifier(req);
    const result = authRateLimiter.checkRateLimit(identifier, endpointType);

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', AUTH_RATE_LIMITS[endpointType].MAX_REQUESTS.toString());
    res.setHeader('X-RateLimit-Remaining', result.remainingRequests.toString());
    res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

    // Check if rate limited
    if (result.isLimited) {
      res.setHeader('Retry-After', result.retryAfter.toString());

      res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message: `Too many ${AUTH_RATE_LIMITS[endpointType].NAME} attempts. Please try again later.`,
        retryAfter: result.retryAfter,
        resetTime: new Date(result.resetTime).toISOString(),
        statusCode: 429,
      });

      return false;
    }

    // Apply progressive delay if needed
    if (result.shouldDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, result.shouldDelay));
    }

    return true;
  };
}

/**
 * Export for testing and monitoring
 */
export const __TEST__ = {
  authRateLimiter,
  PROGRESSIVE_DELAYS,
};

