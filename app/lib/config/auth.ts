/**
 * Authentication Configuration
 * 
 * Centralized configuration for JWT tokens, wallet providers,
 * and authentication settings.
 */

/**
 * JWT Configuration
 */
export const JWT_CONFIG = {
  // JWT Secret - should be set via environment variable in production
  SECRET: process.env.JWT_SECRET || 'empowergrid-dev-secret-change-in-production',
  
  // Token expiration times
  ACCESS_TOKEN_EXPIRY: '24h', // 24 hours
  REFRESH_TOKEN_EXPIRY: '7d', // 7 days
  
  // Token issuer
  ISSUER: 'empowergrid.io',
  
  // Token audience
  AUDIENCE: 'empowergrid-users',
  
  // Algorithm
  ALGORITHM: 'HS256' as const,
};

/**
 * Session Configuration
 */
export const SESSION_CONFIG = {
  // Session expiration time (matches access token)
  EXPIRY_HOURS: 24,
  
  // Maximum concurrent sessions per user
  MAX_SESSIONS_PER_USER: 5,
  
  // Session cleanup interval (remove expired sessions)
  CLEANUP_INTERVAL_HOURS: 6,
} as const;

/**
 * Supported Solana Wallet Providers
 */
export enum WalletProvider {
  PHANTOM = 'phantom',
  SOLFLARE = 'solflare',
  LEDGER = 'ledger',
  SOLLET = 'sollet',
  GLOW = 'glow',
  BACKPACK = 'backpack',
  UNKNOWN = 'unknown',
}

/**
 * Wallet Provider Configuration
 */
export const WALLET_PROVIDERS = {
  [WalletProvider.PHANTOM]: {
    name: 'Phantom',
    signatureFormat: 'ed25519',
    verificationMethod: 'standard',
  },
  [WalletProvider.SOLFLARE]: {
    name: 'Solflare',
    signatureFormat: 'ed25519',
    verificationMethod: 'standard',
  },
  [WalletProvider.LEDGER]: {
    name: 'Ledger',
    signatureFormat: 'ed25519',
    verificationMethod: 'standard',
  },
  [WalletProvider.SOLLET]: {
    name: 'Sollet',
    signatureFormat: 'ed25519',
    verificationMethod: 'standard',
  },
  [WalletProvider.GLOW]: {
    name: 'Glow',
    signatureFormat: 'ed25519',
    verificationMethod: 'standard',
  },
  [WalletProvider.BACKPACK]: {
    name: 'Backpack',
    signatureFormat: 'ed25519',
    verificationMethod: 'standard',
  },
  [WalletProvider.UNKNOWN]: {
    name: 'Unknown Wallet',
    signatureFormat: 'ed25519',
    verificationMethod: 'standard',
  },
} as const;

/**
 * Authentication Error Codes
 */
export enum AuthErrorCode {
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  EXPIRED_CHALLENGE = 'EXPIRED_CHALLENGE',
  CHALLENGE_NOT_FOUND = 'CHALLENGE_NOT_FOUND',
  CHALLENGE_ALREADY_USED = 'CHALLENGE_ALREADY_USED',
  INVALID_WALLET_ADDRESS = 'INVALID_WALLET_ADDRESS',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  REGISTRATION_FAILED = 'REGISTRATION_FAILED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Authentication Error Messages
 */
export const AUTH_ERROR_MESSAGES = {
  [AuthErrorCode.INVALID_SIGNATURE]: 'Invalid wallet signature. Please try again.',
  [AuthErrorCode.EXPIRED_CHALLENGE]: 'Authentication challenge has expired. Please request a new challenge.',
  [AuthErrorCode.CHALLENGE_NOT_FOUND]: 'Authentication challenge not found. Please request a new challenge.',
  [AuthErrorCode.CHALLENGE_ALREADY_USED]: 'This challenge has already been used. Please request a new challenge.',
  [AuthErrorCode.INVALID_WALLET_ADDRESS]: 'Invalid wallet address format.',
  [AuthErrorCode.INVALID_TOKEN]: 'Invalid authentication token.',
  [AuthErrorCode.TOKEN_EXPIRED]: 'Authentication token has expired. Please log in again.',
  [AuthErrorCode.SESSION_NOT_FOUND]: 'Session not found. Please log in again.',
  [AuthErrorCode.USER_NOT_FOUND]: 'User not found.',
  [AuthErrorCode.REGISTRATION_FAILED]: 'Failed to register user. Please try again.',
  [AuthErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
} as const;

/**
 * Challenge Configuration (imported from existing config)
 */
export const CHALLENGE_CONFIG = {
  EXPIRY_MINUTES: 5,
  MAX_ATTEMPTS: 3,
} as const;

/**
 * Rate Limiting Configuration for Authentication
 * Enhanced with stricter limits per endpoint
 */
export const AUTH_RATE_LIMIT = {
  // Legacy config (deprecated - use AUTH_RATE_LIMITS in authRateLimiter.ts)
  LOGIN_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_LOGIN_ATTEMPTS: 5, // 5 login attempts per window (ENHANCED)
  CHALLENGE_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_CHALLENGE_REQUESTS: 20, // 20 challenge requests per window
  
  // Enhanced rate limits per endpoint (from authRateLimiter)
  LIMITS: {
    CHALLENGE: { MAX: 20, WINDOW_MS: 15 * 60 * 1000 },
    LOGIN: { MAX: 5, WINDOW_MS: 15 * 60 * 1000 }, // Most restrictive
    REFRESH: { MAX: 10, WINDOW_MS: 15 * 60 * 1000 },
    LOGOUT: { MAX: 20, WINDOW_MS: 15 * 60 * 1000 },
    SESSION: { MAX: 50, WINDOW_MS: 15 * 60 * 1000 },
  },
  
  // Progressive delay thresholds
  PROGRESSIVE_DELAYS: {
    ENABLED: true,
    THRESHOLDS: [
      { USAGE: 0.6, DELAY_MS: 0 }, // 60% usage - no delay
      { USAGE: 0.8, DELAY_MS: 500 }, // 80% usage - 500ms delay
      { USAGE: 0.9, DELAY_MS: 1000 }, // 90% usage - 1 second delay
    ],
  },
} as const;

/**
 * Token Refresh Configuration
 */
export const TOKEN_REFRESH_CONFIG = {
  // Auto-refresh threshold (minutes before expiry)
  AUTO_REFRESH_THRESHOLD_MINUTES: 5,
  
  // Enable token rotation on manual refresh
  ENABLE_REFRESH_TOKEN_ROTATION: true,
  
  // Enable automatic refresh on protected routes
  ENABLE_AUTO_REFRESH: true,
} as const;

/**
 * User Registration Defaults
 */
export const USER_DEFAULTS = {
  ROLE: 'FUNDER' as const,
  REPUTATION: 0,
  VERIFIED: false,
} as const;

/**
 * Validate JWT secret is configured properly
 */
export function validateAuthConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check JWT secret
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    errors.push('JWT_SECRET environment variable is not set in production');
  }
  
  if (JWT_CONFIG.SECRET === 'empowergrid-dev-secret-change-in-production' && 
      process.env.NODE_ENV === 'production') {
    errors.push('Using default JWT secret in production is not secure');
  }
  
  // Check database URL
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL environment variable is not set');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Helper to detect wallet provider from user agent or request metadata
 */
export function detectWalletProvider(userAgent?: string): WalletProvider {
  if (!userAgent) return WalletProvider.UNKNOWN;
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('phantom')) return WalletProvider.PHANTOM;
  if (ua.includes('solflare')) return WalletProvider.SOLFLARE;
  if (ua.includes('ledger')) return WalletProvider.LEDGER;
  if (ua.includes('sollet')) return WalletProvider.SOLLET;
  if (ua.includes('glow')) return WalletProvider.GLOW;
  if (ua.includes('backpack')) return WalletProvider.BACKPACK;
  
  return WalletProvider.UNKNOWN;
}

/**
 * Export configuration validation on module load in development
 */
if (process.env.NODE_ENV === 'development') {
  const validation = validateAuthConfig();
  if (!validation.isValid) {
    console.warn('⚠️  Authentication configuration warnings:');
    validation.errors.forEach(error => console.warn(`   - ${error}`));
  }
}

