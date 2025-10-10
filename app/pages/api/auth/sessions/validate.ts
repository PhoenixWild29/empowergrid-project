import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateRequest } from '../../../../lib/middleware/authMiddleware';
import { sessionService } from '../../../../lib/services/sessionService';
import { securityMiddleware } from '../../../../lib/middleware/security';
import { applyAuthRateLimit } from '../../../../lib/middleware/authRateLimiter';
import { getClientIP, getUserAgent } from '../../../../lib/middleware/requestLogger';
import { getTokenExpiration, getTokenTimeRemaining, decodeToken, verifyToken } from '../../../../lib/utils/jwt';
import { logger } from '../../../../lib/logging/logger';
import { recordSecurityEvent, SecurityEventType } from '../../../../lib/services/securityMonitor';

/**
 * GET /api/auth/sessions/validate
 * 
 * Validate JWT token and return detailed validation status.
 * Alias for /api/auth/session with enhanced validation details.
 * 
 * Validation checks:
 * 1. JWT signature integrity
 * 2. Token expiration status
 * 3. Blacklist check
 * 4. Session existence
 * 5. User claims consistency
 * 
 * Returns detailed status: valid, expired, blacklisted, or invalid signature
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const securityPassed = securityMiddleware(req, res);
  if (!securityPassed) return;

  const rateLimitPassed = await applyAuthRateLimit('SESSION')(req, res);
  if (!rateLimitPassed) return;

  if (req.method !== 'GET') {
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
      logger.info('Session validation failed', {
        ipAddress,
        error: authResult.error,
      });

      recordSecurityEvent(
        SecurityEventType.SESSION_ENUMERATION_ATTEMPT,
        ipAddress,
        undefined,
        { error: authResult.error, userAgent },
        userAgent
      );

      // Determine specific failure reason
      const token = authResult.token || req.headers.authorization?.replace('Bearer ', '');
      let validationStatus = 'invalid';
      
      if (token) {
        const isBlacklisted = await sessionService.isTokenBlacklisted(token);
        if (isBlacklisted) {
          validationStatus = 'blacklisted';
        } else {
          const verification = verifyToken(token);
          if (verification.expired) {
            validationStatus = 'expired';
          } else if (!verification.isValid) {
            validationStatus = 'invalid_signature';
          }
        }
      }

      return res.status(401).json({
        success: false,
        valid: false,
        status: validationStatus,
        error: authResult.error || 'Invalid session',
        statusCode: 401,
      });
    }

    const user = authResult.user;
    const token = authResult.token;
    const session = await sessionService.getSessionByToken(token);

    if (!session) {
      return res.status(401).json({
        success: false,
        valid: false,
        status: 'session_not_found',
        error: 'Session not found',
        statusCode: 401,
      });
    }

    const tokenExpiration = getTokenExpiration(token);
    const tokenTimeRemaining = getTokenTimeRemaining(token);
    const isActive = new Date() < session.expiresAt;

    logger.debug('Session validated successfully', {
      userId: user.id,
      sessionId: session.id,
    });

    return res.status(200).json({
      success: true,
      valid: true,
      status: 'valid',
      user: {
        id: user.id,
        walletAddress: typeof user.walletAddress === 'string'
          ? user.walletAddress
          : user.walletAddress.toBase58?.() || String(user.walletAddress),
        role: user.role,
      },
      session: {
        id: session.id,
        expiresAt: session.expiresAt.toISOString(),
        isActive,
      },
      token: {
        expiresIn: tokenTimeRemaining || 0,
        expiresAt: tokenExpiration?.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Session validation error', {
      error: error instanceof Error ? error.message : 'Unknown',
      ipAddress,
    });

    return res.status(500).json({
      success: false,
      valid: false,
      status: 'error',
      error: 'Internal server error',
      statusCode: 500,
    });
  }
}




