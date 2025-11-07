/**
 * Comprehensive Error Logger
 * 
 * Captures and logs all types of errors in the application:
 * - React component errors
 * - Unhandled JavaScript errors
 * - Unhandled promise rejections
 * - Network errors
 * - Console errors
 * - Next.js errors
 */

export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  type: 'react' | 'javascript' | 'promise' | 'network' | 'console' | 'nextjs' | 'unknown';
  severity: 'critical' | 'high' | 'medium' | 'low';
  error: {
    name: string;
    message: string;
    stack?: string;
    cause?: any;
  };
  context: {
    url?: string;
    userAgent?: string;
    componentStack?: string;
    componentName?: string;
    props?: any;
    state?: any;
    userId?: string;
    sessionId?: string;
    [key: string]: any;
  };
  metadata?: {
    filename?: string;
    lineno?: number;
    colno?: number;
    source?: string;
    [key: string]: any;
  };
}

class ComprehensiveErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 errors
  private listeners: Array<(entry: ErrorLogEntry) => void> = [];
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Load previous logs from localStorage
    this.loadLogsFromStorage();

    // Capture unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'javascript',
        severity: 'high',
        error: {
          name: event.error?.name || 'Error',
          message: event.message || 'Unknown error',
          stack: event.error?.stack,
          cause: event.error?.cause,
        },
        context: {
          url: window.location.href,
          userAgent: navigator.userAgent,
        },
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          source: 'window.error',
        },
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));

      this.logError({
        type: 'promise',
        severity: 'high',
        error: {
          name: error.name || 'UnhandledPromiseRejection',
          message: error.message || String(event.reason),
          stack: error.stack,
          cause: event.reason,
        },
        context: {
          url: window.location.href,
          userAgent: navigator.userAgent,
        },
        metadata: {
          source: 'unhandledrejection',
        },
      });
    });

    // Capture console errors (override console.error)
    // Only if it hasn't been overridden already
    if (!(console.error as any).__errorLoggerWrapped) {
      const originalConsoleError = console.error.bind(console);
      const wrappedConsoleError = (...args: any[]) => {
        try {
          // Call original console.error
          originalConsoleError.apply(console, args);

          // Extract error information
          const error = args.find(arg => arg instanceof Error) || args[0];
          const message = error instanceof Error 
            ? error.message 
            : typeof error === 'string' 
            ? error 
            : JSON.stringify(error);

          // Don't log errors from the error logger itself to prevent loops
          if (message.includes('ErrorLogger') || message.includes('comprehensiveErrorLogger')) {
            return;
          }

          this.logError({
            type: 'console',
            severity: 'medium',
            error: {
              name: error instanceof Error ? error.name : 'ConsoleError',
              message,
              stack: error instanceof Error ? error.stack : undefined,
            },
            context: {
              url: window.location.href,
              userAgent: navigator.userAgent,
            },
            metadata: {
              source: 'console.error',
              args: args.map(arg => {
                if (arg instanceof Error) {
                  return { name: arg.name, message: arg.message, stack: arg.stack };
                }
                return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
              }),
            },
          });
        } catch (err) {
          // If logging fails, just call original - don't throw
          originalConsoleError.apply(console, args);
        }
      };
      
      (wrappedConsoleError as any).__errorLoggerWrapped = true;
      console.error = wrappedConsoleError;
    }

    // Capture fetch errors
    const originalFetch = window.fetch;
    window.fetch = async (...args: any[]) => {
      try {
        const response = await originalFetch.apply(window, args);
        
        // Only log server-side failures to avoid noise from expected 4xx responses
        if (!response.ok && response.status >= 500) {
          this.logError({
            type: 'network',
            severity: 'high',
            error: {
              name: 'FetchError',
              message: `HTTP ${response.status} ${response.statusText}`,
            },
            context: {
              url: window.location.href,
              userAgent: navigator.userAgent,
            },
            metadata: {
              source: 'fetch',
              requestUrl: args[0],
              status: response.status,
              statusText: response.statusText,
            },
          });
        }
        
        return response;
      } catch (error) {
        if (error instanceof Error) {
          this.logError({
            type: 'network',
            severity: 'high',
            error: {
              name: error.name || 'NetworkError',
              message: error.message,
              stack: error.stack,
              cause: (error as any).cause,
            },
            context: {
              url: window.location.href,
              userAgent: navigator.userAgent,
            },
            metadata: {
              source: 'fetch',
              requestUrl: args[0],
            },
          });
        }
        throw error;
      }
    };

    // Log initialization with verification
    console.log('%c[ErrorLogger] Comprehensive error logging initialized', 'color: #10b981; font-weight: bold;');
    console.log('[ErrorLogger] Listening for:', [
      'window.error events',
      'unhandledrejection events',
      'console.error calls',
      'fetch errors',
      'React errors (via ErrorBoundary)',
      'Next.js errors'
    ].join(', '));
  }

  logError(data: {
    type: ErrorLogEntry['type'];
    severity: ErrorLogEntry['severity'];
    error: ErrorLogEntry['error'];
    context?: Partial<ErrorLogEntry['context']>;
    metadata?: Partial<ErrorLogEntry['metadata']>;
  }): void {
    if (typeof window === 'undefined') return; // Skip during SSR
    const entry: ErrorLogEntry = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: data.type,
      severity: data.severity,
      error: data.error,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...data.context,
      },
      metadata: data.metadata || {},
    };

    // Add to logs
    this.logs.push(entry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Save to localStorage
    this.saveLogsToStorage();

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(entry);
      } catch (error) {
        console.error('Error in error logger listener:', error);
      }
    });

    // Log to console with detailed information
    this.logToConsole(entry);
  }

  logReactError(
    error: Error,
    errorInfo: { componentStack?: string },
    componentName?: string,
    props?: any,
    state?: any
  ): void {
    if (typeof window === 'undefined') return; // Skip during SSR
    this.logError({
      type: 'react',
      severity: 'high',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context: {
        componentStack: errorInfo.componentStack,
        componentName,
        props,
        state,
      },
      metadata: {
        source: 'ReactErrorBoundary',
      },
    });
  }

  logNextJSError(error: Error, context?: any): void {
    if (typeof window === 'undefined') return; // Skip during SSR
    this.logError({
      type: 'nextjs',
      severity: 'high',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      metadata: {
        source: 'Next.js',
      },
    });
  }

  private logToConsole(entry: ErrorLogEntry): void {
    const style = this.getConsoleStyle(entry.severity);
    const prefix = `%c[${entry.type.toUpperCase()}] [${entry.severity.toUpperCase()}]`;
    
    console.groupCollapsed(
      `${prefix} ${entry.error.name}: ${entry.error.message}`,
      style
    );
    
    console.log('Error ID:', entry.id);
    console.log('Timestamp:', entry.timestamp);
    console.log('Type:', entry.type);
    console.log('Severity:', entry.severity);
    
    if (entry.error.stack) {
      console.log('Stack Trace:', entry.error.stack);
    }
    
    if (entry.context.componentStack) {
      console.log('Component Stack:', entry.context.componentStack);
    }
    
    if (entry.context.componentName) {
      console.log('Component:', entry.context.componentName);
    }
    
    if (Object.keys(entry.context).length > 0) {
      console.log('Context:', entry.context);
    }
    
    if (Object.keys(entry.metadata || {}).length > 0) {
      console.log('Metadata:', entry.metadata);
    }
    
    console.groupEnd();
  }

  private getConsoleStyle(severity: string): string {
    const styles: Record<string, string> = {
      critical: 'color: white; background: #dc2626; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
      high: 'color: white; background: #ea580c; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
      medium: 'color: white; background: #f59e0b; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
      low: 'color: white; background: #3b82f6; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
    };
    return styles[severity] || styles.medium;
  }

  private saveLogsToStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const logsToSave = this.logs.slice(-100); // Save last 100 logs
        localStorage.setItem('errorLogger_logs', JSON.stringify(logsToSave));
      }
    } catch (error) {
      console.warn('Failed to save error logs to localStorage:', error);
    }
  }

  private loadLogsFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('errorLogger_logs');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            this.logs = parsed;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load error logs from localStorage:', error);
    }
  }

  // Public API
  getLogs(options?: {
    type?: ErrorLogEntry['type'];
    severity?: ErrorLogEntry['severity'];
    limit?: number;
    since?: Date;
  }): ErrorLogEntry[] {
    let filtered = [...this.logs];

    if (options?.type) {
      filtered = filtered.filter(log => log.type === options.type);
    }

    if (options?.severity) {
      filtered = filtered.filter(log => log.severity === options.severity);
    }

    if (options?.since) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= options.since!);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return options?.limit ? filtered.slice(0, options.limit) : filtered;
  }

  getRecentErrors(limit: number = 10): ErrorLogEntry[] {
    return this.getLogs({ limit });
  }

  getErrorById(id: string): ErrorLogEntry | undefined {
    return this.logs.find(log => log.id === id);
  }

  clearLogs(): void {
    this.logs = [];
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('errorLogger_logs');
      }
    } catch (error) {
      console.warn('Failed to clear error logs from localStorage:', error);
    }
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  downloadLogs(): void {
    const data = this.exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  addListener(callback: (entry: ErrorLogEntry) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  getStats(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    recent: ErrorLogEntry[];
  } {
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    this.logs.forEach(log => {
      byType[log.type] = (byType[log.type] || 0) + 1;
      bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;
    });

    return {
      total: this.logs.length,
      byType,
      bySeverity,
      recent: this.getRecentErrors(10),
    };
  }
}

// Create singleton instance - initialize immediately on client-side
let errorLoggerInstance: ComprehensiveErrorLogger | null = null;

export const errorLogger = typeof window !== 'undefined' 
  ? (() => {
      if (!errorLoggerInstance) {
        try {
          errorLoggerInstance = new ComprehensiveErrorLogger();
          console.log('[ErrorLogger] Singleton instance created');
        } catch (error) {
          console.error('[ErrorLogger] Failed to create instance:', error);
          // Create a minimal fallback
          errorLoggerInstance = {
            logError: () => {},
            logReactError: () => {},
            logNextJSError: () => {},
            getLogs: () => [],
            getRecentErrors: () => [],
            getErrorById: () => undefined,
            clearLogs: () => {},
            exportLogs: () => '[]',
            downloadLogs: () => {},
            addListener: () => () => {},
            getStats: () => ({ total: 0, byType: {}, bySeverity: {}, recent: [] }),
          } as any;
        }
      }
      return errorLoggerInstance;
    })()
  : ({
      logError: () => {},
      logReactError: () => {},
      logNextJSError: () => {},
      getLogs: () => [],
      getRecentErrors: () => [],
      getErrorById: () => undefined,
      clearLogs: () => {},
      exportLogs: () => '[]',
      downloadLogs: () => {},
      addListener: () => () => {},
      getStats: () => ({ total: 0, byType: {}, bySeverity: {}, recent: [] }),
    } as ComprehensiveErrorLogger);

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).errorLogger = errorLogger;
  
  // Add helper commands
  (window as any).showErrors = () => {
    const stats = errorLogger.getStats();
    console.log('=== Error Logger Stats ===');
    console.log('Total errors:', stats.total);
    console.log('By type:', stats.byType);
    console.log('By severity:', stats.bySeverity);
    console.log('Recent errors:', stats.recent);
    console.log('========================');
    return stats;
  };

  (window as any).clearErrors = () => {
    errorLogger.clearLogs();
    console.log('Error logs cleared');
  };

  (window as any).exportErrors = () => {
    errorLogger.downloadLogs();
    console.log('Error logs exported');
  };

  (window as any).getErrors = (options?: any) => {
    return errorLogger.getLogs(options);
  };
}

