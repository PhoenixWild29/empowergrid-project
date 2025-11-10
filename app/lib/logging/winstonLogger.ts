/**
 * Winston Logger - Server-side only
 * 
 * This file should NEVER be imported on the client side.
 * It's only used server-side via dynamic import.
 */

// This file is server-only - webpack should not bundle it for client
if (typeof window !== 'undefined') {
  throw new Error('winstonLogger.ts should never be imported on the client side');
}

const winston = require('winston');
const path = require('path');

import { LOG_LEVELS, LogLevel } from './logger';

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
export const createWinstonLogger = () => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels: LOG_LEVELS,
    format:
      process.env.NODE_ENV === 'production'
        ? productionFormat
        : developmentFormat,
    transports:
      process.env.NODE_ENV === 'production'
        ? productionTransports
        : developmentTransports,
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
};

