import { z } from 'zod';

/**
 * Solana wallet address validation regex
 * Solana addresses are base58 encoded and typically 32-44 characters
 */
const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/**
 * Nonce validation regex
 * Nonces contain UUID:nanoid:timestamp:optional-wallet format
 */
const NONCE_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:.+:\d+/;

/**
 * Schema for challenge request
 * Optional wallet address for personalized challenges
 */
export const ChallengeRequestSchema = z.object({
  walletAddress: z
    .string()
    .regex(SOLANA_ADDRESS_REGEX, 'Invalid Solana wallet address')
    .optional()
    .describe('Optional wallet address for personalized challenge'),
});

export type ChallengeRequest = z.infer<typeof ChallengeRequestSchema>;

/**
 * Schema for challenge response
 * Contains nonce, message, and expiry information
 */
export const ChallengeResponseSchema = z.object({
  success: z.boolean().describe('Whether challenge generation was successful'),
  
  nonce: z
    .string()
    .min(32, 'Nonce must be at least 32 characters')
    .describe('Unique cryptographic nonce for signature verification'),
  
  message: z
    .string()
    .min(10, 'Challenge message must be at least 10 characters')
    .describe('User-friendly message to be signed by wallet'),
  
  expiresAt: z
    .string()
    .datetime()
    .describe('ISO 8601 timestamp when the challenge expires'),
  
  expiresIn: z
    .number()
    .int()
    .positive()
    .describe('Time until expiry in seconds'),
  
  timestamp: z
    .string()
    .datetime()
    .describe('ISO 8601 timestamp when challenge was generated'),
});

export type ChallengeResponse = z.infer<typeof ChallengeResponseSchema>;

/**
 * Schema for login/verify request
 * Contains wallet address, signed message, and signature
 */
export const VerifySignatureRequestSchema = z.object({
  walletAddress: z
    .string()
    .regex(SOLANA_ADDRESS_REGEX, 'Invalid Solana wallet address')
    .describe('Wallet address that signed the message'),
  
  nonce: z
    .string()
    .regex(NONCE_REGEX, 'Invalid nonce format')
    .describe('The nonce that was signed'),
  
  signature: z
    .string()
    .min(64, 'Invalid signature length')
    .describe('Base58 encoded signature from wallet'),
  
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .describe('The original challenge message that was signed'),
});

export type VerifySignatureRequest = z.infer<typeof VerifySignatureRequestSchema>;

/**
 * Schema for login response
 * Contains user profile, JWT token, and session info
 */
export const LoginResponseSchema = z.object({
  success: z.boolean().describe('Whether login was successful'),
  
  user: z.object({
    id: z.string().uuid().describe('User ID'),
    walletAddress: z.string().describe('User wallet address'),
    username: z.string().optional().describe('Username'),
    email: z.string().email().optional().describe('Email address'),
    role: z.enum(['guest', 'funder', 'creator', 'admin']).describe('User role'),
    verified: z.boolean().describe('KYC/AML verification status'),
    createdAt: z.string().datetime().describe('Account creation timestamp'),
  }).describe('User profile information'),
  
  token: z
    .string()
    .min(10, 'Invalid token length')
    .describe('JWT authentication token'),
  
  expiresAt: z
    .string()
    .datetime()
    .describe('ISO 8601 timestamp when token expires'),
  
  expiresIn: z
    .number()
    .int()
    .positive()
    .describe('Time until token expiry in seconds'),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

/**
 * Schema for error response
 */
export const ErrorResponseSchema = z.object({
  success: z.literal(false).describe('Always false for error responses'),
  
  error: z.string().describe('Error type/code'),
  
  message: z.string().describe('Human-readable error message'),
  
  details: z.any().optional().describe('Additional error details'),
  
  statusCode: z
    .number()
    .int()
    .min(400)
    .max(599)
    .describe('HTTP status code'),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * Schema for refresh token request
 */
export const RefreshTokenRequestSchema = z.object({
  token: z
    .string()
    .min(10, 'Invalid token length')
    .describe('Existing JWT token to refresh'),
});

export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;

/**
 * Schema for session validation
 */
export const SessionValidationSchema = z.object({
  token: z
    .string()
    .min(10, 'Invalid token length')
    .describe('JWT token to validate'),
  
  walletAddress: z
    .string()
    .regex(SOLANA_ADDRESS_REGEX, 'Invalid Solana wallet address')
    .optional()
    .describe('Optional wallet address to verify token ownership'),
});

export type SessionValidation = z.infer<typeof SessionValidationSchema>;

/**
 * Helper function to validate Solana wallet address
 */
export function isValidSolanaAddress(address: string): boolean {
  return SOLANA_ADDRESS_REGEX.test(address);
}

/**
 * Helper function to validate nonce format
 */
export function isValidNonceFormat(nonce: string): boolean {
  return NONCE_REGEX.test(nonce);
}

/**
 * Parse and validate request body against schema
 * Returns typed data or throws validation error
 */
export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      
      throw new ValidationError(
        'Request validation failed',
        formattedErrors
      );
    }
    throw error;
  }
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Safe parse that returns result object instead of throwing
 */
export function safeValidateRequestBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
}

/**
 * Format Zod errors into user-friendly messages
 */
export function formatZodErrors(error: z.ZodError): string[] {
  return error.errors.map(err => {
    const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
    return `${path}${err.message}`;
  });
}

/**
 * Middleware helper to validate request body
 * Usage in API routes:
 * ```typescript
 * const validatedData = validateOrThrow(ChallengeRequestSchema, req.body);
 * ```
 */
export function validateOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  return validateRequestBody(schema, data);
}

/**
 * Schema for login/signature verification request
 */
export const LoginRequestSchema = z.object({
  walletAddress: z
    .string()
    .regex(SOLANA_ADDRESS_REGEX, 'Invalid Solana wallet address')
    .describe('Wallet address that signed the message'),

  signature: z
    .string()
    .min(64, 'Invalid signature length')
    .describe('Base58 encoded signature from wallet'),

  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .describe('The original challenge message that was signed'),

  nonce: z
    .string()
    .regex(NONCE_REGEX, 'Invalid nonce format')
    .describe('The nonce from the challenge'),

  provider: z
    .enum(['phantom', 'solflare', 'ledger', 'sollet', 'glow', 'backpack', 'unknown'])
    .optional()
    .describe('Wallet provider type'),
});

export type LoginRequestType = z.infer<typeof LoginRequestSchema>;

/**
 * Schema for successful login response with JWT
 */
export const LoginSuccessResponseSchema = z.object({
  success: z.literal(true).describe('Always true for successful login'),

  user: z.object({
    id: z.string().describe('User ID'),
    walletAddress: z.string().describe('User wallet address'),
    username: z.string().describe('Username'),
    email: z.string().email().optional().describe('Email address'),
    role: z.enum(['GUEST', 'FUNDER', 'CREATOR', 'ADMIN']).describe('User role'),
    verified: z.boolean().describe('KYC/AML verification status'),
    reputation: z.number().describe('User reputation score'),
    stats: z.object({
      projectsCreated: z.number(),
      projectsFunded: z.number(),
      totalFunded: z.number(),
      successfulProjects: z.number(),
    }).describe('User statistics'),
    createdAt: z.string().datetime().describe('Account creation timestamp'),
  }).describe('User profile information'),

  accessToken: z
    .string()
    .min(10, 'Invalid token length')
    .describe('JWT access token'),

  refreshToken: z
    .string()
    .min(10, 'Invalid refresh token length')
    .optional()
    .describe('JWT refresh token'),

  expiresIn: z
    .number()
    .int()
    .positive()
    .describe('Time until token expiry in seconds'),

  expiresAt: z
    .string()
    .datetime()
    .describe('ISO 8601 timestamp when token expires'),

  sessionId: z
    .string()
    .describe('Session identifier'),

  tokenType: z
    .literal('Bearer')
    .default('Bearer')
    .describe('Token type'),
});

export type LoginSuccessResponse = z.infer<typeof LoginSuccessResponseSchema>;

/**
 * Schema for token validation request
 */
export const ValidateTokenRequestSchema = z.object({
  token: z
    .string()
    .min(10, 'Invalid token length')
    .describe('JWT token to validate'),
});

export type ValidateTokenRequest = z.infer<typeof ValidateTokenRequestSchema>;

/**
 * Schema for token validation response
 */
export const ValidateTokenResponseSchema = z.object({
  valid: z.boolean().describe('Whether token is valid'),
  userId: z.string().optional().describe('User ID if token is valid'),
  expiresAt: z.string().datetime().optional().describe('Token expiration time'),
  error: z.string().optional().describe('Error message if invalid'),
});

export type ValidateTokenResponse = z.infer<typeof ValidateTokenResponseSchema>;

/**
 * Schema for logout request
 */
export const LogoutRequestSchema = z.object({
  token: z
    .string()
    .optional()
    .describe('Optional JWT token to logout (can also use Authorization header)'),
  
  allDevices: z
    .boolean()
    .optional()
    .default(false)
    .describe('If true, logout from all devices'),
});

export type LogoutRequestType = z.infer<typeof LogoutRequestSchema>;

/**
 * Schema for logout response
 */
export const LogoutResponseSchema = z.object({
  success: z.boolean().describe('Whether logout was successful'),
  message: z.string().describe('Logout confirmation message'),
  sessionsTerminated: z.number().optional().describe('Number of sessions terminated'),
});

export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;

/**
 * Schema for session validation response
 */
export const SessionResponseSchema = z.object({
  success: z.literal(true).describe('Always true for valid sessions'),
  
  user: z.object({
    id: z.string().describe('User ID'),
    walletAddress: z.string().describe('User wallet address'),
    username: z.string().describe('Username'),
    email: z.string().email().optional().describe('Email address'),
    role: z.enum(['GUEST', 'FUNDER', 'CREATOR', 'ADMIN']).describe('User role'),
    verified: z.boolean().describe('KYC/AML verification status'),
    reputation: z.number().describe('User reputation score'),
    createdAt: z.string().datetime().describe('Account creation timestamp'),
  }).describe('User profile information'),
  
  session: z.object({
    id: z.string().describe('Session ID'),
    createdAt: z.string().datetime().describe('Session creation time'),
    expiresAt: z.string().datetime().describe('Session expiration time'),
    ipAddress: z.string().optional().describe('Session IP address'),
    userAgent: z.string().optional().describe('Session user agent'),
    isActive: z.boolean().describe('Whether session is currently active'),
  }).describe('Session metadata'),
  
  token: z.object({
    expiresIn: z.number().describe('Seconds until token expires'),
    expiresAt: z.string().datetime().describe('Token expiration timestamp'),
    issuedAt: z.string().datetime().describe('Token issue timestamp'),
  }).describe('Token information'),
});

export type SessionResponse = z.infer<typeof SessionResponseSchema>;
