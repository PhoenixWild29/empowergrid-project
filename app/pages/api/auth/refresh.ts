import { NextApiRequest, NextApiResponse } from 'next';
import { refreshTokenPair, getSessionIdFromRefreshToken } from '../../../lib/utils/jwt';
import { sessionService } from '../../../lib/services/sessionService';
import { securityMiddleware } from '../../../lib/middleware/security';
import { applyAuthRateLimit } from '../../../lib/middleware/authRateLimiter';
import { getClientIP, getUserAgent } from '../../../lib/middleware/requestLogger';
import { logger, logSecurityEvent } from '../../../lib/logging/logger';
import { z } from 'zod';

/**
 * POST /api/auth/refresh
 * 
 * Refresh JWT access token using a valid refresh token.
 * 
 * This endpoint:
 * 1. Validates the refresh token
 * 2. Checks if refresh token is blacklisted
 * 3. Verifies session exists
 * 4. Generates new access token
 * 5. Optionally rotates refresh token
 * 6. Updates session expiry
 * 
 * Request Body:
 * - refreshToken: string (required)
 * - rotateRefreshToken: boolean (optional, default: true)
 * 
 * Success Response (200):
 * {
 *   "success": true,
 *   "accessToken": "new_jwt_token",
 *   "refreshToken": "new_refresh_token" (if rotated),
 *   "expiresIn": 86400,
 *   "expiresAt": "2024-10-08T12:00:00.000Z"
 * }
 * 
 * Error Responses:
 * - 400: Bad Request (invalid input)
 * - 401: Unauthorized (invalid/expired/blacklisted refresh token)
 * - 405: Method Not Allowed (not POST)
 * - 429: Too Many Requests (rate limit exceeded)
 * - 500: Internal Server Error
 * 
 * Security Features:
 * - Rate limiting (10 requests per 15 minutes)
 * - Refresh token validation
 * - Blacklist checking
 * - Session verification
 * - Optional token rotation
 */

const RefreshRequestSchema = z.object({
  refreshToken: z.string().min(10, 'Invalid refresh token'),
  rotateRefreshToken: z.boolean().optional().default(true),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Apply security middleware
  const securityPassed = securityMiddleware(req, res);
  if (!securityPassed) {
    return;
  }

  // Apply auth-specific rate limiting (10 requests per 15 minutes)
  const rateLimitPassed = await applyAuthRateLimit('REFRESH')(req, res);
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
    const parseResult = RefreshRequestSchema.safeParse(req.body || {});

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid request data',
        details: parseResult.error.errors.map(e => e.message),
        statusCode: 400,
      });
    }

    const { refreshToken, rotateRefreshToken } = parseResult.data;

    // Check if refresh token is blacklisted
    const isBlacklisted = await sessionService.isTokenBlacklisted(refreshToken);

    if (isBlacklisted) {
      logger.warn('Blacklisted refresh token used', {
        tokenPrefix: refreshToken.substring(0, 16) + '...',
        ipAddress,
      });

      logSecurityEvent(
        'blacklisted_token_used',
        undefined,
        ipAddress,
        {
          tokenType: 'refresh',
          userAgent,
        }
      );

      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Refresh token has been revoked',
        statusCode: 401,
      });
    }

    // Extract session ID from refresh token
    const sessionId = getSessionIdFromRefreshToken(refreshToken);

    if (!sessionId) {
      logger.warn('Invalid refresh token format', {
        ipAddress,
      });

      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid refresh token',
        statusCode: 401,
      });
    }

    // Verify session exists and is valid
    const session = await sessionService.getSessionById(sessionId);

    if (!session) {
      logger.warn('Session not found for refresh token', {
        sessionId,
        ipAddress,
      });

      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Session not found or expired',
        statusCode: 401,
      });
    }

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      logger.info('Expired session used for token refresh', {
        sessionId,
        userId: session.userId,
        ipAddress,
      });

      // Delete expired session
      await sessionService.deleteSession(sessionId);

      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Session has expired. Please log in again.',
        statusCode: 401,
      });
    }

    // Refresh token pair
    const refreshResult = refreshTokenPair(refreshToken, rotateRefreshToken);

    if (!refreshResult.success || !refreshResult.accessToken) {
      logger.error('Token refresh failed', {
        error: refreshResult.error,
        sessionId,
        ipAddress,
      });

      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: refreshResult.error || 'Failed to refresh token',
        statusCode: 401,
      });
    }

    // Update session with new tokens
    const updateData: any = {
      token: refreshResult.accessToken.accessToken,
      expiresAt: refreshResult.accessToken.expiresAt,
    };

    if (refreshResult.newRefreshToken) {
      updateData.refreshToken = refreshResult.newRefreshToken.accessToken;

      // Blacklist old refresh token if rotated
      await sessionService.blacklistToken(
        refreshToken,
        session.userId,
        'refresh_token_rotated',
        session.expiresAt
      );
    }

    await sessionService.updateSession(sessionId, updateData);

    // Log successful refresh
    logger.info('Token refreshed successfully', {
      userId: session.userId,
      sessionId,
      rotated: !!refreshResult.newRefreshToken,
      ipAddress,
    });

    logSecurityEvent(
      'token_refreshed',
      session.userId,
      ipAddress,
      {
        sessionId,
        rotated: !!refreshResult.newRefreshToken,
        userAgent,
      }
    );

    // Return new tokens
    return res.status(200).json({
      success: true,
      accessToken: refreshResult.accessToken.accessToken,
      refreshToken: refreshResult.newRefreshToken?.accessToken,
      expiresIn: refreshResult.accessToken.expiresIn,
      expiresAt: refreshResult.accessToken.expiresAt.toISOString(),
      tokenType: 'Bearer',
    });
  } catch (error) {
    // Log error
    logger.error('Token refresh endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ipAddress,
      userAgent,
    });

    // Return error response
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred during token refresh',
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




