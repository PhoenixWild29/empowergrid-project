import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import { authService } from '../../../../lib/services/authService';
import { securityMiddleware } from '../../../../lib/middleware/security';
import { applyAuthRateLimit } from '../../../../lib/middleware/authRateLimiter';
import {
  getClientIP,
  getUserAgent,
  logAuthenticationAttempt,
} from '../../../../lib/middleware/requestLogger';
import {
  LoginRequestSchema,
  safeValidateRequestBody,
  formatZodErrors,
} from '../../../../lib/schemas/authSchemas';
import { WalletProvider } from '../../../../lib/config/auth';
import { recordSecurityEvent, SecurityEventType } from '../../../../lib/services/securityMonitor';

/**
 * POST /api/auth/sessions/create
 * 
 * Create a new authenticated session with JWT token after wallet signature verification.
 * This endpoint is an alias for /api/auth/login with enhanced cookie-based session storage.
 * 
 * Request Body:
 * - walletAddress: Solana wallet address
 * - signature: Wallet signature
 * - message: Challenge message
 * - nonce: Challenge nonce
 * - provider: Wallet provider (optional)
 * 
 * Success Response (201):
 * {
 *   "success": true,
 *   "user": { ...user data... },
 *   "sessionId": "session_id",
 *   "expiresAt": "2024-10-08T12:00:00.000Z",
 *   "expiresIn": 86400
 * }
 * 
 * Note: JWT tokens are stored in HTTP-only cookies for security
 * - accessToken cookie (HTTP-only, Secure, SameSite=Strict)
 * - refreshToken cookie (HTTP-only, Secure, SameSite=Strict)
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

  // Apply auth rate limiting
  const rateLimitPassed = await applyAuthRateLimit('LOGIN')(req, res);
  if (!rateLimitPassed) {
    return;
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
      message: 'Only POST method is allowed',
      statusCode: 405,
    });
  }

  const ipAddress = getClientIP(req);
  const userAgent = getUserAgent(req);

  try {
    // Validate request body
    const validationResult = safeValidateRequestBody(
      LoginRequestSchema,
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

    const loginRequest = validationResult.data;

    // Attempt authentication
    const loginResult = await authService.login(
      {
        walletAddress: loginRequest.walletAddress,
        signature: loginRequest.signature,
        message: loginRequest.message,
        nonce: loginRequest.nonce,
        provider: loginRequest.provider as WalletProvider,
      },
      {
        ipAddress,
        userAgent,
      }
    );

    // Handle failure
    if (!loginResult.success || !loginResult.user) {
      logAuthenticationAttempt(req, loginRequest.walletAddress, false, loginResult.error?.message);
      
      recordSecurityEvent(
        SecurityEventType.LOGIN_FAILURE,
        ipAddress,
        undefined,
        {
          walletAddress: loginRequest.walletAddress,
          reason: loginResult.error?.code,
          userAgent,
        },
        userAgent
      );

      const statusCode = loginResult.error?.code === 'INVALID_SIGNATURE' ? 401 : 400;

      return res.status(statusCode).json({
        success: false,
        error: loginResult.error?.code || 'Authentication Failed',
        message: loginResult.error?.message || 'Authentication failed',
        statusCode,
      });
    }

    // Log success
    logAuthenticationAttempt(req, loginRequest.walletAddress, true);
    
    recordSecurityEvent(
      SecurityEventType.LOGIN_SUCCESS,
      ipAddress,
      loginResult.user.id,
      {
        walletAddress: loginRequest.walletAddress,
        sessionId: loginResult.sessionId,
        userAgent,
      },
      userAgent
    );

    // Set HTTP-only cookies
    const isProduction = process.env.NODE_ENV === 'production';

    // Access token cookie
    res.setHeader('Set-Cookie', [
      serialize('accessToken', loginResult.accessToken!, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: loginResult.expiresIn!,
        path: '/',
      }),
      // Refresh token cookie
      serialize('refreshToken', loginResult.refreshToken || '', {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      }),
    ]);

    // Return session metadata (not tokens in response body for security)
    return res.status(201).json({
      success: true,
      user: {
        id: loginResult.user.id,
        walletAddress: typeof loginResult.user.walletAddress === 'string'
          ? loginResult.user.walletAddress
          : loginResult.user.walletAddress.toBase58
            ? loginResult.user.walletAddress.toBase58()
            : String(loginResult.user.walletAddress),
        username: loginResult.user.username,
        email: loginResult.user.email,
        role: loginResult.user.role,
        verified: loginResult.user.verified,
        reputation: loginResult.user.reputation,
        stats: loginResult.user.stats,
        createdAt: loginResult.user.createdAt.toISOString(),
      },
      sessionId: loginResult.sessionId!,
      expiresAt: loginResult.expiresAt!.toISOString(),
      expiresIn: loginResult.expiresIn!,
    });
  } catch (error) {
    console.error('Session creation error:', error);

    if (req.body?.walletAddress) {
      logAuthenticationAttempt(req, req.body.walletAddress, false, 'Server error');
    }

    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create session',
      statusCode: 500,
    });
  }
}




