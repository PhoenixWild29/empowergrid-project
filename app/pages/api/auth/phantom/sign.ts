import { NextApiRequest, NextApiResponse } from 'next';
import { authService } from '../../../../lib/services/authService';
import { securityMiddleware } from '../../../../lib/middleware/security';
import { applyAuthRateLimit } from '../../../../lib/middleware/authRateLimiter';
import { getClientIP, getUserAgent, logAuthenticationAttempt } from '../../../../lib/middleware/requestLogger';
import { LoginRequestSchema, safeValidateRequestBody, formatZodErrors } from '../../../../lib/schemas/authSchemas';
import { WalletProvider } from '../../../../lib/config/auth';
import { recordSecurityEvent, SecurityEventType } from '../../../../lib/services/securityMonitor';

// Simple logger
const logger = {
  info: (msg: string, data?: any) => console.log('[INFO]', msg, data || ''),
  error: (msg: string, data?: any) => console.error('[ERROR]', msg, data || ''),
  warn: (msg: string, data?: any) => console.warn('[WARN]', msg, data || ''),
};

/**
 * POST /api/auth/phantom/sign
 * 
 * Phantom-specific signature verification and authentication endpoint.
 * 
 * Optimized for Phantom wallet with:
 * - Phantom ed25519 signature verification
 * - Phantom message format handling
 * - Replay attack protection via nonce validation
 * - Fast verification (< 2 seconds)
 * - JWT token generation
 * - Session creation
 * 
 * This is essentially an alias for /api/auth/login with Phantom-specific logging.
 * 
 * Request Body:
 * - walletAddress: string
 * - signature: string (base58 encoded)
 * - message: string (challenge message)
 * - nonce: string
 * 
 * Response (201):
 * - JWT tokens
 * - User data
 * - Session ID
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const startTime = Date.now();

  const securityPassed = securityMiddleware(req, res);
  if (!securityPassed) return;

  const rateLimitPassed = await applyAuthRateLimit('LOGIN')(req, res);
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
    // Validate request
    const validationResult = safeValidateRequestBody(LoginRequestSchema, req.body || {});

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

    const loginRequest = validationResult.data;

    // Phantom-specific logging
    logger.info('Phantom wallet authentication attempt', {
      walletAddress: loginRequest.walletAddress.slice(0, 8) + '...',
      ipAddress,
      userAgent,
    });

    // Perform authentication (signature verification)
    const loginResult = await authService.login(
      {
        walletAddress: loginRequest.walletAddress,
        signature: loginRequest.signature,
        message: loginRequest.message,
        nonce: loginRequest.nonce,
        provider: WalletProvider.PHANTOM, // Force Phantom provider
      },
      {
        ipAddress,
        userAgent,
      }
    );

    // Check verification time (should be < 2 seconds)
    const verificationTime = Date.now() - startTime;
    
    if (verificationTime > 2000) {
      logger.warn('Phantom signature verification exceeded 2s threshold', {
        verificationTime,
        walletAddress: loginRequest.walletAddress.slice(0, 8) + '...',
      });
    }

    // Handle failure
    if (!loginResult.success || !loginResult.user) {
      logAuthenticationAttempt(req, loginRequest.walletAddress, false, loginResult.error?.message);
      
      recordSecurityEvent(
        SecurityEventType.LOGIN_FAILURE,
        ipAddress,
        undefined,
        {
          walletAddress: loginRequest.walletAddress,
          provider: 'phantom',
          reason: loginResult.error?.code,
          verificationTime,
          userAgent,
        },
        userAgent
      );

      const statusCode = loginResult.error?.code === 'INVALID_SIGNATURE' ? 401 : 400;

      return res.status(statusCode).json({
        success: false,
        error: loginResult.error?.code || 'Authentication Failed',
        message: loginResult.error?.message || 'Phantom signature verification failed',
        verificationTime,
        statusCode,
      });
    }

    // Success
    logAuthenticationAttempt(req, loginRequest.walletAddress, true);
    
    recordSecurityEvent(
      SecurityEventType.LOGIN_SUCCESS,
      ipAddress,
      loginResult.user.id,
      {
        walletAddress: loginRequest.walletAddress,
        provider: 'phantom',
        sessionId: loginResult.sessionId,
        verificationTime,
        userAgent,
      },
      userAgent
    );

    logger.info('Phantom authentication successful', {
      userId: loginResult.user.id,
      verificationTime,
      sessionId: loginResult.sessionId,
    });

    // Return response
    return res.status(201).json({
      success: true,
      user: {
        id: loginResult.user.id,
        walletAddress: typeof loginResult.user.walletAddress === 'string'
          ? loginResult.user.walletAddress
          : loginResult.user.walletAddress.toBase58?.() || String(loginResult.user.walletAddress),
        username: loginResult.user.username,
        email: loginResult.user.email,
        role: loginResult.user.role,
        verified: loginResult.user.verified,
        reputation: loginResult.user.reputation,
        stats: loginResult.user.stats,
        createdAt: loginResult.user.createdAt.toISOString(),
      },
      accessToken: loginResult.accessToken!,
      refreshToken: loginResult.refreshToken,
      expiresIn: loginResult.expiresIn!,
      expiresAt: loginResult.expiresAt!.toISOString(),
      sessionId: loginResult.sessionId!,
      tokenType: 'Bearer',
      provider: 'phantom',
      verificationTime,
    });
  } catch (error) {
    const verificationTime = Date.now() - startTime;
    
    logger.error('Phantom signature verification error', {
      error: error instanceof Error ? error.message : 'Unknown',
      verificationTime,
      ipAddress,
    });

    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Signature verification failed',
      verificationTime,
      statusCode: 500,
    });
  }
}

