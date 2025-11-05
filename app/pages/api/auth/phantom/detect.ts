import { NextApiRequest, NextApiResponse } from 'next';
import { securityMiddleware } from '../../../../lib/middleware/security';

/**
 * POST /api/auth/phantom/detect
 * 
 * Detect Phantom wallet availability and capabilities.
 * 
 * Note: Actual detection happens client-side (browser extension detection).
 * This endpoint validates client-side detection data and returns recommendations.
 * 
 * Request Body:
 * - isExtensionDetected: boolean
 * - isMobileDetected: boolean
 * - version?: string
 * - features?: string[]
 * 
 * Response:
 * - detected: boolean
 * - extensionAvailable: boolean
 * - mobileAvailable: boolean
 * - version: string | null
 * - supportedFeatures: string[]
 * - recommendedMethod: 'extension' | 'mobile' | 'none'
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
    const {
      isExtensionDetected = false,
      isMobileDetected = false,
      version = null,
      features = [],
    } = req.body || {};

    const detected = isExtensionDetected || isMobileDetected;

    // Determine recommended connection method
    let recommendedMethod: 'extension' | 'mobile' | 'none' = 'none';
    
    if (isExtensionDetected) {
      recommendedMethod = 'extension';
    } else if (isMobileDetected) {
      recommendedMethod = 'mobile';
    }

    // Standard Phantom features
    const supportedFeatures = [
      'signTransaction',
      'signAllTransactions',
      'signMessage',
      'signAndSendTransaction',
      ...(features || []),
    ];

    // Return detection results
    return res.status(200).json({
      success: true,
      detected,
      extensionAvailable: isExtensionDetected,
      mobileAvailable: isMobileDetected,
      version: version || null,
      supportedFeatures,
      recommendedMethod,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to process detection data',
      statusCode: 500,
    });
  }
}






