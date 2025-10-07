import { logger } from '../logging/logger';
import { performanceMonitor } from './performance';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error categories
export enum ErrorCategory {
  NETWORK = 'network',
  DATABASE = 'database',
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business_logic',
  EXTERNAL_API = 'external_api',
  UI_COMPONENT = 'ui_component',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  UNKNOWN = 'unknown',
}

// Error context interface
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
  url?: string;
  userAgent?: string;
  timestamp?: Date;
  type?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  promise?: string;
  componentStack?: string;
}

// Error report interface
export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: ErrorContext;
  fingerprint: string;
  occurrences: number;
  firstSeen: Date;
  lastSeen: Date;
  resolved: boolean;
}

// Error tracking service
export class ErrorTracker {
  private static instance: ErrorTracker;
  private errors: Map<string, ErrorReport> = new Map();
  private maxErrors: number = 1000;

  private constructor() {}

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  // Track an error
  trackError(
    error: Error | string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    context: ErrorContext = {}
  ): void {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Create error fingerprint for grouping similar errors
    const fingerprint = this.createFingerprint(
      errorMessage,
      errorStack,
      category
    );

    // Check if this error has been seen before
    const existingError = this.errors.get(fingerprint);

    if (existingError) {
      // Update existing error
      existingError.occurrences++;
      existingError.lastSeen = new Date();
      existingError.context = { ...existingError.context, ...context };
    } else {
      // Create new error report
      const errorReport: ErrorReport = {
        id: this.generateId(),
        message: errorMessage,
        stack: errorStack,
        severity,
        category,
        context: {
          ...context,
          timestamp: new Date(),
        },
        fingerprint,
        occurrences: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        resolved: false,
      };

      this.errors.set(fingerprint, errorReport);

      // Limit the number of stored errors
      if (this.errors.size > this.maxErrors) {
        // Remove oldest error
        const oldestKey = Array.from(this.errors.keys())[0];
        this.errors.delete(oldestKey);
      }
    }

    // Log the error
    this.logError(error, severity, category, context);
  }

  // Create error fingerprint for grouping
  private createFingerprint(
    message: string,
    stack?: string,
    category?: ErrorCategory
  ): string {
    // Create a simplified stack trace for fingerprinting
    const simplifiedStack = stack
      ? stack
          .split('\n')
          .slice(0, 5) // Take first 5 lines
          .map(line => line.trim())
          .join('')
      : '';

    return `${category}:${message}:${simplifiedStack}`.replace(/\s+/g, '');
  }

  // Generate unique ID
  private generateId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Log error with appropriate level
  private logError(
    error: Error | string,
    severity: ErrorSeverity,
    category: ErrorCategory,
    context: ErrorContext
  ): void {
    const logData = {
      error: error instanceof Error ? error.message : error,
      severity,
      category,
      ...context,
    };

    switch (severity) {
      case ErrorSeverity.CRITICAL:
        logger.error('Critical Error', logData);
        break;
      case ErrorSeverity.HIGH:
        logger.error('High Priority Error', logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn('Medium Priority Error', logData);
        break;
      case ErrorSeverity.LOW:
        logger.info('Low Priority Error', logData);
        break;
    }
  }

  // Get error statistics
  getErrorStats(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byCategory: Record<ErrorCategory, number>;
    unresolved: number;
  } {
    const stats = {
      total: this.errors.size,
      bySeverity: {
        [ErrorSeverity.LOW]: 0,
        [ErrorSeverity.MEDIUM]: 0,
        [ErrorSeverity.HIGH]: 0,
        [ErrorSeverity.CRITICAL]: 0,
      },
      byCategory: {
        [ErrorCategory.NETWORK]: 0,
        [ErrorCategory.DATABASE]: 0,
        [ErrorCategory.AUTHENTICATION]: 0,
        [ErrorCategory.VALIDATION]: 0,
        [ErrorCategory.BUSINESS_LOGIC]: 0,
        [ErrorCategory.EXTERNAL_API]: 0,
        [ErrorCategory.UI_COMPONENT]: 0,
        [ErrorCategory.PERFORMANCE]: 0,
        [ErrorCategory.SECURITY]: 0,
        [ErrorCategory.UNKNOWN]: 0,
      },
      unresolved: 0,
    };

    for (const error of this.errors.values()) {
      stats.bySeverity[error.severity]++;
      stats.byCategory[error.category]++;

      if (!error.resolved) {
        stats.unresolved++;
      }
    }

    return stats;
  }

  // Get all errors
  getAllErrors(): ErrorReport[] {
    return Array.from(this.errors.values());
  }

  // Get errors by severity
  getErrorsBySeverity(severity: ErrorSeverity): ErrorReport[] {
    return Array.from(this.errors.values()).filter(
      error => error.severity === severity
    );
  }

  // Get errors by category
  getErrorsByCategory(category: ErrorCategory): ErrorReport[] {
    return Array.from(this.errors.values()).filter(
      error => error.category === category
    );
  }

  // Mark error as resolved
  markErrorResolved(fingerprint: string): boolean {
    const error = this.errors.get(fingerprint);
    if (error) {
      error.resolved = true;
      logger.info('Error marked as resolved', {
        errorId: error.id,
        fingerprint,
      });
      return true;
    }
    return false;
  }

  // Clear resolved errors
  clearResolvedErrors(): number {
    let cleared = 0;
    for (const [fingerprint, error] of this.errors) {
      if (error.resolved) {
        this.errors.delete(fingerprint);
        cleared++;
      }
    }
    logger.info('Cleared resolved errors', { count: cleared });
    return cleared;
  }

  // Export errors for analysis
  exportErrors(): string {
    return JSON.stringify(this.getAllErrors(), null, 2);
  }
}

// Global error handler
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private errorTracker: ErrorTracker;

  private constructor() {
    this.errorTracker = ErrorTracker.getInstance();
    this.setupGlobalHandlers();
  }

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  private setupGlobalHandlers(): void {
    // Handle uncaught exceptions
    process.on('uncaughtException', error => {
      this.errorTracker.trackError(
        error,
        ErrorSeverity.CRITICAL,
        ErrorCategory.UNKNOWN,
        {
          type: 'uncaughtException',
          component: 'global',
        }
      );
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      const error =
        reason instanceof Error ? reason : new Error(String(reason));
      this.errorTracker.trackError(
        error,
        ErrorSeverity.HIGH,
        ErrorCategory.UNKNOWN,
        {
          type: 'unhandledRejection',
          component: 'global',
          promise: promise.toString(),
        }
      );
    });

    // Handle browser errors (if in browser environment)
    if (typeof window !== 'undefined') {
      window.addEventListener('error', event => {
        this.errorTracker.trackError(
          event.error || event.message,
          ErrorSeverity.MEDIUM,
          ErrorCategory.UI_COMPONENT,
          {
            type: 'browserError',
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          }
        );
      });

      window.addEventListener('unhandledrejection', event => {
        const error =
          event.reason instanceof Error
            ? event.reason
            : new Error(String(event.reason));
        this.errorTracker.trackError(
          error,
          ErrorSeverity.HIGH,
          ErrorCategory.UNKNOWN,
          {
            type: 'browserUnhandledRejection',
            component: 'global',
          }
        );
      });
    }
  }

  // Manually track an error
  trackError(
    error: Error | string,
    severity?: ErrorSeverity,
    category?: ErrorCategory,
    context?: ErrorContext
  ): void {
    this.errorTracker.trackError(error, severity, category, context);
  }
}

// React Error Boundary integration
export class ReactErrorBoundaryTracker {
  private static instance: ReactErrorBoundaryTracker;
  private errorTracker: ErrorTracker;

  private constructor() {
    this.errorTracker = ErrorTracker.getInstance();
  }

  static getInstance(): ReactErrorBoundaryTracker {
    if (!ReactErrorBoundaryTracker.instance) {
      ReactErrorBoundaryTracker.instance = new ReactErrorBoundaryTracker();
    }
    return ReactErrorBoundaryTracker.instance;
  }

  // Track React component errors
  trackComponentError(
    error: Error,
    errorInfo: { componentStack: string },
    componentName?: string,
    userId?: string
  ): void {
    this.errorTracker.trackError(
      error,
      ErrorSeverity.HIGH,
      ErrorCategory.UI_COMPONENT,
      {
        component: componentName,
        userId,
        componentStack: errorInfo.componentStack,
        type: 'reactErrorBoundary',
      }
    );
  }
}

// Export singleton instances
export const errorTracker = ErrorTracker.getInstance();
export const globalErrorHandler = GlobalErrorHandler.getInstance();
export const reactErrorBoundaryTracker =
  ReactErrorBoundaryTracker.getInstance();
