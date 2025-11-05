import { NextApiRequest, NextApiResponse } from 'next';
import { securityMiddleware } from '../../../../lib/middleware/security';
import { generateNonce, createChallengeMessage } from '../../../../lib/utils/nonceGenerator';
import { logger } from '../../../../lib/logging/logger';

/**
 * POST /api/auth/phantom/connect
 * 
 * Initiate Phantom wallet connection flow by generating authentication challenge.
 * This is an alias for /api/auth/challenge with Phantom-specific optimizations.
 * 
 * Note: Actual wallet connection happens client-side in the browser.
 * This endpoint prepares the server-side authentication challenge.
 * 
 * Request Body:
 * - walletAddress: string
 * - connectionMethod: 'extension' | 'mobile'
 * 
 * Response:
 * - success: true
 * - challenge: { nonce, message, expiresAt }
 * - sessionPrep: { connectionMethod, timeout }
 * - recommendedNext: 'sign_message'
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const securityPassed = securityMiddleware(req, res);
  if (!securityPassed) return;

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
      statusCode: 405,
    });
  }

  try {
    const { walletAddress, connectionMethod = 'extension' } = req.body || {};

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'walletAddress is required',
        statusCode: 400,
      });
    }

    // Generate authentication challenge
    const generatedNonce = generateNonce(walletAddress);
    const challengeMessage = createChallengeMessage(
      generatedNonce.nonce,
      walletAddress
    );

    logger.info('Phantom wallet connection initiated', {
      walletAddress: walletAddress.slice(0, 8) + '...',
      connectionMethod,
    });

    // Return challenge for client-side signing
    return res.status(200).json({
      success: true,
      challenge: {
        nonce: generatedNonce.nonce,
        message: challengeMessage,
        expiresAt: generatedNonce.expiresAt.toISOString(),
        expiresIn: 300, // 5 minutes
      },
      sessionPrep: {
        connectionMethod,
        timeout: 30000, // 30 seconds
        walletProvider: 'phantom',
      },
      recommendedNext: 'sign_message',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Phantom connection preparation failed', {
      error: error instanceof Error ? error.message : 'Unknown',
    });

    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      statusCode: 500,
    });
  }
}






