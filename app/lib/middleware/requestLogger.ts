import { NextApiRequest, NextApiResponse } from 'next';
import { logger, logSecurityEvent } from '../logging/logger';

/**
 * Interface for logged request data
 */
export interface RequestLogData {
  method: string;
  url: string;
  ip: string;
  userAgent: string;
  timestamp: string;
  walletAddress?: string;
  userId?: string;
  statusCode?: number;
  duration?: number;
  error?: string;
}

/**
 * Extract client IP address from request
 * Handles various proxy scenarios
 * 
 * @param req - Next.js API request
 * @returns string - Client IP address
 */
export function getClientIP(req: NextApiRequest): string {
  // Try to get real IP from headers (for proxied requests)
  const forwardedFor = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const cfConnectingIp = req.headers['cf-connecting-ip']; // Cloudflare
  
  if (typeof forwardedFor === 'string') {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }
  
  if (typeof realIp === 'string') {
    return realIp;
  }
  
  if (typeof cfConnectingIp === 'string') {
    return cfConnectingIp;
  }
  
  // Fallback to socket address
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Extract user agent from request
 * 
 * @param req - Next.js API request
 * @returns string - User agent string
 */
export function getUserAgent(req: NextApiRequest): string {
  const userAgent = req.headers['user-agent'];
  return typeof userAgent === 'string' ? userAgent : 'unknown';
}

/**
 * Extract wallet address from request if available
 * Can be from Authorization header, query params, or body
 * 
 * @param req - Next.js API request
 * @returns string | undefined - Wallet address if found
 */
export function extractWalletAddress(req: NextApiRequest): string | undefined {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // In a real implementation, decode JWT and extract wallet address
    // For now, we'll check the request body or query
  }
  
  // Check request body
  if (req.body && typeof req.body === 'object') {
    if (req.body.walletAddress) {
      return req.body.walletAddress;
    }
    if (req.body.wallet) {
      return req.body.wallet;
    }
  }
  
  // Check query params
  if (req.query.walletAddress) {
    return Array.isArray(req.query.walletAddress) 
      ? req.query.walletAddress[0] 
      : req.query.walletAddress;
  }
  
  return undefined;
}

/**
 * Create request log data object
 * 
 * @param req - Next.js API request
 * @returns RequestLogData - Structured request data
 */
export function createRequestLogData(req: NextApiRequest): RequestLogData {
  return {
    method: req.method || 'UNKNOWN',
    url: req.url || 'unknown',
    ip: getClientIP(req),
    userAgent: getUserAgent(req),
    timestamp: new Date().toISOString(),
    walletAddress: extractWalletAddress(req),
  };
}

/**
 * Log authentication challenge generation event
 * 
 * @param req - Next.js API request
 * @param walletAddress - Wallet address requesting challenge
 * @param nonce - Generated nonce
 * @param success - Whether challenge generation was successful
 */
export function logChallengeGeneration(
  req: NextApiRequest,
  walletAddress: string | undefined,
  nonce: string,
  success: boolean
): void {
  const logData = createRequestLogData(req);
  
  logger.info('Authentication Challenge Generated', {
    ...logData,
    walletAddress,
    nonce: nonce.substring(0, 16) + '...', // Log only prefix for security
    success,
    event: 'challenge_generation',
  });
  
  // Also log as security event
  logSecurityEvent(
    'challenge_generation',
    undefined, // userId not available yet
    logData.ip,
    {
      walletAddress,
      userAgent: logData.userAgent,
      success,
    }
  );
}

/**
 * Log authentication attempt (login)
 * 
 * @param req - Next.js API request
 * @param walletAddress - Wallet address attempting login
 * @param success - Whether authentication was successful
 * @param reason - Failure reason if unsuccessful
 */
export function logAuthenticationAttempt(
  req: NextApiRequest,
  walletAddress: string,
  success: boolean,
  reason?: string
): void {
  const logData = createRequestLogData(req);
  
  const level = success ? 'info' : 'warn';
  
  logger.log(level, 'Authentication Attempt', {
    ...logData,
    walletAddress,
    success,
    reason,
    event: 'authentication_attempt',
  });
  
  // Log as security event if failed
  if (!success) {
    logSecurityEvent(
      'failed_authentication',
      undefined,
      logData.ip,
      {
        walletAddress,
        reason,
        userAgent: logData.userAgent,
      }
    );
  }
}

/**
 * Log API request with timing information
 * 
 * @param req - Next.js API request
 * @param res - Next.js API response
 * @param duration - Request duration in milliseconds
 */
export function logApiRequest(
  req: NextApiRequest,
  res: NextApiResponse,
  duration: number
): void {
  const logData = createRequestLogData(req);
  
  const level = res.statusCode >= 400 ? 'warn' : 'info';
  
  logger.log(level, 'API Request', {
    ...logData,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    contentLength: res.getHeader('content-length'),
  });
}

/**
 * Log suspicious activity
 * 
 * @param req - Next.js API request
 * @param activityType - Type of suspicious activity
 * @param details - Additional details about the activity
 */
export function logSuspiciousActivity(
  req: NextApiRequest,
  activityType: string,
  details?: Record<string, any>
): void {
  const logData = createRequestLogData(req);
  
  logger.warn('Suspicious Activity Detected', {
    ...logData,
    activityType,
    ...details,
  });
  
  logSecurityEvent(
    `suspicious_activity_${activityType}`,
    details?.userId,
    logData.ip,
    {
      ...details,
      userAgent: logData.userAgent,
    }
  );
}

/**
 * Request logger middleware for Next.js API routes
 * Logs all incoming requests with timing information
 * 
 * Usage:
 * ```typescript
 * export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 *   const startTime = Date.now();
 *   
 *   try {
 *     // Your handler logic here
 *     res.status(200).json({ success: true });
 *   } finally {
 *     logApiRequest(req, res, Date.now() - startTime);
 *   }
 * }
 * ```
 * 
 * @param req - Next.js API request
 * @param res - Next.js API response
 * @returns Promise<void>
 */
export async function requestLoggerMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  handler: () => Promise<void>
): Promise<void> {
  const startTime = Date.now();
  const logData = createRequestLogData(req);
  
  // Log incoming request
  logger.http('Incoming Request', {
    method: logData.method,
    url: logData.url,
    ip: logData.ip,
    userAgent: logData.userAgent,
  });
  
  try {
    // Execute the handler
    await handler();
    
    // Log successful request
    const duration = Date.now() - startTime;
    logApiRequest(req, res, duration);
  } catch (error) {
    // Log failed request
    const duration = Date.now() - startTime;
    
    logger.error('Request Failed', {
      ...logData,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    throw error; // Re-throw to be handled by error handler
  }
}

/**
 * Create a wrapped handler with automatic request logging
 * 
 * Usage:
 * ```typescript
 * export default withRequestLogging(async (req, res) => {
 *   // Your handler logic here
 *   res.status(200).json({ success: true });
 * });
 * ```
 */
export function withRequestLogging(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const startTime = Date.now();
    
    try {
      await handler(req, res);
    } finally {
      const duration = Date.now() - startTime;
      logApiRequest(req, res, duration);
    }
  };
}

/**
 * Rate limit violation logger
 * 
 * @param req - Next.js API request
 * @param identifier - Client identifier (IP or user ID)
 * @param limit - Rate limit that was exceeded
 */
export function logRateLimitViolation(
  req: NextApiRequest,
  identifier: string,
  limit: number
): void {
  const logData = createRequestLogData(req);
  
  logger.warn('Rate Limit Exceeded', {
    ...logData,
    identifier,
    limit,
    event: 'rate_limit_exceeded',
  });
  
  logSecurityEvent(
    'rate_limit_exceeded',
    undefined,
    logData.ip,
    {
      identifier,
      limit,
      url: logData.url,
      userAgent: logData.userAgent,
    }
  );
}

/**
 * Export for testing
 */
export const __TEST__ = {
  getClientIP,
  getUserAgent,
  extractWalletAddress,
  createRequestLogData,
};


