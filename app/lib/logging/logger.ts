import winston from 'winston';
import path from 'path';

// Define log levels
export const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;

// Custom log format for development
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf((info: any) => {
    const { timestamp, level, message, stack, ...meta } = info;
    let log = `${timestamp} [${level}]: ${message}`;

    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }

    if (stack) {
      log += `\n${stack}`;
    }

    return log;
  })
);

// Custom log format for production
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Development transports
const developmentTransports = [
  new winston.transports.Console({
    level: 'debug',
    format: developmentFormat,
  }),
  new winston.transports.File({
    filename: path.join(logsDir, 'app.log'),
    level: 'info',
    format: developmentFormat,
  }),
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: developmentFormat,
  }),
];

// Production transports
const productionTransports = [
  new winston.transports.Console({
    level: 'info',
    format: productionFormat,
  }),
  new winston.transports.File({
    filename: path.join(logsDir, 'app.log'),
    level: 'info',
    format: productionFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: productionFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: LOG_LEVELS,
  format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  transports: process.env.NODE_ENV === 'production' ? productionTransports : developmentTransports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      format: productionFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      format: productionFormat,
    }),
  ],
});

// Add request logging method
export const logRequest = (
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  userId?: string
) => {
  const level: LogLevel = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'http';

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

// Export logger instance as default
export default logger;