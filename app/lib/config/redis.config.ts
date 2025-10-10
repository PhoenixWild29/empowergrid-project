/**
 * Redis Configuration
 * 
 * Configuration for Redis connection used for:
 * - Distributed rate limiting
 * - Session storage
 * - Caching
 * - Real-time features
 * 
 * Environment Variables Required:
 * - REDIS_URL: Redis connection string (redis://localhost:6379)
 * - REDIS_PASSWORD: Redis password (if required)
 * - REDIS_TLS: Enable TLS for production (true/false)
 */

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  tls?: boolean;
  enableOfflineQueue: boolean;
  maxRetriesPerRequest: number;
  retryStrategy?: (times: number) => number;
}

/**
 * Parse Redis URL or use individual config values
 */
function parseRedisUrl(url: string): Partial<RedisConfig> {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port) || 6379,
      password: parsed.password || undefined,
      db: parseInt(parsed.pathname.slice(1)) || 0,
    };
  } catch (error) {
    console.error('Failed to parse REDIS_URL:', error);
    return {};
  }
}

/**
 * Get Redis configuration based on environment
 */
export function getRedisConfig(): RedisConfig {
  const redisUrl = process.env.REDIS_URL;
  const parsedConfig = redisUrl ? parseRedisUrl(redisUrl) : {};

  return {
    host: parsedConfig.host || process.env.REDIS_HOST || 'localhost',
    port: parsedConfig.port || parseInt(process.env.REDIS_PORT || '6379'),
    password: parsedConfig.password || process.env.REDIS_PASSWORD,
    db: parsedConfig.db || parseInt(process.env.REDIS_DB || '0'),
    tls: process.env.REDIS_TLS === 'true',
    enableOfflineQueue: true,
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      // Exponential backoff: 50ms, 100ms, 200ms, 400ms, max 2000ms
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  };
}

/**
 * Rate Limiting Configuration
 * 
 * Redis-based distributed rate limiting settings
 */
export const RATE_LIMIT_CONFIG = {
  // Oracle operations
  oracle_feed_query: {
    windowMs: 60000, // 1 minute
    maxRequests: 100,
    keyPrefix: 'rl:oracle:feed:',
  },
  oracle_request: {
    windowMs: 60000, // 1 minute
    maxRequests: 20,
    keyPrefix: 'rl:oracle:request:',
  },
  oracle_verification: {
    windowMs: 60000, // 1 minute
    maxRequests: 10,
    keyPrefix: 'rl:oracle:verify:',
  },
  
  // API operations
  api_read: {
    windowMs: 60000, // 1 minute
    maxRequests: 200,
    keyPrefix: 'rl:api:read:',
  },
  api_write: {
    windowMs: 60000, // 1 minute
    maxRequests: 50,
    keyPrefix: 'rl:api:write:',
  },
  
  // Authentication
  auth_login: {
    windowMs: 900000, // 15 minutes
    maxRequests: 5,
    keyPrefix: 'rl:auth:login:',
  },
};

/**
 * Cache Configuration
 * 
 * TTL settings for different cache types
 */
export const CACHE_TTL = {
  oracle_feed_data: 300, // 5 minutes
  verification_result: 3600, // 1 hour
  user_session: 86400, // 24 hours
  project_data: 1800, // 30 minutes
  analytics: 900, // 15 minutes
};

/**
 * Redis Key Patterns
 * 
 * Standardized key naming for Redis
 */
export const REDIS_KEY_PATTERNS = {
  rateLimitKey: (operation: string, identifier: string) => 
    `${RATE_LIMIT_CONFIG[operation as keyof typeof RATE_LIMIT_CONFIG]?.keyPrefix}${identifier}`,
  
  cacheKey: (type: string, id: string) => 
    `cache:${type}:${id}`,
  
  sessionKey: (sessionId: string) => 
    `session:${sessionId}`,
  
  lockKey: (resource: string, id: string) => 
    `lock:${resource}:${id}`,
};

/**
 * Initialize Redis client
 * 
 * Example usage with ioredis:
 * ```typescript
 * import Redis from 'ioredis';
 * import { getRedisConfig } from './redis.config';
 * 
 * const redis = new Redis(getRedisConfig());
 * ```
 */
export default getRedisConfig;



