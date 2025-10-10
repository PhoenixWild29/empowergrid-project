/**
 * WO-135: Oracle Confidence Scoring System
 * 
 * Calculates data reliability based on multiple oracle node consensus,
 * data quality metrics, and historical performance.
 * 
 * Features:
 * - Multi-node consensus scoring
 * - Data quality assessment
 * - Historical reliability tracking
 * - Confidence score aggregation (0-1 range)
 */

export interface OracleDataPoint {
  value: number;
  confidence: number;
  timestamp: number;
  source: string;
}

export interface ConfidenceScore {
  overallConfidence: number; // 0-1
  consensusScore: number; // 0-1
  qualityScore: number; // 0-1
  reliabilityScore: number; // 0-1
  nodeCount: number;
  agreementRate: number; // Percentage of nodes in agreement
  explanation: string;
}

/**
 * WO-135: Calculate confidence score based on multiple oracle nodes
 * 
 * Score calculation:
 * - 40% Consensus (how well nodes agree)
 * - 30% Quality (data quality metrics)
 * - 30% Reliability (historical performance)
 * 
 * @param dataPoints - Array of data points from different oracle nodes
 * @param historicalReliability - Optional historical reliability score
 * @returns Confidence score between 0 and 1
 */
export function calculateConfidenceScore(
  dataPoints: OracleDataPoint[],
  historicalReliability?: number
): ConfidenceScore {
  console.log('[WO-135] Calculating confidence score for', dataPoints.length, 'data points');

  if (dataPoints.length === 0) {
    return {
      overallConfidence: 0,
      consensusScore: 0,
      qualityScore: 0,
      reliabilityScore: 0,
      nodeCount: 0,
      agreementRate: 0,
      explanation: 'No data points available',
    };
  }

  // Calculate consensus score
  const consensusScore = calculateConsensusScore(dataPoints);

  // Calculate quality score
  const qualityScore = calculateQualityScore(dataPoints);

  // Use historical reliability or default to medium confidence
  const reliabilityScore = historicalReliability ?? 0.7;

  // Weighted average
  const overallConfidence = 
    consensusScore * 0.4 +
    qualityScore * 0.3 +
    reliabilityScore * 0.3;

  // Calculate agreement rate
  const agreementRate = calculateAgreementRate(dataPoints);

  const explanation = generateConfidenceExplanation(
    overallConfidence,
    consensusScore,
    qualityScore,
    reliabilityScore,
    dataPoints.length
  );

  console.log('[WO-135] Confidence score calculated:', {
    overallConfidence: overallConfidence.toFixed(3),
    consensusScore: consensusScore.toFixed(3),
    qualityScore: qualityScore.toFixed(3),
    reliabilityScore: reliabilityScore.toFixed(3),
  });

  return {
    overallConfidence: Math.round(overallConfidence * 1000) / 1000,
    consensusScore: Math.round(consensusScore * 1000) / 1000,
    qualityScore: Math.round(qualityScore * 1000) / 1000,
    reliabilityScore: Math.round(reliabilityScore * 1000) / 1000,
    nodeCount: dataPoints.length,
    agreementRate,
    explanation,
  };
}

/**
 * WO-135: Calculate consensus score based on data agreement
 * 
 * Measures how well oracle nodes agree on the data value
 */
function calculateConsensusScore(dataPoints: OracleDataPoint[]): number {
  if (dataPoints.length === 1) {
    return 0.5; // Single source gets medium consensus
  }

  const values = dataPoints.map(dp => dp.value);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  
  // Calculate coefficient of variation (CV)
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean !== 0 ? stdDev / Math.abs(mean) : 0;

  // Convert CV to consensus score (lower CV = higher consensus)
  // CV < 0.05 = excellent consensus (0.95-1.0)
  // CV 0.05-0.15 = good consensus (0.8-0.95)
  // CV 0.15-0.30 = moderate consensus (0.5-0.8)
  // CV > 0.30 = poor consensus (0-0.5)
  let consensusScore: number;
  if (cv < 0.05) {
    consensusScore = 0.95 + (0.05 - cv) * 1;
  } else if (cv < 0.15) {
    consensusScore = 0.8 + (0.15 - cv) * 1.5;
  } else if (cv < 0.30) {
    consensusScore = 0.5 + (0.30 - cv) * 2;
  } else {
    consensusScore = Math.max(0, 0.5 - (cv - 0.30));
  }

  return Math.max(0, Math.min(1, consensusScore));
}

/**
 * WO-135: Calculate quality score based on data quality metrics
 * 
 * Factors: individual confidence scores, timestamp freshness, data completeness
 */
function calculateQualityScore(dataPoints: OracleDataPoint[]): number {
  // Average individual confidence scores
  const avgConfidence = dataPoints.reduce((sum, dp) => sum + dp.confidence, 0) / dataPoints.length;

  // Timestamp freshness (data points should be recent)
  const now = Date.now();
  const ages = dataPoints.map(dp => now - dp.timestamp);
  const maxAge = Math.max(...ages);
  const freshnessScore = maxAge < 60000 ? 1.0 : // < 1 minute
                         maxAge < 300000 ? 0.9 : // < 5 minutes
                         maxAge < 900000 ? 0.7 : // < 15 minutes
                         maxAge < 3600000 ? 0.5 : // < 1 hour
                         0.3; // > 1 hour

  // Data completeness (more nodes = better)
  const completenessScore = Math.min(1, dataPoints.length / 5); // Ideal: 5+ nodes

  // Weighted quality score
  const qualityScore =
    avgConfidence * 0.5 +
    freshnessScore * 0.3 +
    completenessScore * 0.2;

  return Math.max(0, Math.min(1, qualityScore));
}

/**
 * WO-135: Calculate agreement rate (percentage of nodes within acceptable range)
 */
function calculateAgreementRate(dataPoints: OracleDataPoint[]): number {
  if (dataPoints.length < 2) {
    return 100;
  }

  const values = dataPoints.map(dp => dp.value);
  const median = calculateMedian(values);
  
  // Count values within 10% of median
  const threshold = Math.abs(median) * 0.1;
  const inAgreement = values.filter(v => Math.abs(v - median) <= threshold).length;
  
  return Math.round((inAgreement / values.length) * 100);
}

/**
 * WO-135: Calculate median value
 */
function calculateMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  
  return sorted[mid];
}

/**
 * WO-135: Generate human-readable explanation
 */
function generateConfidenceExplanation(
  overall: number,
  consensus: number,
  quality: number,
  reliability: number,
  nodeCount: number
): string {
  const level = overall >= 0.9 ? 'Excellent' :
                overall >= 0.8 ? 'High' :
                overall >= 0.7 ? 'Good' :
                overall >= 0.6 ? 'Moderate' :
                overall >= 0.5 ? 'Fair' :
                'Low';

  const factors: string[] = [];
  
  if (consensus >= 0.9) factors.push('strong node consensus');
  else if (consensus < 0.6) factors.push('weak node consensus');
  
  if (quality >= 0.9) factors.push('excellent data quality');
  else if (quality < 0.6) factors.push('suboptimal data quality');
  
  if (nodeCount < 3) factors.push('limited data sources');
  else if (nodeCount >= 5) factors.push('multiple data sources');

  return `${level} confidence (${(overall * 100).toFixed(1)}%) based on ${nodeCount} oracle node${nodeCount !== 1 ? 's' : ''}` +
         (factors.length > 0 ? ` with ${factors.join(', ')}` : '');
}

/**
 * WO-135: Aggregate confidence scores over time
 * 
 * Useful for calculating historical reliability
 */
export function aggregateConfidenceScores(
  scores: number[],
  decayFactor: number = 0.95
): number {
  if (scores.length === 0) return 0;

  // Apply exponential decay (recent scores weighted more)
  let weightedSum = 0;
  let weightSum = 0;

  for (let i = 0; i < scores.length; i++) {
    const weight = Math.pow(decayFactor, scores.length - 1 - i);
    weightedSum += scores[i] * weight;
    weightSum += weight;
  }

  return weightedSum / weightSum;
}



