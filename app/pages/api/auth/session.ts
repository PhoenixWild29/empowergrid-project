import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateRequest } from '../../../lib/middleware/authMiddleware';
import { sessionService } from '../../../lib/services/sessionService';
import { securityMiddleware } from '../../../lib/middleware/security';
import { applyAuthRateLimit } from '../../../lib/middleware/authRateLimiter';
import { getClientIP, getUserAgent } from '../../../lib/middleware/requestLogger';
import { getTokenExpiration, getTokenTimeRemaining, decodeToken } from '../../../lib/utils/jwt';
import { logger } from '../../../lib/logging/logger';
import { recordSecurityEvent, SecurityEventType } from '../../../lib/services/securityMonitor';

/**
 * GET /api/auth/session
 * 
 * Validate current JWT token and return user session information.
 * 
 * This endpoint:
 * 1. Verifies the JWT token is valid
 * 2. Checks if token is blacklisted
 * 3. Validates session exists and is active
 * 4. Returns user data and session metadata
 * 
 * Request:
 * - Authorization: Bearer <token> (header)
 * 
 * Success Response (200):
 * {
 *   "success": true,
 *   "user": {
 *     "id": "user_id",
 *     "walletAddress": "wallet_address",
 *     "username": "username",
 *     "role": "FUNDER",
 *     "verified": false,
 *     "reputation": 0
 *   },
 *   "session": {
 *     "id": "session_id",
 *     "createdAt": "2024-10-07T12:00:00Z",
 *     "expiresAt": "2024-10-08T12:00:00Z",
 *     "ipAddress": "192.168.1.1",
 *     "userAgent": "Mozilla/5.0...",
 *     "isActive": true
 *   },
 *   "token": {
 *     "expiresIn": 86400,
 *     "expiresAt": "2024-10-08T12:00:00Z",
 *     "issuedAt": "2024-10-07T12:00:00Z"
 *   }
 * }
 * 
 * Error Responses:
 * - 401: Unauthorized (no token, invalid token, expired, or blacklisted)
 * - 405: Method Not Allowed (not GET)
 * - 429: Too Many Requests (rate limit exceeded)
 * - 500: Internal Server Error
 * 
 * Security Features:
 * - JWT signature verification
 * - Token blacklist checking
 * - Session validation
 * - Expiry checking
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Apply security middleware
  const securityPassed = securityMiddleware(req, res);
  if (!securityPassed) {
    return;
  }

  // Apply auth-specific rate limiting (50 requests per 15 minutes)
  const rateLimitPassed = await applyAuthRateLimit('SESSION')(req, res);
  if (!rateLimitPassed) {
    return;
  }

  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
      message: 'Only GET method is allowed for this endpoint',
      statusCode: 405,
    });
  }

  // Get request metadata
  const ipAddress = getClientIP(req);
  const userAgent = getUserAgent(req);

  try {
    // Authenticate request
    const authResult = await authenticateRequest(req);

    if (!authResult.isAuthenticated || !authResult.user || !authResult.token) {
      logger.info('Session validation failed', {
        ipAddress,
        userAgent,
        error: authResult.error,
      });

      // Record security event for failed validation
      recordSecurityEvent(
        SecurityEventType.SESSION_ENUMERATION_ATTEMPT,
        ipAddress,
        undefined,
        {
          error: authResult.error,
          userAgent,
        },
        userAgent
      );

      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: authResult.error || 'Invalid or expired session',
        statusCode: 401,
      });
    }

    const user = authResult.user;
    const token = authResult.token;

    // Get session details
    const session = await sessionService.getSessionByToken(token);

    if (!session) {
      logger.warn('Session not found for valid token', {
        userId: user.id,
        tokenPrefix: token.substring(0, 16) + '...',
      });

      return res.status(401).json({
        success: false,
        error: 'Session Not Found',
        message: 'Session has been terminated',
        statusCode: 401,
      });
    }

    // Get token information
    const tokenExpiration = getTokenExpiration(token);
    const tokenTimeRemaining = getTokenTimeRemaining(token);
    const decodedToken = decodeToken(token);

    // Check if session is still active
    const isActive = new Date() < session.expiresAt;

    // Log successful validation
    logger.debug('Session validated successfully', {
      userId: user.id,
      sessionId: session.id,
      ipAddress,
    });

    // Prepare response data
    const responseData = {
      success: true,
      user: {
        id: user.id,
        walletAddress: typeof user.walletAddress === 'string' 
          ? user.walletAddress 
          : user.walletAddress.toBase58 
            ? user.walletAddress.toBase58() 
            : String(user.walletAddress),
        username: user.username,
        email: user.email,
        role: user.role,
        verified: user.verified,
        reputation: user.reputation,
        createdAt: user.createdAt.toISOString(),
      },
      session: {
        id: session.id,
        createdAt: session.createdAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
        ipAddress: session.ipAddress || undefined,
        userAgent: session.userAgent || undefined,
        isActive,
      },
      token: {
        expiresIn: tokenTimeRemaining || 0,
        expiresAt: tokenExpiration ? tokenExpiration.toISOString() : new Date().toISOString(),
        issuedAt: decodedToken?.iat 
          ? new Date(decodedToken.iat * 1000).toISOString() 
          : new Date().toISOString(),
      },
    };

    // Return session data
    return res.status(200).json(responseData);
  } catch (error) {
    // Log error
    logger.error('Session validation endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ipAddress,
      userAgent,
    });

    // Return error response
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred validating session',
      details:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : 'Unknown error'
          : undefined,
      statusCode: 500,
    });
  }
}

