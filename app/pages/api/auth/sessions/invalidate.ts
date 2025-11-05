import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import { authenticateRequest } from '../../../../lib/middleware/authMiddleware';
import { sessionService } from '../../../../lib/services/sessionService';
import { securityMiddleware } from '../../../../lib/middleware/security';
import { applyAuthRateLimit } from '../../../../lib/middleware/authRateLimiter';
import { getClientIP, getUserAgent } from '../../../../lib/middleware/requestLogger';
import { getTokenExpiration } from '../../../../lib/utils/jwt';
import { logger, logSecurityEvent } from '../../../../lib/logging/logger';
import { recordSecurityEvent, SecurityEventType } from '../../../../lib/services/securityMonitor';

/**
 * POST /api/auth/sessions/invalidate
 * 
 * Invalidate JWT session and add token to blacklist.
 * Alias for /api/auth/logout with enhanced cookie clearing.
 * 
 * Features:
 * - Adds token to blacklist for permanent invalidation
 * - Clears HTTP-only cookies
 * - Removes session from database
 * - Logs invalidation event
 * - Supports forced termination scenarios
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const securityPassed = securityMiddleware(req, res);
  if (!securityPassed) return;

  const rateLimitPassed = await applyAuthRateLimit('LOGOUT')(req, res);
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
    const authResult = await authenticateRequest(req);

    if (!authResult.isAuthenticated || !authResult.user || !authResult.token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
        statusCode: 401,
      });
    }

    const user = authResult.user;
    const token = authResult.token;
    const tokenExpiration = getTokenExpiration(token) || new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Blacklist current token
    await sessionService.blacklistToken(
      token,
      user.id,
      req.body?.reason || 'voluntary_logout',
      tokenExpiration
    );

    // Get session and blacklist refresh token
    const session = await sessionService.getSessionByToken(token);
    if (session?.refreshToken) {
      await sessionService.blacklistToken(
        session.refreshToken,
        user.id,
        req.body?.reason || 'voluntary_logout',
        session.expiresAt
      );
    }

    // Delete session
    const deleted = await sessionService.deleteSessionByToken(token);

    // Log invalidation
    logSecurityEvent(
      'session_invalidated',
      user.id,
      ipAddress,
      {
        walletAddress: user.walletAddress,
        reason: req.body?.reason || 'voluntary_logout',
        forced: req.body?.forced || false,
        userAgent,
      }
    );

    recordSecurityEvent(
      SecurityEventType.LOGOUT,
      ipAddress,
      user.id,
      {
        walletAddress: user.walletAddress,
        reason: req.body?.reason,
        forced: req.body?.forced,
        userAgent,
      },
      userAgent
    );

    logger.info('Session invalidated', {
      userId: user.id,
      sessionId: session?.id,
      reason: req.body?.reason,
      ipAddress,
    });

    // Clear HTTP-only cookies
    res.setHeader('Set-Cookie', [
      serialize('accessToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/',
      }),
      serialize('refreshToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/',
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Session invalidated successfully',
      invalidated: deleted,
      reason: req.body?.reason || 'voluntary_logout',
    });
  } catch (error) {
    logger.error('Session invalidation error', {
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






