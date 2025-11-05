/**
 * Session Fingerprinting
 * 
 * Tracks device and browser characteristics to detect session hijacking
 */

import crypto from 'crypto';

export interface DeviceFingerprint {
  id: string;
  userAgent: string;
  platform?: string;
  language?: string;
  screenResolution?: string;
  timezone?: string;
  plugins?: string[];
  canvas?: string;
  webgl?: string;
  createdAt: Date;
}

/**
 * Generate device fingerprint from request headers
 */
export function generateFingerprint(
  userAgent: string,
  additionalData: Record<string, any> = {}
): string {
  const fingerprintData = {
    userAgent,
    ...additionalData,
  };

  const fingerprintString = JSON.stringify(fingerprintData);
  return crypto
    .createHash('sha256')
    .update(fingerprintString)
    .digest('hex')
    .substring(0, 32);
}

/**
 * Extract device information from request
 */
export function extractDeviceInfo(headers: Record<string, string | undefined>): {
  userAgent: string;
  platform?: string;
  language?: string;
} {
  return {
    userAgent: headers['user-agent'] || 'unknown',
    platform: headers['sec-ch-ua-platform']?.replace(/"/g, ''),
    language: headers['accept-language']?.split(',')[0],
  };
}

/**
 * Compare fingerprints for similarity
 */
export function compareFingerprints(fp1: string, fp2: string): {
  match: boolean;
  similarity: number;
} {
  const match = fp1 === fp2;
  const similarity = match ? 1.0 : 0.0; // Simple exact match for now

  return { match, similarity };
}

/**
 * Detect potential session hijacking
 */
export function detectPotentialHijacking(
  currentFingerprint: string,
  storedFingerprint: string,
  ipAddress: string,
  storedIP: string
): {
  suspicious: boolean;
  reasons: string[];
  riskLevel: 'low' | 'medium' | 'high';
} {
  const reasons: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';

  // Check fingerprint match
  const { match: fpMatch } = compareFingerprints(currentFingerprint, storedFingerprint);
  if (!fpMatch) {
    reasons.push('Device fingerprint mismatch');
    riskLevel = 'medium';
  }

  // Check IP address
  if (ipAddress !== storedIP) {
    reasons.push('IP address changed');
    
    // Escalate risk if both fingerprint and IP changed
    if (!fpMatch) {
      riskLevel = 'high';
    } else {
      riskLevel = riskLevel === 'medium' ? 'medium' : 'low';
    }
  }

  return {
    suspicious: reasons.length > 0,
    reasons,
    riskLevel,
  };
}

/**
 * Parse User-Agent for device details
 */
export function parseUserAgent(userAgent: string): {
  browser: string;
  os: string;
  device: string;
} {
  // Simplified parsing - in production use a library like 'ua-parser-js'
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'Desktop';

  // Detect browser
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';

  // Detect OS
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';

  // Detect device type
  if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
    device = 'Mobile';
  } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    device = 'Tablet';
  }

  return { browser, os, device };
}






