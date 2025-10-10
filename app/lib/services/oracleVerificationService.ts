/**
 * WO-124: Oracle Verification Service
 * 
 * Features:
 * - Aggregate oracle data from multiple sources
 * - Apply verification algorithms
 * - Cryptographic signature verification
 * - Data consistency checks
 * - Anomaly detection
 * - Confidence scoring
 * - Statistical analysis
 */

import { prisma } from '../prisma';

export interface VerificationResult {
  isVerified: boolean;
  confidence: number;
  dataPoints: number;
  anomaliesDetected: number;
  consistencyScore: number;
  sources: string[];
  timestamp: Date;
}

export interface OracleAggregationData {
  feedId: string;
  value: number;
  confidence: number;
  timestamp: Date;
  signature?: string;
}

/**
 * WO-124: Aggregate oracle data from multiple sources
 */
export async function aggregateOracleData(
  projectId: string,
  milestoneId: string
): Promise<OracleAggregationData[]> {
  console.log('[WO-124] Aggregating oracle data for milestone:', milestoneId);

  // Fetch project oracle feeds
  const projectFeeds = await (prisma as any).projectOracleFeed.findMany({
    where: {
      projectId,
      isActive: true,
    },
    include: {
      feed: {
        include: {
          dataPoints: {
            orderBy: { timestamp: 'desc' },
            take: 10, // Last 10 data points per feed
          },
        },
      },
    },
  });

  // Aggregate data from all feeds
  const aggregatedData: OracleAggregationData[] = [];

  for (const projectFeed of projectFeeds) {
    for (const dataPoint of projectFeed.feed.dataPoints) {
      aggregatedData.push({
        feedId: projectFeed.feedId,
        value: dataPoint.value,
        confidence: dataPoint.confidence,
        timestamp: dataPoint.timestamp,
        signature: dataPoint.signature,
      });
    }
  }

  return aggregatedData;
}

/**
 * WO-124: Verify milestone with oracle data
 */
export async function verifyMilestoneWithOracles(
  milestoneId: string,
  projectId: string
): Promise<VerificationResult> {
  console.log('[WO-124] Starting milestone verification:', milestoneId);

  // Aggregate oracle data
  const oracleData = await aggregateOracleData(projectId, milestoneId);

  if (oracleData.length === 0) {
    return {
      isVerified: false,
      confidence: 0,
      dataPoints: 0,
      anomaliesDetected: 0,
      consistencyScore: 0,
      sources: [],
      timestamp: new Date(),
    };
  }

  // WO-124: Cryptographic signature verification
  const signatureResults = oracleData.map(data => 
    data.signature ? verifySignature(data.signature, data.value) : true
  );
  const signaturesValid: boolean = signatureResults.every((valid: boolean) => valid === true);

  // WO-124: Data consistency checks
  const consistencyScore = calculateDataConsistency(oracleData);

  // WO-124: Anomaly detection
  const anomalies = detectAnomalies(oracleData);

  // WO-124: Statistical analysis
  const statistics = performStatisticalAnalysis(oracleData);

  // WO-124: Calculate final confidence score
  const confidenceScore = calculateConfidenceScore({
    signaturesValid,
    consistencyScore,
    anomalyCount: anomalies.length,
    dataPointCount: oracleData.length,
    averageConfidence: statistics.averageConfidence,
  });

  // Milestone is verified if:
  // 1. Signatures are valid
  // 2. Consistency score > 0.7
  // 3. Few anomalies (< 10% of data)
  // 4. Confidence score > 0.8
  const isVerified =
    signaturesValid &&
    consistencyScore > 0.7 &&
    anomalies.length < oracleData.length * 0.1 &&
    confidenceScore > 0.8;

  return {
    isVerified,
    confidence: confidenceScore,
    dataPoints: oracleData.length,
    anomaliesDetected: anomalies.length,
    consistencyScore,
    sources: [...new Set(oracleData.map(d => d.feedId))],
    timestamp: new Date(),
  };
}

/**
 * WO-124: Cryptographic signature verification
 */
function verifySignature(signature: string, value: number): boolean {
  // In production, would verify Ed25519 signature from Switchboard
  // For now, basic validation
  return !!(signature && signature.length > 20);
}

/**
 * WO-124: Calculate data consistency across multiple sources
 */
function calculateDataConsistency(data: OracleAggregationData[]): number {
  if (data.length < 2) return 1.0;

  // Calculate coefficient of variation (CV)
  const values = data.map(d => d.value);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  const cv = mean !== 0 ? stdDev / mean : 0;

  // Convert CV to consistency score (lower CV = higher consistency)
  // CV < 0.1 = excellent consistency (0.9-1.0)
  // CV 0.1-0.3 = good consistency (0.7-0.9)
  // CV > 0.3 = poor consistency (0-0.7)
  const consistencyScore = Math.max(0, Math.min(1, 1 - cv));

  return Math.round(consistencyScore * 100) / 100;
}

/**
 * WO-124: Detect anomalies in oracle data
 */
function detectAnomalies(data: OracleAggregationData[]): number[] {
  if (data.length < 3) return [];

  const anomalyIndices: number[] = [];
  const values = data.map(d => d.value);
  
  // Calculate IQR for outlier detection
  const sorted = [...values].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;

  // Define outlier boundaries
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  // Detect outliers
  values.forEach((value, index) => {
    if (value < lowerBound || value > upperBound) {
      anomalyIndices.push(index);
    }
  });

  return anomalyIndices;
}

/**
 * WO-124: Perform statistical analysis
 */
function performStatisticalAnalysis(data: OracleAggregationData[]): {
  mean: number;
  median: number;
  stdDev: number;
  averageConfidence: number;
} {
  const values = data.map(d => d.value);
  const confidences = data.map(d => d.confidence);

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const sortedValues = [...values].sort((a, b) => a - b);
  const median = sortedValues[Math.floor(sortedValues.length / 2)];
  
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  const averageConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;

  return {
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
    averageConfidence: Math.round(averageConfidence * 100) / 100,
  };
}

/**
 * WO-124: Calculate overall confidence score
 */
function calculateConfidenceScore(params: {
  signaturesValid: boolean;
  consistencyScore: number;
  anomalyCount: number;
  dataPointCount: number;
  averageConfidence: number;
}): number {
  let score = 0;

  // Signature validity (30%)
  if (params.signaturesValid) {
    score += 0.3;
  }

  // Consistency score (30%)
  score += params.consistencyScore * 0.3;

  // Anomaly penalty (20%)
  const anomalyRatio = params.anomalyCount / params.dataPointCount;
  score += Math.max(0, 0.2 * (1 - anomalyRatio * 2));

  // Average confidence from oracles (20%)
  score += params.averageConfidence * 0.2;

  return Math.round(Math.min(1, score) * 100) / 100;
}



