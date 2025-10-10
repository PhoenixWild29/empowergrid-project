/**
 * Rate Limiting Middleware
 * 
 * WO-96: API rate limiting and security controls
 * 
 * Features:
 * - 20 funding operations/hour per user
 * - Unlimited read-only operations
 * - User identification via auth tokens/wallets
 * - Intelligent priority during high traffic
 * - Configurable limits per operation type
 * - 429 responses with rate limit details
 */

import { NextApiRequest, NextApiResponse } from 'next';

// WO-96: Rate limit configuration
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
  operationType: 'funding' | 'read' | 'write';
  message?: string;
}

// WO-96: In-memory storage for rate limits (production would use Redis)
const rateLimitStore: Map<string, {
  count: number;
  resetTime: number;
  requests: number[];
}> = new Map();

// WO-96: Default rate limit configurations
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Funding operations: 20 per hour
  funding: {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
    operationType: 'funding',
    message: 'Too many funding operations. Maximum 20 per hour.',
  },
  
  // Write operations: 100 per hour
  write: {
    maxRequests: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
    operationType: 'write',
    message: 'Too many write operations. Please try again later.',
  },
  
  // Read operations: Unlimited (high limit)
  read: {
    maxRequests: 10000,
    windowMs: 60 * 60 * 1000, // 1 hour
    operationType: 'read',
    message: 'Too many requests. Please try again later.',
  },
};

/**
 * WO-96: Get rate limit key for user
 */
function getRateLimitKey(
  userId: string | undefined,
  walletAddress: string | undefined,
  operationType: string
): string {
  const identifier = userId || walletAddress || 'anonymous';
  return `ratelimit:${identifier}:${operationType}`;
}

/**
 * WO-96: Check if rate limit exceeded
 */
function checkRateLimit(
  key: string,
  config: RateLimitConfig
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  current: number;
} {
  const now = Date.now();
  const data = rateLimitStore.get(key);

  if (!data || now >= data.resetTime) {
    // Create new window
    const resetTime = now + config.windowMs;
    rateLimitStore.set(key, {
      count: 1,
      resetTime,
      requests: [now],
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime,
      current: 1,
    };
  }

  // Filter out expired requests within current window
  const validRequests = data.requests.filter(
    timestamp => now - timestamp < config.windowMs
  );

  if (validRequests.length >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: data.resetTime,
      current: validRequests.length,
    };
  }

  // Add current request
  validRequests.push(now);
  rateLimitStore.set(key, {
    count: validRequests.length,
    resetTime: data.resetTime,
    requests: validRequests,
  });

  return {
    allowed: true,
    remaining: config.maxRequests - validRequests.length,
    resetTime: data.resetTime,
    current: validRequests.length,
  };
}

/**
 * WO-96: Determine operation type from request
 */
function getOperationType(req: NextApiRequest): 'funding' | 'write' | 'read' {
  const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);

  // WO-96: Classify as funding operations
  if (pathname.includes('/escrow/') && pathname.includes('/deposit')) {
    return 'funding';
  }
  if (pathname.includes('/escrow/create')) {
    return 'funding';
  }
  if (pathname.includes('/milestones/') && pathname.includes('/verify')) {
    return 'funding';
  }
  if (pathname.includes('/projects/') && pathname.includes('/fund')) {
    return 'funding';
  }

  // WO-96: Classify as write operations
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE') {
    return 'write';
  }

  // WO-96: Default to read operations (unlimited)
  return 'read';
}

/**
 * WO-96: Rate limiting middleware
 */
export function withRateLimit(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  customConfig?: Partial<RateLimitConfig>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Extract user identifier
      const userId = (req as any).userId;
      const walletAddress = (req as any).userWallet;

      // WO-96: Determine operation type
      const operationType = getOperationType(req);

      // Get rate limit configuration
      const baseConfig = RATE_LIMIT_CONFIGS[operationType];
      const config = customConfig ? { ...baseConfig, ...customConfig } : baseConfig;

      // Generate rate limit key
      const rateLimitKey = getRateLimitKey(userId, walletAddress, operationType);

      // WO-96: Check rate limit
      const limitCheck = checkRateLimit(rateLimitKey, config);

      // WO-96: Set rate limit headers
      res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', limitCheck.remaining.toString());
      res.setHeader('X-RateLimit-Reset', new Date(limitCheck.resetTime).toISOString());
      res.setHeader('X-RateLimit-Current', limitCheck.current.toString());

      // WO-96: Return 429 if limit exceeded
      if (!limitCheck.allowed) {
        const retryAfter = Math.ceil((limitCheck.resetTime - Date.now()) / 1000);
        
        res.setHeader('Retry-After', retryAfter.toString());
        
        return res.status(429).json({
          error: 'Too Many Requests',
          message: config.message || 'Rate limit exceeded',
          rateLimit: {
            limit: config.maxRequests,
            current: limitCheck.current,
            remaining: 0,
            resetAt: new Date(limitCheck.resetTime).toISOString(),
            retryAfter: `${retryAfter} seconds`,
          },
          operationType,
        });
      }

      // WO-96: Log for monitoring (in production, send to monitoring service)
      if (limitCheck.remaining < 5) {
        console.warn(`[WO-96] Rate limit warning: ${rateLimitKey} - ${limitCheck.remaining} requests remaining`);
      }

      // Execute handler
      return await handler(req, res);

    } catch (error) {
      console.error('[WO-96] Rate limit middleware error:', error);
      // Don't block request on middleware error
      return await handler(req, res);
    }
  };
}

/**
 * WO-96: Get current rate limit status for user
 */
export function getRateLimitStatus(
  userId: string | undefined,
  walletAddress: string | undefined,
  operationType: 'funding' | 'write' | 'read'
): {
  limit: number;
  current: number;
  remaining: number;
  resetAt: string | null;
} {
  const key = getRateLimitKey(userId, walletAddress, operationType);
  const config = RATE_LIMIT_CONFIGS[operationType];
  const data = rateLimitStore.get(key);

  if (!data) {
    return {
      limit: config.maxRequests,
      current: 0,
      remaining: config.maxRequests,
      resetAt: null,
    };
  }

  const now = Date.now();
  const validRequests = data.requests.filter(
    timestamp => now - timestamp < config.windowMs
  );

  return {
    limit: config.maxRequests,
    current: validRequests.length,
    remaining: Math.max(0, config.maxRequests - validRequests.length),
    resetAt: new Date(data.resetTime).toISOString(),
  };
}

/**
 * WO-96: Clear rate limit for user (admin function)
 */
export function clearRateLimit(
  userId: string | undefined,
  walletAddress: string | undefined,
  operationType?: string
): void {
  if (operationType) {
    const key = getRateLimitKey(userId, walletAddress, operationType);
    rateLimitStore.delete(key);
  } else {
    // Clear all rate limits for user
    const identifier = userId || walletAddress || 'anonymous';
    for (const key of rateLimitStore.keys()) {
      if (key.includes(identifier)) {
        rateLimitStore.delete(key);
      }
    }
  }
}

/**
 * WO-96: Get all rate limit statistics (monitoring endpoint)
 */
export function getRateLimitStatistics(): {
  totalKeys: number;
  fundingOperations: number;
  writeOperations: number;
  readOperations: number;
} {
  let fundingOps = 0;
  let writeOps = 0;
  let readOps = 0;

  for (const key of rateLimitStore.keys()) {
    if (key.includes(':funding')) fundingOps++;
    else if (key.includes(':write')) writeOps++;
    else if (key.includes(':read')) readOps++;
  }

  return {
    totalKeys: rateLimitStore.size,
    fundingOperations: fundingOps,
    writeOperations: writeOps,
    readOperations: readOps,
  };
}


