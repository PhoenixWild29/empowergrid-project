import { NextApiRequest, NextApiResponse } from 'next';
import {
  generateNonce,
  createChallengeMessage,
  NONCE_CONFIG,
} from '../../../lib/utils/nonceGenerator';
import { securityMiddleware } from '../../../lib/middleware/security';
import { applyAuthRateLimit } from '../../../lib/middleware/authRateLimiter';
import {
  logChallengeGeneration,
  logSuspiciousActivity,
} from '../../../lib/middleware/requestLogger';
import {
  ChallengeRequestSchema,
  ChallengeResponseSchema,
  safeValidateRequestBody,
  formatZodErrors,
  isValidSolanaAddress,
} from '../../../lib/schemas/authSchemas';
import { ChallengeResponse } from '../../../types/auth';

/**
 * POST /api/auth/challenge
 * 
 * Generate a unique authentication challenge for wallet signature verification.
 * This is the first step in the wallet-based authentication flow.
 * 
 * Request Body:
 * - walletAddress (optional): Solana wallet address for personalized challenge
 * 
 * Response:
 * - success: boolean
 * - nonce: unique cryptographic nonce
 * - message: user-friendly challenge message to sign
 * - expiresAt: ISO 8601 timestamp when challenge expires
 * - expiresIn: seconds until expiry
 * - timestamp: ISO 8601 timestamp when challenge was generated
 * 
 * Security Features:
 * - CORS validation
 * - Rate limiting
 * - Security headers (CSP, HSTS, etc.)
 * - Comprehensive logging
 * - Input validation with Zod
 * 
 * Error Responses:
 * - 400: Bad Request (invalid input)
 * - 405: Method Not Allowed (not POST)
 * - 429: Too Many Requests (rate limit exceeded)
 * - 500: Internal Server Error
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

  // Apply auth-specific rate limiting (20 requests per 15 minutes)
  const rateLimitPassed = await applyAuthRateLimit('CHALLENGE')(req, res);
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

  try {
    // Parse and validate request body
    const validationResult = safeValidateRequestBody(
      ChallengeRequestSchema,
      req.body || {}
    );

    if (!validationResult.success) {
      const errors = formatZodErrors(validationResult.error);
      
      // Log suspicious activity for malformed requests
      if (req.body && Object.keys(req.body).length > 0) {
        logSuspiciousActivity(req, 'malformed_challenge_request', {
          errors,
          body: req.body,
        });
      }

      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid request data',
        details: errors,
        statusCode: 400,
      });
    }

    const { walletAddress } = validationResult.data;

    // Additional validation for wallet address if provided
    if (walletAddress) {
      if (!isValidSolanaAddress(walletAddress)) {
        logSuspiciousActivity(req, 'invalid_wallet_address', {
          walletAddress,
        });

        return res.status(400).json({
          success: false,
          error: 'Invalid Wallet Address',
          message: 'The provided wallet address is not a valid Solana address',
          statusCode: 400,
        });
      }
    }

    // Generate unique nonce
    const generatedNonce = generateNonce(walletAddress);

    // Create user-friendly challenge message
    const challengeMessage = createChallengeMessage(
      generatedNonce.nonce,
      walletAddress
    );

    // Calculate expiry time in seconds
    const expiresIn = NONCE_CONFIG.EXPIRY_MINUTES * 60;

    // Prepare response data
    const responseData: ChallengeResponse = {
      success: true,
      nonce: generatedNonce.nonce,
      message: challengeMessage,
      expiresAt: generatedNonce.expiresAt.toISOString(),
      expiresIn,
      timestamp: new Date().toISOString(),
    };

    // Validate response against schema (for consistency)
    const responseValidation = safeValidateRequestBody(
      ChallengeResponseSchema,
      responseData
    );

    if (!responseValidation.success) {
      // This should never happen, but log it if it does
      console.error('Response validation failed:', responseValidation.error);
      throw new Error('Failed to generate valid challenge response');
    }

    // Log successful challenge generation
    logChallengeGeneration(req, walletAddress, generatedNonce.nonce, true);

    // Return challenge
    return res.status(201).json(responseData);
  } catch (error) {
    // Log error
    console.error('Challenge generation error:', error);

    // Log failed challenge generation
    logChallengeGeneration(
      req,
      undefined,
      'error',
      false
    );

    // Return error response
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to generate authentication challenge',
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

