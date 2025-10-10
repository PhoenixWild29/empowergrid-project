/**
 * WO-128: Oracle Rate Limiting Middleware
 * 
 * Features:
 * - Rate limiting for oracle API requests
 * - Prevent service overload
 * - Configurable limits per user/IP
 * - Integration with reliability service
 */

import { NextApiRequest, NextApiResponse } from 'next';

// WO-128: Rate limit configuration
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// In-memory store (production would use Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// WO-128: Different limits for different oracle operations
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  oracle_feed_query: {
    windowMs: 60000, // 1 minute
    maxRequests: 100,
  },
  oracle_request: {
    windowMs: 60000, // 1 minute
    maxRequests: 20,
  },
  oracle_verification: {
    windowMs: 60000, // 1 minute
    maxRequests: 10,
  },
};

/**
 * WO-128: Rate limiting middleware for oracle endpoints
 */
export function oracleRateLimit(operationType: keyof typeof RATE_LIMITS) {
  return async (
    req: NextApiRequest,
    res: NextApiResponse,
    next: () => void
  ) => {
    const config = RATE_LIMITS[operationType];
    
    // Generate key from user ID or IP address
    const userId = (req as any).user?.id;
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                req.socket.remoteAddress ||
                'unknown';
    const key = `oracle_${operationType}_${userId || ip}`;

    const now = Date.now();
    
    // Get or initialize rate limit data
    let limitData = rateLimitStore.get(key);
    
    if (!limitData || now > limitData.resetAt) {
      // Reset window
      limitData = {
        count: 0,
        resetAt: now + config.windowMs,
      };
      rateLimitStore.set(key, limitData);
    }

    // Increment request count
    limitData.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - limitData.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(limitData.resetAt).toISOString());

    // Check if limit exceeded
    if (limitData.count > config.maxRequests) {
      const retryAfter = Math.ceil((limitData.resetAt - now) / 1000);
      
      console.warn(`[WO-128] Rate limit exceeded for ${key}`);
      
      res.setHeader('Retry-After', retryAfter.toString());
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded for ${operationType}`,
        retryAfter: `${retryAfter}s`,
        limit: config.maxRequests,
        windowMs: config.windowMs,
      });
    }

    // Continue to next middleware
    next();
  };
}

/**
 * WO-128: Clean up expired rate limit entries (call periodically)
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetAt) {
      rateLimitStore.delete(key);
    }
  }
  
  console.log(`[WO-128] Cleaned up rate limits. Active entries: ${rateLimitStore.size}`);
}

// Clean up every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000);



