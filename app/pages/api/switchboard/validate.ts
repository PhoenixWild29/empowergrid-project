/**
 * POST /api/switchboard/validate
 * 
 * WO-137: Comprehensive data integrity validation
 * 
 * Features:
 * - Signature verification
 * - Consensus checking
 * - Confidence scoring (0-100)
 * - Detailed audit trails
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/middleware/authMiddleware';
import { verifyMultipleSignatures } from '../../../lib/services/oracle/signatureVerifier';
import { calculateConfidenceScore } from '../../../lib/services/oracle/confidenceScorer';
import { z } from 'zod';

const ValidateRequestSchema = z.object({
  feedAddress: z.string(),
  dataPoints: z.array(z.object({
    value: z.number(),
    confidence: z.number().min(0).max(1),
    timestamp: z.number(),
    signature: z.string().optional(),
    source: z.string(),
  })).min(1),
});

async function validateHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const validatedData = ValidateRequestSchema.parse(req.body);
    
    // WO-137: Signature verification
    const signaturesValid = await verifyMultipleSignatures(
      validatedData.dataPoints
        .filter(dp => dp.signature)
        .map(dp => ({ signature: dp.signature!, publicKey: validatedData.feedAddress })),
      JSON.stringify(validatedData.dataPoints.map(dp => dp.value)),
      Math.ceil(validatedData.dataPoints.length / 2) // Majority consensus
    );

    // WO-137: Consensus checking (5% variance threshold)
    const values = validatedData.dataPoints.map(dp => dp.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const maxDeviation = Math.max(...values.map(v => Math.abs(v - mean) / mean));
    const consensusReached = maxDeviation <= 0.05;

    // WO-137: Confidence score (0-100 range)
    const confidenceResult = calculateConfidenceScore(
      validatedData.dataPoints.map(dp => ({
        value: dp.value,
        confidence: dp.confidence,
        timestamp: dp.timestamp,
        source: dp.source,
      })),
      0.9 // Historical reliability
    );

    const confidenceScore = Math.round(confidenceResult.overallConfidence * 100);

    // WO-137: Data quality checks
    const now = Date.now();
    const dataFreshness = validatedData.dataPoints.every(dp => (now - dp.timestamp) < 600000); // 10 minutes
    const avgConfidence = validatedData.dataPoints.reduce((sum, dp) => sum + dp.confidence, 0) / validatedData.dataPoints.length;

    return res.status(200).json({
      success: true,
      validation: {
        isValid: signaturesValid.isValid && consensusReached && dataFreshness && avgConfidence >= 0.7,
        confidenceScore, // 0-100
        details: {
          signaturesValid: signaturesValid.isValid,
          consensusReached,
          dataFreshness,
          qualityScore: avgConfidence,
        },
        auditTrail: [
          {
            timestamp: new Date().toISOString(),
            step: 'signature_verification',
            result: signaturesValid.isValid ? 'PASSED' : 'FAILED',
            validSignatures: signaturesValid.validCount,
            totalSignatures: signaturesValid.totalCount,
          },
          {
            timestamp: new Date().toISOString(),
            step: 'consensus_checking',
            result: consensusReached ? 'PASSED' : 'FAILED',
            variance: maxDeviation,
            threshold: 0.05,
          },
          {
            timestamp: new Date().toISOString(),
            step: 'data_quality',
            result: dataFreshness && avgConfidence >= 0.7 ? 'PASSED' : 'FAILED',
            freshness: dataFreshness,
            avgConfidence,
          },
        ],
      },
    });

  } catch (error) {
    console.error('[WO-137] Validation error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.issues,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to validate data',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuth(validateHandler);



