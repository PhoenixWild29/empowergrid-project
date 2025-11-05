import { z } from 'zod';

// Environment variables validation schema - lenient for development
const envSchema = z.object({
  // Database - optional in development, required in production
  DATABASE_URL: z.string().url().refine(
    (url) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
    'Database URL must be a PostgreSQL connection string'
  ).optional(),

  // NextAuth - optional in development
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters').optional(),
  NEXTAUTH_URL: z.string().url().optional(),

  // Solana - optional in development, will use defaults
  SOLANA_RPC_URL: z.string().url().refine(
    (url) => url.includes('solana') || url.includes('mainnet') || url.includes('devnet'),
    'SOLANA_RPC_URL must be a valid Solana RPC endpoint'
  ).optional(),

  // Security
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ALLOWED_ORIGINS: z.string().optional().default('http://localhost:3000'),

  // API Keys (optional for external services)
  SNYK_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().optional(),

  // File upload
  MAX_FILE_SIZE: z.string().optional().default('5242880'), // 5MB default
  ALLOWED_FILE_TYPES: z.string().optional().default('image/jpeg,image/png,image/webp'),

  // Rate limiting
  RATE_LIMIT_AUTH_MAX: z.string().optional().default('5'),
  RATE_LIMIT_API_MAX: z.string().optional().default('100'),
  RATE_LIMIT_FUNDING_MAX: z.string().optional().default('20'),

  // Monitoring
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).optional().default('info'),
  ENABLE_SECURITY_LOGGING: z.string().optional().default('true'),
});

// Validate environment variables with graceful fallbacks
let validatedEnv: z.infer<typeof envSchema>;
const isDevelopment = process.env.NODE_ENV !== 'production';

try {
  validatedEnv = envSchema.parse(process.env);
} catch (error) {
  // In development, log warning but continue with defaults
  if (isDevelopment) {
    console.warn('⚠️  Some environment variables are missing or invalid:', error);
    console.warn('⚠️  Using default values. This is OK for development.');
    // Parse with defaults
    validatedEnv = envSchema.parse({
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || 'development',
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/empowergrid',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'dev-secret-key-min-32-characters-long-for-development-only',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      SOLANA_RPC_URL: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    });
  } else {
    // In production, fail fast
    console.error('❌ Invalid environment variables:', error);
    throw new Error('Invalid environment configuration');
  }
}

// Security configuration
export const securityConfig = {
  // Environment
  env: validatedEnv.NODE_ENV,
  isProduction: validatedEnv.NODE_ENV === 'production',
  isDevelopment: validatedEnv.NODE_ENV === 'development',

  // CORS
  allowedOrigins: validatedEnv.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()),

  // File upload security
  fileUpload: {
    maxSize: parseInt(validatedEnv.MAX_FILE_SIZE),
    allowedTypes: validatedEnv.ALLOWED_FILE_TYPES.split(',').map(type => type.trim()),
  },

  // Rate limiting
  rateLimiting: {
    auth: {
      max: parseInt(validatedEnv.RATE_LIMIT_AUTH_MAX),
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
    api: {
      max: parseInt(validatedEnv.RATE_LIMIT_API_MAX),
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
    funding: {
      max: parseInt(validatedEnv.RATE_LIMIT_FUNDING_MAX),
      windowMs: 60 * 60 * 1000, // 1 hour
    },
  },

  // Authentication
  auth: {
    nextAuthSecret: validatedEnv.NEXTAUTH_SECRET || 'dev-secret-key-min-32-characters-long-for-development-only',
    nextAuthUrl: validatedEnv.NEXTAUTH_URL || 'http://localhost:3000',
  },

  // Database
  database: {
    url: validatedEnv.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/empowergrid',
  },

  // Solana
  solana: {
    rpcUrl: validatedEnv.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  },

  // External services
  external: {
    snykToken: validatedEnv.SNYK_TOKEN,
    sentryDsn: validatedEnv.SENTRY_DSN,
  },

  // Logging
  logging: {
    level: validatedEnv.LOG_LEVEL,
    enableSecurityLogging: validatedEnv.ENABLE_SECURITY_LOGGING === 'true',
  },
} as const;

// Security headers based on environment
export const getSecurityHeaders = () => ({
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https: blob:;
    connect-src 'self' ${securityConfig.solana.rpcUrl?.replace('https://', 'wss://').replace('http://', 'ws://') || 'wss://api.mainnet-beta.solana.com'};
    frame-src 'none';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s+/g, ' ').trim(),
  'Strict-Transport-Security': securityConfig.isProduction
    ? 'max-age=31536000; includeSubDomains; preload'
    : 'max-age=0',
});

// Input validation schemas
export const validationSchemas = {
  walletAddress: z.string()
    .min(32, 'Wallet address too short')
    .max(44, 'Wallet address too long')
    .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Invalid Solana wallet address'),

  email: z.string()
    .email('Invalid email format')
    .max(254, 'Email too long'),

  projectTitle: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title must be less than 255 characters')
    .trim(),

  projectDescription: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be less than 5000 characters')
    .trim(),

  amount: z.number()
    .positive('Amount must be positive')
    .max(1000000, 'Amount cannot exceed 1,000,000 SOL'),

  url: z.string()
    .url('Invalid URL format')
    .max(2048, 'URL too long'),
};

// Security utility functions
export const securityUtils = {
  // Sanitize input
  sanitizeInput: (input: string): string => {
    if (typeof input !== 'string') return '';

    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\0/g, '')
      .substring(0, 10000);
  },

  // Check for SQL injection patterns
  isSqlInjectionAttempt: (input: string): boolean => {
    const patterns = [
      /(\b(union|select|insert|delete|update|drop|create|alter|exec|execute)\b)/i,
      /(-{2}|\/\*|\*\/)/,
      /('|(\\x27)|(\\x2D\\x2D)|(\\x2F\\x2A)|(\\x2A\\x2F))/i,
    ];
    return patterns.some(pattern => pattern.test(input));
  },

  // Check for XSS payloads
  containsXssPayload: (input: string): boolean => {
    const patterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload=/gi,
      /onerror=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
    ];
    return patterns.some(pattern => pattern.test(input));
  },

  // Validate file upload
  validateFileUpload: (file: { size: number; type: string; name: string }) => {
    const { maxSize, allowedTypes } = securityConfig.fileUpload;

    if (file.size > maxSize) {
      return { valid: false, error: `File size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB` };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not allowed' };
    }

    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    const allowedExtensions = allowedTypes.map(type => '.' + type.split('/')[1]);
    if (!allowedExtensions.includes(extension)) {
      return { valid: false, error: 'File extension not allowed' };
    }

    return { valid: true };
  },

  // Generate secure filename
  generateSecureFilename: (originalName: string): string => {
    const extension = originalName.toLowerCase().substring(originalName.lastIndexOf('.'));
    const randomId = Math.random().toString(36).substring(2, 15) +
                     Math.random().toString(36).substring(2, 15);
    return `${randomId}${extension}`;
  },
};

// Export validated environment for use in the app
export { validatedEnv as env };