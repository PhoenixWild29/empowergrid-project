/**
 * Phantom Wallet Error Handling System
 * 
 * Comprehensive error categorization, recovery suggestions, and logging
 */

import { logger, logSecurityEvent } from '../logging/logger';
import { authRateLimiter } from '../middleware/authRateLimiter';

/**
 * Phantom-specific error codes
 */
export enum PhantomErrorCode {
  // Connection errors
  EXTENSION_NOT_FOUND = 'PHANTOM_EXTENSION_NOT_FOUND',
  EXTENSION_CONFLICT = 'PHANTOM_EXTENSION_CONFLICT',
  CONNECTION_REJECTED = 'PHANTOM_CONNECTION_REJECTED',
  CONNECTION_TIMEOUT = 'PHANTOM_CONNECTION_TIMEOUT',
  
  // Mobile errors
  MOBILE_APP_NOT_FOUND = 'PHANTOM_MOBILE_NOT_FOUND',
  MOBILE_CONNECTIVITY = 'PHANTOM_MOBILE_CONNECTIVITY',
  DEEP_LINK_FAILED = 'PHANTOM_DEEP_LINK_FAILED',
  
  // Transaction errors
  TRANSACTION_REJECTED = 'PHANTOM_TRANSACTION_REJECTED',
  TRANSACTION_TIMEOUT = 'PHANTOM_TRANSACTION_TIMEOUT',
  INSUFFICIENT_FUNDS = 'PHANTOM_INSUFFICIENT_FUNDS',
  
  // Signature errors
  SIGNATURE_REJECTED = 'PHANTOM_SIGNATURE_REJECTED',
  SIGNATURE_INVALID = 'PHANTOM_SIGNATURE_INVALID',
  MESSAGE_FORMAT_ERROR = 'PHANTOM_MESSAGE_FORMAT_ERROR',
  
  // Network errors
  NETWORK_MISMATCH = 'PHANTOM_NETWORK_MISMATCH',
  RPC_ERROR = 'PHANTOM_RPC_ERROR',
  
  // Account errors
  ACCOUNT_LOCKED = 'PHANTOM_ACCOUNT_LOCKED',
  ACCOUNT_CHANGED = 'PHANTOM_ACCOUNT_CHANGED',
  
  // General errors
  UNKNOWN_ERROR = 'PHANTOM_UNKNOWN_ERROR',
}

/**
 * Phantom error structure
 */
export interface PhantomError {
  code: PhantomErrorCode;
  message: string;
  diagnostics: string;
  recovery: {
    steps: string[];
    action?: string;
    actionUrl?: string;
  };
  timestamp: string;
  rateLimited?: boolean;
}

/**
 * Error categorization map
 */
const ERROR_PATTERNS: Array<{
  pattern: RegExp | string;
  code: PhantomErrorCode;
  message: string;
  diagnostics: string;
  recovery: PhantomError['recovery'];
}> = [
  {
    pattern: /not installed|extension not found/i,
    code: PhantomErrorCode.EXTENSION_NOT_FOUND,
    message: 'Phantom wallet extension not found',
    diagnostics: 'The Phantom browser extension is not installed or detected in your browser.',
    recovery: {
      steps: [
        'Install Phantom extension from official website',
        'Refresh your browser',
        'Try connecting again',
      ],
      action: 'Install Phantom',
      actionUrl: 'https://phantom.app/',
    },
  },
  {
    pattern: /rejected|declined|user rejected/i,
    code: PhantomErrorCode.CONNECTION_REJECTED,
    message: 'Connection request rejected',
    diagnostics: 'You rejected the connection request in your Phantom wallet.',
    recovery: {
      steps: [
        'Click "Connect Phantom Wallet" again',
        'Approve the connection when prompted',
        'Ensure Phantom is unlocked',
      ],
    },
  },
  {
    pattern: /signature.*rejected|user.*cancelled/i,
    code: PhantomErrorCode.SIGNATURE_REJECTED,
    message: 'Signature request rejected',
    diagnostics: 'You rejected the signature request required for authentication.',
    recovery: {
      steps: [
        'Restart the authentication process',
        'Approve the signature when prompted',
        'Note: Signing does not cost gas fees',
      ],
    },
  },
  {
    pattern: /timeout|timed out/i,
    code: PhantomErrorCode.CONNECTION_TIMEOUT,
    message: 'Connection timeout',
    diagnostics: 'The connection request to Phantom wallet timed out after 30 seconds.',
    recovery: {
      steps: [
        'Ensure Phantom wallet is unlocked',
        'Check your browser notifications',
        'Try connecting again',
      ],
    },
  },
  {
    pattern: /network.*mismatch|wrong network/i,
    code: PhantomErrorCode.NETWORK_MISMATCH,
    message: 'Network mismatch',
    diagnostics: 'Your Phantom wallet is connected to a different Solana network.',
    recovery: {
      steps: [
        'Open Phantom wallet',
        'Switch to Devnet/Mainnet as required',
        'Reconnect to the application',
      ],
    },
  },
  {
    pattern: /account.*locked|wallet locked/i,
    code: PhantomErrorCode.ACCOUNT_LOCKED,
    message: 'Wallet locked',
    diagnostics: 'Your Phantom wallet is locked.',
    recovery: {
      steps: [
        'Unlock your Phantom wallet',
        'Enter your password',
        'Try the operation again',
      ],
    },
  },
  {
    pattern: /account.*changed/i,
    code: PhantomErrorCode.ACCOUNT_CHANGED,
    message: 'Account changed',
    diagnostics: 'The wallet account was changed during the authentication process.',
    recovery: {
      steps: [
        'Select the account you want to use',
        'Restart the authentication process',
        'Complete authentication with the selected account',
      ],
    },
  },
];

/**
 * Categorize Phantom error
 * 
 * @param error - Error object or message
 * @returns Categorized Phantom error
 */
export function categorizePhantomError(
  error: Error | string
): PhantomError {
  const errorMessage = typeof error === 'string' ? error : error.message;

  // Find matching pattern
  for (const pattern of ERROR_PATTERNS) {
    const matches = typeof pattern.pattern === 'string'
      ? errorMessage.includes(pattern.pattern)
      : pattern.pattern.test(errorMessage);

    if (matches) {
      return {
        code: pattern.code,
        message: pattern.message,
        diagnostics: pattern.diagnostics,
        recovery: pattern.recovery,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Unknown error
  return {
    code: PhantomErrorCode.UNKNOWN_ERROR,
    message: 'Unexpected Phantom wallet error',
    diagnostics: errorMessage,
    recovery: {
      steps: [
        'Try again in a few moments',
        'Ensure Phantom is updated to the latest version',
        'Contact support if the problem persists',
      ],
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Handle Phantom error with rate limiting
 * 
 * @param error - Error to handle
 * @param ipAddress - Client IP address
 * @param userId - Optional user ID
 * @returns Phantom error with rate limit info
 */
export function handlePhantomError(
  error: Error | string,
  ipAddress: string,
  userId?: string
): PhantomError {
  const categorizedError = categorizePhantomError(error);

  // Check rate limiting (5 attempts per 15 minutes)
  const rateLimitStatus = authRateLimiter.checkRateLimit(ipAddress, 'LOGIN');
  
  if (rateLimitStatus.isLimited) {
    categorizedError.rateLimited = true;
  }

  // Log error (without sensitive information)
  logger.error('Phantom wallet error', {
    code: categorizedError.code,
    message: categorizedError.message,
    userId,
    ipAddress: ipAddress.substring(0, 7) + '...', // Partial IP for privacy
    rateLimited: categorizedError.rateLimited,
  });

  // Log security event for suspicious patterns
  if (rateLimitStatus.remainingRequests <= 2) {
    logSecurityEvent(
      'phantom_repeated_failures',
      userId,
      ipAddress,
      {
        code: categorizedError.code,
        attemptsRemaining: rateLimitStatus.remainingRequests,
      }
    );
  }

  return categorizedError;
}

/**
 * Get user-friendly error message
 * 
 * @param errorCode - Phantom error code
 * @returns User-friendly message
 */
export function getPhantomErrorMessage(errorCode: PhantomErrorCode): string {
  const messages: Record<PhantomErrorCode, string> = {
    [PhantomErrorCode.EXTENSION_NOT_FOUND]: 'Phantom wallet extension not found. Please install it from phantom.app',
    [PhantomErrorCode.EXTENSION_CONFLICT]: 'Multiple wallet extensions detected. Please disable other Solana wallets.',
    [PhantomErrorCode.CONNECTION_REJECTED]: 'Connection rejected. Please approve the connection in Phantom.',
    [PhantomErrorCode.CONNECTION_TIMEOUT]: 'Connection timed out. Please ensure Phantom is unlocked.',
    [PhantomErrorCode.MOBILE_APP_NOT_FOUND]: 'Phantom mobile app not detected. Please install it.',
    [PhantomErrorCode.MOBILE_CONNECTIVITY]: 'Mobile connection failed. Check your internet connection.',
    [PhantomErrorCode.DEEP_LINK_FAILED]: 'Failed to open Phantom app. Please open it manually.',
    [PhantomErrorCode.TRANSACTION_REJECTED]: 'Transaction rejected in Phantom wallet.',
    [PhantomErrorCode.TRANSACTION_TIMEOUT]: 'Transaction timed out. Please try again.',
    [PhantomErrorCode.INSUFFICIENT_FUNDS]: 'Insufficient SOL balance in Phantom wallet.',
    [PhantomErrorCode.SIGNATURE_REJECTED]: 'Signature request rejected. Authentication cannot proceed.',
    [PhantomErrorCode.SIGNATURE_INVALID]: 'Invalid signature. Please try authenticating again.',
    [PhantomErrorCode.MESSAGE_FORMAT_ERROR]: 'Message format error. Please contact support.',
    [PhantomErrorCode.NETWORK_MISMATCH]: 'Network mismatch. Please switch to the correct Solana network.',
    [PhantomErrorCode.RPC_ERROR]: 'Network error. Please check your connection.',
    [PhantomErrorCode.ACCOUNT_LOCKED]: 'Phantom wallet is locked. Please unlock it.',
    [PhantomErrorCode.ACCOUNT_CHANGED]: 'Wallet account changed. Please authenticate again.',
    [PhantomErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred with Phantom wallet.',
  };

  return messages[errorCode] || messages[PhantomErrorCode.UNKNOWN_ERROR];
}

/**
 * Check if error is rate limited
 * 
 * @param ipAddress - Client IP
 * @returns boolean indicating if rate limited
 */
export function isPhantomErrorRateLimited(ipAddress: string): boolean {
  const status = authRateLimiter.checkRateLimit(ipAddress, 'LOGIN');
  return status.isLimited;
}

/**
 * Create API error response for Phantom errors
 * 
 * @param error - Phantom error
 * @param statusCode - HTTP status code
 * @returns API response object
 */
export function createPhantomErrorResponse(
  error: PhantomError,
  statusCode: number = 400
) {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      diagnostics: error.diagnostics,
      recovery: error.recovery,
      timestamp: error.timestamp,
      rateLimited: error.rateLimited,
    },
    statusCode,
  };
}




