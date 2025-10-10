/**
 * WO-161: Security Headers Middleware
 * 
 * Automatically injects security headers into all HTTP responses
 * to protect against XSS, clickjacking, MITM attacks, and other vulnerabilities.
 * 
 * Features:
 * - Content-Security-Policy (CSP)
 * - HTTP Strict Transport Security (HSTS)
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - Configurable policies
 * - Works across all response types
 */

import { NextApiRequest, NextApiResponse } from 'next';

/**
 * WO-161: Security Headers Configuration
 */
export interface SecurityHeadersConfig {
  contentSecurityPolicy?: {
    directives: Record<string, string | string[]>;
    reportOnly?: boolean;
  };
  strictTransportSecurity?: {
    maxAge: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  xFrameOptions?: 'DENY' | 'SAMEORIGIN' | string;
  xContentTypeOptions?: boolean;
  referrerPolicy?: string;
  permissionsPolicy?: string;
}

/**
 * WO-161: Default security headers configuration
 */
const DEFAULT_CONFIG: SecurityHeadersConfig = {
  contentSecurityPolicy: {
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Needed for Next.js
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'"],
      'connect-src': ["'self'", 'https://api.devnet.solana.com', 'wss://api.devnet.solana.com'],
      'frame-ancestors': ["'none'"],
    },
  },
  strictTransportSecurity: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  xFrameOptions: 'DENY',
  xContentTypeOptions: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: 'geolocation=(), microphone=(), camera=()',
};

/**
 * WO-161: Build CSP header value from directives
 */
function buildCSPHeader(directives: Record<string, string | string[]>): string {
  return Object.entries(directives)
    .map(([key, value]) => {
      const values = Array.isArray(value) ? value.join(' ') : value;
      return `${key} ${values}`;
    })
    .join('; ');
}

/**
 * WO-161: Build HSTS header value
 */
function buildHSTSHeader(config: SecurityHeadersConfig['strictTransportSecurity']): string {
  if (!config) return '';

  const parts = [`max-age=${config.maxAge}`];
  if (config.includeSubDomains) parts.push('includeSubDomains');
  if (config.preload) parts.push('preload');

  return parts.join('; ');
}

/**
 * WO-161: Security Headers Middleware
 * 
 * Automatically injects security headers into all HTTP responses
 */
export function securityHeadersMiddleware(
  config: SecurityHeadersConfig = DEFAULT_CONFIG
) {
  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    // WO-161: Inject headers before sending response
    const injectHeaders = () => {
      // Content-Security-Policy
      if (config.contentSecurityPolicy) {
        const cspHeader = buildCSPHeader(config.contentSecurityPolicy.directives);
        const headerName = config.contentSecurityPolicy.reportOnly
          ? 'Content-Security-Policy-Report-Only'
          : 'Content-Security-Policy';
        res.setHeader(headerName, cspHeader);
      }

      // Strict-Transport-Security (HTTPS only)
      if (config.strictTransportSecurity && req.headers['x-forwarded-proto'] === 'https') {
        const hstsHeader = buildHSTSHeader(config.strictTransportSecurity);
        res.setHeader('Strict-Transport-Security', hstsHeader);
      }

      // X-Frame-Options
      if (config.xFrameOptions) {
        res.setHeader('X-Frame-Options', config.xFrameOptions);
      }

      // X-Content-Type-Options
      if (config.xContentTypeOptions) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
      }

      // Referrer-Policy
      if (config.referrerPolicy) {
        res.setHeader('Referrer-Policy', config.referrerPolicy);
      }

      // Permissions-Policy
      if (config.permissionsPolicy) {
        res.setHeader('Permissions-Policy', config.permissionsPolicy);
      }
    };

    // Override res.json to inject headers
    res.json = function (data: any) {
      injectHeaders();
      return originalJson(data);
    };

    // Override res.send to inject headers
    res.send = function (data: any) {
      injectHeaders();
      return originalSend(data);
    };

    // Continue to next middleware
    next();
  };
}

/**
 * WO-161: Get current security headers configuration
 */
export function getSecurityHeadersConfig(): SecurityHeadersConfig {
  return DEFAULT_CONFIG;
}

/**
 * WO-161: Update security headers configuration
 */
export function updateSecurityHeadersConfig(
  updates: Partial<SecurityHeadersConfig>
): SecurityHeadersConfig {
  Object.assign(DEFAULT_CONFIG, updates);
  console.log('[WO-161] Security headers configuration updated');
  return DEFAULT_CONFIG;
}

export default securityHeadersMiddleware();



