import { NextApiRequest, NextApiResponse } from 'next';
import { authService } from '../../../lib/services/authService';
import { securityMiddleware } from '../../../lib/middleware/security';
import { applyAuthRateLimit } from '../../../lib/middleware/authRateLimiter';
import {
  getClientIP,
  getUserAgent,
  logAuthenticationAttempt,
} from '../../../lib/middleware/requestLogger';
import {
  LoginRequestSchema,
  safeValidateRequestBody,
  formatZodErrors,
} from '../../../lib/schemas/authSchemas';
import { WalletProvider } from '../../../lib/config/auth';
import { recordSecurityEvent, SecurityEventType } from '../../../lib/services/securityMonitor';

/**
 * POST /api/auth/login
 * 
 * Authenticate a user by verifying their wallet signature and creating a session.
 * 
 * This endpoint completes the wallet-based authentication flow:
 * 1. Client first calls /api/auth/challenge to get a nonce
 * 2. Client signs the challenge message with their wallet
 * 3. Client calls this endpoint with the signature
 * 4. Server verifies the signature and creates an authenticated session
 * 
 * Request Body:
 * - walletAddress: Solana wallet address (base58)
 * - signature: Wallet signature of the challenge message (base58)
 * - message: The original challenge message that was signed
 * - nonce: The nonce from the challenge
 * - provider (optional): Wallet provider (phantom, solflare, etc.)
 * 
 * Success Response (201):
 * {
 *   "success": true,
 *   "user": { ...user profile... },
 *   "accessToken": "jwt_token",
 *   "refreshToken": "refresh_token",
 *   "expiresIn": 86400,
 *   "expiresAt": "2024-10-08T12:00:00.000Z",
 *   "sessionId": "session_id",
 *   "tokenType": "Bearer"
 * }
 * 
 * Error Responses:
 * - 400: Bad Request (invalid input, signature verification failed)
 * - 401: Unauthorized (authentication failed)
 * - 405: Method Not Allowed (not POST)
 * - 429: Too Many Requests (rate limit exceeded)
 * - 500: Internal Server Error
 * 
 * Security Features:
 * - Ed25519 signature verification
 * - Nonce validation (prevents replay attacks)
 * - Automatic user registration
 * - Session tracking with IP and user agent
 * - Comprehensive logging
 * - Rate limiting
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Apply security middleware (headers, CORS, rate limiting)
  const securityPassed = securityMiddleware(req, res);
  if (!securityPassed) {
    // Security middleware already sent response
    return;
  }

  // Apply auth-specific rate limiting (5 attempts per 15 minutes - STRICTEST)
  const rateLimitPassed = await applyAuthRateLimit('LOGIN')(req, res);
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

    // Attempt login
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

    // Handle login failure
    if (!loginResult.success || !loginResult.user) {
      // Log failed authentication
      logAuthenticationAttempt(
        req,
        loginRequest.walletAddress,
        false,
        loginResult.error?.message
      );

      // Record security event for failure
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

      // Determine status code based on error
      const statusCode = 
        loginResult.error?.code === 'INVALID_SIGNATURE' ? 401 :
        loginResult.error?.code === 'EXPIRED_CHALLENGE' ? 401 :
        loginResult.error?.code === 'CHALLENGE_NOT_FOUND' ? 401 :
        loginResult.error?.code === 'CHALLENGE_ALREADY_USED' ? 401 :
        400;

      return res.status(statusCode).json({
        success: false,
        error: loginResult.error?.code || 'Authentication Failed',
        message: loginResult.error?.message || 'Authentication failed',
        statusCode,
      });
    }

    // Log successful authentication
    logAuthenticationAttempt(
      req,
      loginRequest.walletAddress,
      true
    );

    // Record security event for success
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

    // Prepare response data
    const responseData = {
      success: true,
      user: {
        id: loginResult.user.id,
        walletAddress: loginResult.user.walletAddress.toBase58 
          ? loginResult.user.walletAddress.toBase58()
          : loginResult.user.walletAddress,
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
      tokenType: 'Bearer' as const,
    };

    // Return success response
    return res.status(201).json(responseData);
  } catch (error) {
    // Log error
    console.error('Login endpoint error:', error);

    // Log failed authentication (if we have wallet address)
    if (req.body?.walletAddress) {
      logAuthenticationAttempt(
        req,
        req.body.walletAddress,
        false,
        'Unexpected server error'
      );
    }

    // Return error response
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred during authentication',
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

