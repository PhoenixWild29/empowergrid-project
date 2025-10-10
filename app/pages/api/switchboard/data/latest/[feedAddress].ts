/**
 * GET /api/switchboard/data/latest/[feedAddress]
 * 
 * WO-137: Retrieve current feed values with cryptographic validation
 * 
 * Features:
 * - Current feed value retrieval
 * - Cryptographic signature validation
 * - Confidence intervals
 * - Timestamp tracking
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../../../lib/middleware/authMiddleware';
import { prisma } from '../../../../../lib/prisma';
import { verifyOracleSignature } from '../../../../../lib/services/oracle/signatureVerifier';
import { validateTimestamp } from '../../../../../lib/services/oracle/timestampValidator';

async function latestDataHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const { feedAddress } = req.query;

    if (!feedAddress || typeof feedAddress !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'feedAddress parameter is required',
      });
    }

    console.log('[WO-137] Fetching latest data for feed:', feedAddress);

    // Find oracle feed
    const feed = await (prisma as any).oracleFeed.findUnique({
      where: { feedAddress },
      include: {
        dataPoints: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
    });

    if (!feed) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Oracle feed not found',
      });
    }

    const latestDataPoint = feed.dataPoints[0];

    if (!latestDataPoint) {
      return res.status(404).json({
        error: 'No data available',
        message: 'No data points available for this feed',
      });
    }

    // WO-137: Cryptographic signature validation
    let signatureValid = null;
    if (latestDataPoint.signature) {
      const signatureResult = await verifyOracleSignature(
        latestDataPoint.signature,
        latestDataPoint.value.toString(),
        feedAddress
      );
      signatureValid = signatureResult.isValid;
    }

    // WO-137: Timestamp validation
    const timestampValidation = validateTimestamp(
      new Date(latestDataPoint.timestamp).getTime(),
      {
        maxAge: feed.maxStaleness * 1000,
      }
    );

    // Calculate confidence interval from recent data points
    const recentConfidences = feed.dataPoints.map((dp: any) => dp.confidence);
    const avgConfidence = recentConfidences.reduce((sum: number, c: number) => sum + c, 0) / recentConfidences.length;
    const stdDev = Math.sqrt(
      recentConfidences.reduce((sum: number, c: number) => sum + Math.pow(c - avgConfidence, 2), 0) / recentConfidences.length
    );

    const responseTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      data: {
        feedAddress,
        feedType: feed.feedType,
        value: latestDataPoint.value,
        confidence: latestDataPoint.confidence,
        timestamp: latestDataPoint.timestamp,
        dataAge: Date.now() - new Date(latestDataPoint.timestamp).getTime(),
        
        // WO-137: Cryptographic validation
        signatureValid,
        
        // WO-137: Timestamp validation
        isTimestampValid: timestampValidation.isValid,
        isStale: !timestampValidation.isValid,
        
        // WO-137: Confidence interval
        confidenceInterval: {
          lower: Math.max(0, avgConfidence - 2 * stdDev),
          upper: Math.min(1, avgConfidence + 2 * stdDev),
          mean: avgConfidence,
        },
        
        dataSource: latestDataPoint.dataSource || feed.name,
        aggregatorRound: latestDataPoint.aggregatorRound?.toString(),
      },
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        feedUpdateFrequency: feed.updateFrequency,
        totalDataPoints: feed.dataPoints.length,
      },
    });

  } catch (error) {
    console.error('[WO-137] Latest data error:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve latest feed data',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuth(latestDataHandler);



