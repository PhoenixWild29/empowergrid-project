import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateRequest } from '../../../lib/middleware/authMiddleware';
import { sessionService } from '../../../lib/services/sessionService';
import { securityMiddleware } from '../../../lib/middleware/security';
import { applyAuthRateLimit } from '../../../lib/middleware/authRateLimiter';
import { getClientIP, getUserAgent } from '../../../lib/middleware/requestLogger';
import {
  LogoutRequestSchema,
  safeValidateRequestBody,
  formatZodErrors,
} from '../../../lib/schemas/authSchemas';
import { verifyToken, getTokenExpiration } from '../../../lib/utils/jwt';
import { logger, logSecurityEvent } from '../../../lib/logging/logger';
import { recordSecurityEvent, SecurityEventType } from '../../../lib/services/securityMonitor';

/**
 * POST /api/auth/logout
 * 
 * Terminate user session and blacklist JWT token to prevent reuse.
 * 
 * This endpoint:
 * 1. Verifies the JWT token is valid
 * 2. Deletes the session from database
 * 3. Adds token to blacklist
 * 4. Logs the logout event
 * 
 * Request:
 * - Authorization: Bearer <token> (header)
 * OR
 * - Body: { "token": "<token>", "allDevices": false }
 * 
 * Optional:
 * - allDevices: boolean - If true, logout from all devices (default: false)
 * 
 * Success Response (200):
 * {
 *   "success": true,
 *   "message": "Logged out successfully",
 *   "sessionsTerminated": 1
 * }
 * 
 * Error Responses:
 * - 401: Unauthorized (no token or invalid token)
 * - 405: Method Not Allowed (not POST)
 * - 429: Too Many Requests (rate limit exceeded)
 * - 500: Internal Server Error
 * 
 * Security Features:
 * - Token blacklisting (prevents reuse)
 * - Session termination
 * - Multi-device logout support
 * - Comprehensive logging
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

  // Apply auth-specific rate limiting (20 requests per 15 minutes)
  const rateLimitPassed = await applyAuthRateLimit('LOGOUT')(req, res);
  if (!rateLimitPassed) {
    return;
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
      message: 'Only POST method is allowed for this endpoint',
      statusCode: 405,
    });
  }

  // Get request metadata
  const ipAddress = getClientIP(req);
  const userAgent = getUserAgent(req);

  try {
    // Validate request body
    const validationResult = safeValidateRequestBody(
      LogoutRequestSchema,
      req.body || {}
    );

    if (!validationResult.success) {
      const errors = formatZodErrors(validationResult.error);

      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid request data',
        details: errors,
        statusCode: 400,
      });
    }

    const { allDevices } = validationResult.data;

    // Authenticate request
    const authResult = await authenticateRequest(req);

    if (!authResult.isAuthenticated || !authResult.user || !authResult.token) {
      logger.warn('Logout attempted without valid authentication', {
        ipAddress,
        userAgent,
      });

      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Valid authentication required to logout',
        statusCode: 401,
      });
    }

    const user = authResult.user;
    const token = authResult.token;

    let sessionsTerminated = 0;

    if (allDevices) {
      // Logout from all devices
      logger.info('Logging out user from all devices', {
        userId: user.id,
        walletAddress: user.walletAddress,
      });

      // Get all user sessions
      const sessions = await sessionService.getUserSessions(user.id);

      // Blacklist all tokens
      const tokenExpiration = getTokenExpiration(token) || new Date(Date.now() + 24 * 60 * 60 * 1000);

      for (const session of sessions) {
        await sessionService.blacklistToken(
          session.token,
          user.id,
          'logout_all_devices',
          session.expiresAt
        );

        if (session.refreshToken) {
          await sessionService.blacklistToken(
            session.refreshToken,
            user.id,
            'logout_all_devices',
            session.expiresAt
          );
        }
      }

      // Delete all sessions
      sessionsTerminated = await sessionService.deleteAllUserSessions(user.id);
    } else {
      // Logout from current device only
      logger.info('Logging out user from current device', {
        userId: user.id,
        walletAddress: user.walletAddress,
        token: token.substring(0, 16) + '...',
      });

      // Get token expiration for blacklist
      const tokenExpiration = getTokenExpiration(token) || new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Blacklist current token
      await sessionService.blacklistToken(
        token,
        user.id,
        'logout',
        tokenExpiration
      );

      // Get session to blacklist refresh token
      const session = await sessionService.getSessionByToken(token);
      if (session?.refreshToken) {
        await sessionService.blacklistToken(
          session.refreshToken,
          user.id,
          'logout',
          session.expiresAt
        );
      }

      // Delete current session
      const deleted = await sessionService.deleteSessionByToken(token);
      sessionsTerminated = deleted ? 1 : 0;
    }

    // Log successful logout
    logSecurityEvent(
      'logout_successful',
      user.id,
      ipAddress,
      {
        walletAddress: user.walletAddress,
        allDevices,
        sessionsTerminated,
        userAgent,
      }
    );

    // Record security event
    recordSecurityEvent(
      SecurityEventType.LOGOUT,
      ipAddress,
      user.id,
      {
        walletAddress: user.walletAddress,
        allDevices,
        sessionsTerminated,
        userAgent,
      },
      userAgent
    );

    logger.info('User logged out successfully', {
      userId: user.id,
      walletAddress: user.walletAddress,
      allDevices,
      sessionsTerminated,
      ipAddress,
    });

    // Return success response
    return res.status(200).json({
      success: true,
      message: allDevices
        ? `Logged out from all devices (${sessionsTerminated} sessions)`
        : 'Logged out successfully',
      sessionsTerminated,
    });
  } catch (error) {
    // Log error
    logger.error('Logout endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ipAddress,
      userAgent,
    });

    // Return error response
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred during logout',
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

