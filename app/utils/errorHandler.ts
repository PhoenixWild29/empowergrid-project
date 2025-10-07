import { z } from 'zod';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export class EmpowerGridError extends Error {
  public readonly code: string;
  public readonly details?: any;
  public readonly timestamp: Date;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'EmpowerGridError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
  }
}

// Error codes
export const ERROR_CODES = {
  // Wallet errors
  WALLET_NOT_CONNECTED: 'WALLET_NOT_CONNECTED',
  WALLET_CONNECTION_FAILED: 'WALLET_CONNECTION_FAILED',
  WALLET_DISCONNECTED: 'WALLET_DISCONNECTED',

  // Transaction errors
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  TRANSACTION_TIMEOUT: 'TRANSACTION_TIMEOUT',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  INVALID_AMOUNT: 'INVALID_AMOUNT',

  // API errors
  API_ERROR: 'API_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',

  // Program errors
  PROGRAM_ERROR: 'PROGRAM_ERROR',
  PROGRAM_INITIALIZATION_FAILED: 'PROGRAM_INITIALIZATION_FAILED',

  // File/Upload errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',

  // Generic errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  OPERATION_CANCELLED: 'OPERATION_CANCELLED',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// Error messages
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.WALLET_NOT_CONNECTED]: 'Please connect your wallet to continue',
  [ERROR_CODES.WALLET_CONNECTION_FAILED]:
    'Failed to connect wallet. Please try again',
  [ERROR_CODES.WALLET_DISCONNECTED]: 'Wallet disconnected. Please reconnect',

  [ERROR_CODES.TRANSACTION_FAILED]: 'Transaction failed. Please try again',
  [ERROR_CODES.TRANSACTION_TIMEOUT]: 'Transaction timed out. Please try again',
  [ERROR_CODES.INSUFFICIENT_FUNDS]: 'Insufficient funds for this transaction',

  [ERROR_CODES.VALIDATION_ERROR]: 'Please check your input and try again',
  [ERROR_CODES.INVALID_ADDRESS]: 'Invalid Solana address provided',
  [ERROR_CODES.INVALID_AMOUNT]: 'Invalid amount specified',

  [ERROR_CODES.API_ERROR]: 'API request failed. Please try again',
  [ERROR_CODES.NETWORK_ERROR]:
    'Network connection error. Please check your connection',
  [ERROR_CODES.SERVER_ERROR]: 'Server error. Please try again later',

  [ERROR_CODES.PROGRAM_ERROR]: 'Smart contract error occurred',
  [ERROR_CODES.PROGRAM_INITIALIZATION_FAILED]: 'Failed to initialize program',

  [ERROR_CODES.FILE_TOO_LARGE]: 'File size exceeds maximum limit',
  [ERROR_CODES.INVALID_FILE_TYPE]: 'Invalid file type selected',
  [ERROR_CODES.UPLOAD_FAILED]: 'File upload failed. Please try again',

  [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred',
  [ERROR_CODES.OPERATION_CANCELLED]: 'Operation was cancelled',
};

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export const ERROR_SEVERITY: Record<ErrorCode, ErrorSeverity> = {
  [ERROR_CODES.WALLET_NOT_CONNECTED]: ErrorSeverity.MEDIUM,
  [ERROR_CODES.WALLET_CONNECTION_FAILED]: ErrorSeverity.HIGH,
  [ERROR_CODES.WALLET_DISCONNECTED]: ErrorSeverity.MEDIUM,

  [ERROR_CODES.TRANSACTION_FAILED]: ErrorSeverity.HIGH,
  [ERROR_CODES.TRANSACTION_TIMEOUT]: ErrorSeverity.MEDIUM,
  [ERROR_CODES.INSUFFICIENT_FUNDS]: ErrorSeverity.HIGH,

  [ERROR_CODES.VALIDATION_ERROR]: ErrorSeverity.LOW,
  [ERROR_CODES.INVALID_ADDRESS]: ErrorSeverity.MEDIUM,
  [ERROR_CODES.INVALID_AMOUNT]: ErrorSeverity.MEDIUM,

  [ERROR_CODES.API_ERROR]: ErrorSeverity.MEDIUM,
  [ERROR_CODES.NETWORK_ERROR]: ErrorSeverity.HIGH,
  [ERROR_CODES.SERVER_ERROR]: ErrorSeverity.HIGH,

  [ERROR_CODES.PROGRAM_ERROR]: ErrorSeverity.HIGH,
  [ERROR_CODES.PROGRAM_INITIALIZATION_FAILED]: ErrorSeverity.CRITICAL,

  [ERROR_CODES.FILE_TOO_LARGE]: ErrorSeverity.MEDIUM,
  [ERROR_CODES.INVALID_FILE_TYPE]: ErrorSeverity.MEDIUM,
  [ERROR_CODES.UPLOAD_FAILED]: ErrorSeverity.MEDIUM,

  [ERROR_CODES.UNKNOWN_ERROR]: ErrorSeverity.MEDIUM,
  [ERROR_CODES.OPERATION_CANCELLED]: ErrorSeverity.LOW,
};

// Error handling utilities
export function createError(code: ErrorCode, details?: any): EmpowerGridError {
  return new EmpowerGridError(code, ERROR_MESSAGES[code], details);
}

export function handleError(error: unknown): AppError {
  if (error instanceof EmpowerGridError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: error.timestamp,
    };
  }

  if (error instanceof z.ZodError) {
    return {
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Validation failed',
      details: error.errors,
      timestamp: new Date(),
    };
  }

  if (error instanceof Error) {
    // Try to map common error messages to codes
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('fetch')) {
      return {
        code: ERROR_CODES.NETWORK_ERROR,
        message: ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR],
        details: error.message,
        timestamp: new Date(),
      };
    }

    if (message.includes('insufficient') || message.includes('balance')) {
      return {
        code: ERROR_CODES.INSUFFICIENT_FUNDS,
        message: ERROR_MESSAGES[ERROR_CODES.INSUFFICIENT_FUNDS],
        details: error.message,
        timestamp: new Date(),
      };
    }

    return {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: error.message,
      details: error.stack,
      timestamp: new Date(),
    };
  }

  return {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR],
    details: error,
    timestamp: new Date(),
  };
}

export function getErrorSeverity(code: ErrorCode): ErrorSeverity {
  return ERROR_SEVERITY[code] || ErrorSeverity.MEDIUM;
}

export function shouldShowToast(severity: ErrorSeverity): boolean {
  return severity !== ErrorSeverity.LOW;
}

export function logError(error: AppError): void {
  const severity = getErrorSeverity(error.code as ErrorCode);

  switch (severity) {
    case ErrorSeverity.CRITICAL:
      console.error('CRITICAL ERROR:', error);
      break;
    case ErrorSeverity.HIGH:
      console.error('HIGH PRIORITY ERROR:', error);
      break;
    case ErrorSeverity.MEDIUM:
      console.warn('ERROR:', error);
      break;
    case ErrorSeverity.LOW:
      console.info('INFO:', error);
      break;
  }

  // In production, you might want to send errors to a logging service
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'exception', {
      description: `${error.code}: ${error.message}`,
      fatal: severity === ErrorSeverity.CRITICAL,
    });
  }
}
