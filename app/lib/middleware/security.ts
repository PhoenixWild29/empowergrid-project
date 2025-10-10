import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Security configuration for the application
 */
export const SECURITY_CONFIG = {
  // Allowed origins for CORS (configure based on environment)
  ALLOWED_ORIGINS: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'https://empowergrid.io',
    'https://www.empowergrid.io',
  ],
  
  // Content Security Policy directives
  CSP_DIRECTIVES: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", 'https://api.devnet.solana.com', 'https://api.mainnet-beta.solana.com'],
    'frame-ancestors': ["'none'"],
  },
  
  // HSTS configuration
  HSTS_MAX_AGE: 31536000, // 1 year in seconds
  
  // Rate limiting configuration
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100, // Max requests per window
  },
};

/**
 * Type for Next.js API middleware
 */
export type NextApiMiddleware = (
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) => void | Promise<void>;

/**
 * Apply security headers to API responses
 * 
 * Headers applied:
 * - Content-Security-Policy
 * - Strict-Transport-Security (HSTS)
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - X-XSS-Protection
 * - Referrer-Policy
 * 
 * @param req - Next.js API request
 * @param res - Next.js API response
 */
export function applySecurityHeaders(
  req: NextApiRequest,
  res: NextApiResponse
): void {
  // Content Security Policy
  const cspHeader = Object.entries(SECURITY_CONFIG.CSP_DIRECTIVES)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
  
  res.setHeader('Content-Security-Policy', cspHeader);
  
  // Strict-Transport-Security (HSTS)
  // Only apply in production with HTTPS
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      `max-age=${SECURITY_CONFIG.HSTS_MAX_AGE}; includeSubDomains; preload`
    );
  }
  
  // X-Frame-Options - Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-Content-Type-Options - Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-XSS-Protection - Enable browser XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer-Policy - Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove X-Powered-By header to avoid exposing server technology
  res.removeHeader('X-Powered-By');
}

/**
 * Configure CORS headers for API endpoints
 * 
 * @param req - Next.js API request
 * @param res - Next.js API response
 * @returns boolean - true if origin is allowed, false otherwise
 */
export function configureCORS(
  req: NextApiRequest,
  res: NextApiResponse
): boolean {
  const origin = req.headers.origin;
  
  // Check if origin is allowed
  const isAllowedOrigin = 
    !origin || 
    SECURITY_CONFIG.ALLOWED_ORIGINS.includes(origin) ||
    (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost'));
  
  if (isAllowedOrigin && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  // Set other CORS headers
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  );
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return false; // Don't proceed with handler
  }
  
  return isAllowedOrigin;
}

/**
 * Simple in-memory rate limiter
 * In production, use Redis or a dedicated rate limiting service
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  /**
   * Check if a client has exceeded rate limit
   * 
   * @param identifier - Client identifier (IP address or user ID)
   * @param maxRequests - Maximum requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns boolean - true if limit exceeded, false otherwise
   */
  isRateLimited(
    identifier: string,
    maxRequests: number = SECURITY_CONFIG.RATE_LIMIT.MAX_REQUESTS,
    windowMs: number = SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS
  ): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get existing requests for this identifier
    let requests = this.requests.get(identifier) || [];
    
    // Filter out requests outside the current window
    requests = requests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (requests.length >= maxRequests) {
      return true;
    }
    
    // Add current request
    requests.push(now);
    this.requests.set(identifier, requests);
    
    // Cleanup old entries periodically
    this.cleanup(windowStart);
    
    return false;
  }
  
  /**
   * Clean up old rate limit entries
   */
  private cleanup(windowStart: number): void {
    // Only cleanup occasionally to avoid performance impact
    if (Math.random() > 0.99) { // 1% chance
      this.requests.forEach((timestamps, key) => {
        const validTimestamps = timestamps.filter(ts => ts > windowStart);
        if (validTimestamps.length === 0) {
          this.requests.delete(key);
        } else {
          this.requests.set(key, validTimestamps);
        }
      });
    }
  }
  
  /**
   * Reset rate limit for a specific identifier
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
  
  /**
   * Clear all rate limit data
   */
  clear(): void {
    this.requests.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Apply rate limiting to API requests
 * 
 * @param req - Next.js API request
 * @param res - Next.js API response
 * @returns boolean - true if request should proceed, false if rate limited
 */
export function applyRateLimit(
  req: NextApiRequest,
  res: NextApiResponse
): boolean {
  // Get client identifier (IP address or user ID from token)
  const identifier = getClientIdentifier(req);
  
  // Check rate limit
  if (rateLimiter.isRateLimited(identifier)) {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS / 1000),
    });
    return false;
  }
  
  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', SECURITY_CONFIG.RATE_LIMIT.MAX_REQUESTS.toString());
  res.setHeader('X-RateLimit-Window', SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS.toString());
  
  return true;
}

/**
 * Get client identifier for rate limiting
 * Uses IP address, falling back to user agent
 * 
 * @param req - Next.js API request
 * @returns string - Client identifier
 */
export function getClientIdentifier(req: NextApiRequest): string {
  // Try to get real IP from headers (for proxied requests)
  const forwardedFor = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  
  if (typeof forwardedFor === 'string') {
    return forwardedFor.split(',')[0].trim();
  }
  
  if (typeof realIp === 'string') {
    return realIp;
  }
  
  // Fallback to socket address
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Comprehensive security middleware that applies all security measures
 * Use this as the main security middleware for API routes
 * 
 * @param req - Next.js API request
 * @param res - Next.js API response
 * @returns boolean - true if request should proceed, false otherwise
 */
export function securityMiddleware(
  req: NextApiRequest,
  res: NextApiResponse
): boolean {
  // Apply security headers
  applySecurityHeaders(req, res);
  
  // Configure CORS
  const corsAllowed = configureCORS(req, res);
  if (!corsAllowed || req.method === 'OPTIONS') {
    return false;
  }
  
  // Apply rate limiting
  const rateLimitAllowed = applyRateLimit(req, res);
  if (!rateLimitAllowed) {
    return false;
  }
  
  return true;
}

/**
 * Export for testing
 */
export const __TEST__ = {
  rateLimiter,
  getClientIdentifier,
};
