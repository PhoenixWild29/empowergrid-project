// Client-safe logger that falls back to console when winston is not available
// Winston should NEVER be imported on the client side - webpack will try to bundle it
// We use eval('require') in createWinstonLogger to prevent webpack from statically analyzing it

// Define log levels
export const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;

// Create a console-based logger for client-side
const createConsoleLogger = () => {
  const formatMessage = (level: string, message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]:`;
    
    if (meta && Object.keys(meta).length > 0) {
      return [`${prefix} ${message}`, meta];
    }
    return [`${prefix} ${message}`];
  };

  return {
    error: (message: string, meta?: any) => {
      const [msg, ...rest] = formatMessage('error', message, meta);
      console.error(msg, ...rest);
    },
    warn: (message: string, meta?: any) => {
      const [msg, ...rest] = formatMessage('warn', message, meta);
      console.warn(msg, ...rest);
    },
    info: (message: string, meta?: any) => {
      const [msg, ...rest] = formatMessage('info', message, meta);
      console.info(msg, ...rest);
    },
    http: (message: string, meta?: any) => {
      const [msg, ...rest] = formatMessage('http', message, meta);
      console.log(msg, ...rest);
    },
    debug: (message: string, meta?: any) => {
      const [msg, ...rest] = formatMessage('debug', message, meta);
      console.debug(msg, ...rest);
    },
    log: (level: LogLevel, message: string, meta?: any) => {
      const method = level === 'error' ? 'error' : level === 'warn' ? 'warn' : level === 'info' ? 'info' : 'log';
      const [msg, ...rest] = formatMessage(level, message, meta);
      console[method](msg, ...rest);
    },
  };
};

/**
 * Attempt to load the Winston logger on the server. Falls back to the console
 * logger if the module is unavailable (e.g. during client-side execution or
 * when the dependency is not installed).
 */
let loggerInstance = createConsoleLogger();

if (typeof window === 'undefined') {
  try {
    const { createWinstonLogger } = require('./winstonLogger');
    loggerInstance = createWinstonLogger();
  } catch (error) {
    console.warn(
      '[logger] Failed to load Winston logger, falling back to console logger:',
      error
    );
  }
}

export const logger = loggerInstance;

// Add request logging method
export const logRequest = (
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  userId?: string
) => {
  const level: LogLevel =
    statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'http';

  logger.log(level, 'HTTP Request', {
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
    userId,
  });
};

// Add database operation logging
export const logDatabaseOperation = (
  operation: string,
  table: string,
  duration: number,
  success: boolean,
  error?: Error
) => {
  const level: LogLevel = success ? 'debug' : 'error';

  logger.log(level, 'Database Operation', {
    operation,
    table,
    duration: `${duration}ms`,
    success,
    error: error?.message,
  });
};

// Add user action logging
export const logUserAction = (
  userId: string,
  action: string,
  details?: Record<string, any>
) => {
  logger.info('User Action', {
    userId,
    action,
    ...details,
  });
};

// Add performance monitoring
export const logPerformance = (
  operation: string,
  duration: number,
  metadata?: Record<string, any>
) => {
  const level: LogLevel = duration > 1000 ? 'warn' : 'debug';

  logger.log(level, 'Performance', {
    operation,
    duration: `${duration}ms`,
    ...metadata,
  });
};

// Add security event logging
export const logSecurityEvent = (
  event: string,
  userId?: string,
  ip?: string,
  details?: Record<string, any>
) => {
  logger.warn('Security Event', {
    event,
    userId,
    ip,
    ...details,
  });
};

// Add business metrics logging
export const logBusinessMetric = (
  metric: string,
  value: number,
  dimensions?: Record<string, any>
) => {
  logger.info('Business Metric', {
    metric,
    value,
    dimensions,
  });
};

// Add audit logging for compliance
export const logAuditEvent = (
  userId: string,
  action: string,
  resource: string,
  details?: Record<string, any>
) => {
  logger.info('Audit Event', {
    userId,
    action,
    resource,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

// Add API metrics logging
export const logApiMetrics = (
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  requestSize?: number,
  responseSize?: number,
  userAgent?: string
) => {
  const level: LogLevel = statusCode >= 400 ? 'warn' : 'info';

  logger.log(level, 'API Metrics', {
    endpoint,
    method,
    statusCode,
    responseTime: `${responseTime}ms`,
    requestSize: requestSize ? `${requestSize}bytes` : undefined,
    responseSize: responseSize ? `${responseSize}bytes` : undefined,
    userAgent,
  });
};

// Add error context logging
export const logErrorWithContext = (
  error: Error,
  context: Record<string, any>,
  userId?: string,
  sessionId?: string
) => {
  logger.error('Error with Context', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
    userId,
    sessionId,
  });
};

// Add cache operation logging
export const logCacheOperation = (
  operation: 'hit' | 'miss' | 'set' | 'delete' | 'clear',
  key: string,
  duration?: number,
  hitRate?: number
) => {
  logger.debug('Cache Operation', {
    operation,
    key,
    duration: duration ? `${duration}ms` : undefined,
    hitRate: hitRate ? `${hitRate.toFixed(2)}%` : undefined,
  });
};

// Add monitoring heartbeat
export const logHeartbeat = (
  service: string,
  status: 'healthy' | 'degraded' | 'unhealthy',
  metrics?: Record<string, any>
) => {
  const level: LogLevel = status === 'healthy' ? 'debug' : status === 'degraded' ? 'warn' : 'error';

  logger.log(level, 'Service Heartbeat', {
    service,
    status,
    timestamp: new Date().toISOString(),
    ...metrics,
  });
};

// Add log aggregation helper
export class LogAggregator {
  private logs: any[] = [];
  private maxLogs = 10000;

  addLog(level: LogLevel, message: string, meta?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    };

    this.logs.push(logEntry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  getLogs(options: {
    level?: LogLevel;
    limit?: number;
    since?: Date;
  } = {}): any[] {
    let filtered = this.logs;

    if (options.level) {
      filtered = filtered.filter(log => log.level === options.level);
    }

    if (options.since) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= options.since!);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return options.limit ? filtered.slice(0, options.limit) : filtered;
  }

  getLogStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    timeRange: { oldest: string; newest: string };
  } {
    const stats = {
      total: this.logs.length,
      byLevel: {} as Record<LogLevel, number>,
      timeRange: {
        oldest: this.logs.length > 0 ? this.logs[0].timestamp : null,
        newest: this.logs.length > 0 ? this.logs[this.logs.length - 1].timestamp : null,
      },
    };

    // Initialize level counters
    Object.keys(LOG_LEVELS).forEach(level => {
      stats.byLevel[level as LogLevel] = 0;
    });

    // Count logs by level
    for (const log of this.logs) {
      stats.byLevel[log.level as LogLevel]++;
    }

    return stats;
  }

  clearLogs(): void {
    this.logs = [];
  }
}

// Global log aggregator instance
export const logAggregator = new LogAggregator();

// Enhanced logger with aggregation
class EnhancedLogger {
  private aggregator = logAggregator;

  error(message: string, meta?: any): void {
    logger.error(message, meta);
    this.aggregator.addLog('error', message, meta);
  }

  warn(message: string, meta?: any): void {
    logger.warn(message, meta);
    this.aggregator.addLog('warn', message, meta);
  }

  info(message: string, meta?: any): void {
    logger.info(message, meta);
    this.aggregator.addLog('info', message, meta);
  }

  http(message: string, meta?: any): void {
    logger.http(message, meta);
    this.aggregator.addLog('http', message, meta);
  }

  debug(message: string, meta?: any): void {
    logger.debug(message, meta);
    this.aggregator.addLog('debug', message, meta);
  }

  // Get aggregated logs
  getAggregatedLogs(options?: Parameters<LogAggregator['getLogs']>[0]) {
    return this.aggregator.getLogs(options);
  }

  // Get log statistics
  getLogStats() {
    return this.aggregator.getLogStats();
  }
}

// Export enhanced logger
export const enhancedLogger = new EnhancedLogger();

// Export logger instance as default
export default logger;
