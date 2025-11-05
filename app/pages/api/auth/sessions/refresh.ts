import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import { refreshTokenPair, getSessionIdFromRefreshToken } from '../../../../lib/utils/jwt';
import { sessionService } from '../../../../lib/services/sessionService';
import { securityMiddleware } from '../../../../lib/middleware/security';
import { applyAuthRateLimit } from '../../../../lib/middleware/authRateLimiter';
import { getClientIP, getUserAgent } from '../../../../lib/middleware/requestLogger';
import { logger, logSecurityEvent } from '../../../../lib/logging/logger';
import { recordSecurityEvent, SecurityEventType } from '../../../../lib/services/securityMonitor';
import { z } from 'zod';

/**
 * POST /api/auth/sessions/refresh
 * 
 * Refresh JWT access token with sliding expiration window.
 * Implements HTTP-only cookie storage for enhanced security.
 * 
 * Request: Authorization header or cookies containing refreshToken
 * 
 * Response: New tokens set in HTTP-only cookies
 */

const RefreshRequestSchema = z.object({
  refreshToken: z.string().min(10).optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const securityPassed = securityMiddleware(req, res);
  if (!securityPassed) return;

  const rateLimitPassed = await applyAuthRateLimit('REFRESH')(req, res);
  if (!rateLimitPassed) return;

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
      statusCode: 405,
    });
  }

  const ipAddress = getClientIP(req);
  const userAgent = getUserAgent(req);

  try {
    const parseResult = RefreshRequestSchema.safeParse(req.body || {});
    
    // Get refresh token from body or cookie
    const refreshToken = parseResult.success 
      ? parseResult.data.refreshToken || req.cookies.refreshToken
      : req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Refresh token required',
        statusCode: 400,
      });
    }

    const isBlacklisted = await sessionService.isTokenBlacklisted(refreshToken);
    if (isBlacklisted) {
      logger.warn('Blacklisted refresh token used', { ipAddress });
      
      recordSecurityEvent(
        SecurityEventType.BLACKLISTED_TOKEN_USED,
        ipAddress,
        undefined,
        { tokenType: 'refresh', userAgent },
        userAgent
      );

      return res.status(401).json({
        success: false,
        valid: false,
        status: 'blacklisted',
        error: 'Token has been revoked',
        statusCode: 401,
      });
    }

    const sessionId = getSessionIdFromRefreshToken(refreshToken);
    if (!sessionId) {
      return res.status(401).json({
        success: false,
        valid: false,
        status: 'invalid',
        error: 'Invalid refresh token',
        statusCode: 401,
      });
    }

    const session = await sessionService.getSessionById(sessionId);
    if (!session || new Date() > session.expiresAt) {
      return res.status(401).json({
        success: false,
        valid: false,
        status: 'expired',
        error: 'Session expired',
        statusCode: 401,
      });
    }

    const refreshResult = refreshTokenPair(refreshToken, true);

    if (!refreshResult.success || !refreshResult.accessToken) {
      logger.error('Token refresh failed', { sessionId, ipAddress });

      return res.status(401).json({
        success: false,
        valid: false,
        status: 'refresh_failed',
        error: refreshResult.error,
        statusCode: 401,
      });
    }

    // Blacklist old refresh token
    await sessionService.blacklistToken(
      refreshToken,
      session.userId,
      'refresh_token_rotated',
      session.expiresAt
    );

    // Update session
    await sessionService.updateSession(sessionId, {
      token: refreshResult.accessToken.accessToken,
      refreshToken: refreshResult.newRefreshToken?.accessToken,
      expiresAt: refreshResult.accessToken.expiresAt,
    });

    logger.info('Token refreshed successfully', {
      userId: session.userId,
      sessionId,
      ipAddress,
    });

    recordSecurityEvent(
      SecurityEventType.TOKEN_REFRESH,
      ipAddress,
      session.userId,
      { sessionId, userAgent },
      userAgent
    );

    // Set HTTP-only cookies
    const isProduction = process.env.NODE_ENV === 'production';

    res.setHeader('Set-Cookie', [
      serialize('accessToken', refreshResult.accessToken.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: refreshResult.accessToken.expiresIn,
        path: '/',
      }),
      serialize('refreshToken', refreshResult.newRefreshToken?.accessToken || '', {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      }),
    ]);

    return res.status(200).json({
      success: true,
      valid: true,
      status: 'refreshed',
      expiresIn: refreshResult.accessToken.expiresIn,
      expiresAt: refreshResult.accessToken.expiresAt.toISOString(),
    });
  } catch (error) {
    logger.error('Session refresh error', {
      error: error instanceof Error ? error.message : 'Unknown',
      ipAddress,
    });

    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      statusCode: 500,
    });
  }
}






