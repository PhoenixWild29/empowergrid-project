import jwt, { SignOptions, VerifyOptions, JwtPayload, Secret } from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/auth';
import { UserRole } from '../../types/auth';

/**
 * JWT Payload Interface
 * Contains user information embedded in the token
 */
export interface JWTPayload extends JwtPayload {
  userId: string;
  walletAddress: string;
  role: UserRole;
  username?: string;
  sessionId?: string;
  iat?: number; // Issued at
  exp?: number; // Expiration time
  iss?: string; // Issuer
  aud?: string; // Audience
}

/**
 * JWT Generation Result
 */
export interface JWTGenerationResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number; // seconds
  expiresAt: Date;
  tokenType: 'Bearer';
}

/**
 * JWT Verification Result
 */
export interface JWTVerificationResult {
  isValid: boolean;
  payload?: JWTPayload;
  error?: string;
  expired?: boolean;
}

/**
 * Generate a JWT access token for authenticated user
 * 
 * @param userId - User's unique identifier
 * @param walletAddress - User's wallet address
 * @param role - User's role in the system
 * @param options - Additional options (username, sessionId, custom expiry)
 * @returns JWT token and metadata
 */
export function generateAccessToken(
  userId: string,
  walletAddress: string,
  role: UserRole,
  options?: {
    username?: string;
    sessionId?: string;
    expiresIn?: string;
  }
): JWTGenerationResult {
  const payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'> = {
    userId,
    walletAddress,
    role,
    username: options?.username,
    sessionId: options?.sessionId,
  };

  const accessToken = jwt.sign(payload, JWT_CONFIG.SECRET, {
    expiresIn: (options?.expiresIn || JWT_CONFIG.ACCESS_TOKEN_EXPIRY) as any,
    issuer: JWT_CONFIG.ISSUER,
    audience: JWT_CONFIG.AUDIENCE,
    algorithm: JWT_CONFIG.ALGORITHM,
  });

  // Calculate expiration time
  const expiresIn = parseExpiryToSeconds(options?.expiresIn || JWT_CONFIG.ACCESS_TOKEN_EXPIRY);
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  return {
    accessToken,
    expiresIn,
    expiresAt,
    tokenType: 'Bearer',
  };
}

/**
 * Generate a JWT refresh token for token renewal
 * 
 * @param userId - User's unique identifier
 * @param walletAddress - User's wallet address
 * @param sessionId - Session identifier
 * @returns Refresh token and metadata
 */
export function generateRefreshToken(
  userId: string,
  walletAddress: string,
  sessionId: string,
  role: UserRole,
  username?: string
): JWTGenerationResult {
  const payload: JWTPayload & { type: 'refresh' } = {
    userId,
    walletAddress,
    role,
    username,
    sessionId,
    type: 'refresh',
  };

  const refreshToken = jwt.sign(payload, JWT_CONFIG.SECRET, {
    expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY as any,
    issuer: JWT_CONFIG.ISSUER,
    audience: JWT_CONFIG.AUDIENCE,
    algorithm: JWT_CONFIG.ALGORITHM,
  });

  const expiresIn = parseExpiryToSeconds(JWT_CONFIG.REFRESH_TOKEN_EXPIRY);
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  return {
    accessToken: refreshToken,
    expiresIn,
    expiresAt,
    tokenType: 'Bearer',
  };
}

/**
 * Generate both access and refresh tokens
 * 
 * @param userId - User's unique identifier
 * @param walletAddress - User's wallet address
 * @param role - User's role
 * @param sessionId - Session identifier
 * @param username - Optional username
 * @returns Both access and refresh tokens
 */
export function generateTokenPair(
  userId: string,
  walletAddress: string,
  role: UserRole,
  sessionId: string,
  username?: string
): {
  accessToken: JWTGenerationResult;
  refreshToken: JWTGenerationResult;
} {
  const accessToken = generateAccessToken(userId, walletAddress, role, {
    username,
    sessionId,
  });

  const refreshToken = generateRefreshToken(
    userId,
    walletAddress,
    sessionId,
    role,
    username
  );

  return {
    accessToken,
    refreshToken,
  };
}

/**
 * Verify and decode a JWT token
 * 
 * @param token - JWT token to verify
 * @param options - Verification options
 * @returns Verification result with payload or error
 */
export function verifyToken(
  token: string,
  options?: VerifyOptions
): JWTVerificationResult {
  try {
    const verifyOptions: VerifyOptions = {
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
      algorithms: [JWT_CONFIG.ALGORITHM],
      ...options,
    };

    const decoded = jwt.verify(token, JWT_CONFIG.SECRET, verifyOptions) as JWTPayload;

    // Validate required fields
    if (!decoded.userId || !decoded.walletAddress) {
      return {
        isValid: false,
        error: 'Token missing required fields',
      };
    }

    return {
      isValid: true,
      payload: decoded as JWTPayload,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        isValid: false,
        error: 'Token has expired',
        expired: true,
      };
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return {
        isValid: false,
        error: error.message,
      };
    }

    return {
      isValid: false,
      error: 'Token verification failed',
    };
  }
}

/**
 * Decode a JWT token without verification (use with caution)
 * Useful for inspecting token contents
 * 
 * @param token - JWT token to decode
 * @returns Decoded payload or null
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Check if a token is expired without full verification
 * 
 * @param token - JWT token to check
 * @returns boolean indicating if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now;
}

/**
 * Get token expiration time
 * 
 * @param token - JWT token
 * @returns Date object of expiration or null
 */
export function getTokenExpiration(token: string): Date | null {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return null;
  }

  return new Date(decoded.exp * 1000);
}

/**
 * Get time remaining until token expiration
 * 
 * @param token - JWT token
 * @returns Seconds remaining or null if expired/invalid
 */
export function getTokenTimeRemaining(token: string): number | null {
  const expirationDate = getTokenExpiration(token);
  if (!expirationDate) {
    return null;
  }

  const now = new Date();
  const remaining = Math.floor((expirationDate.getTime() - now.getTime()) / 1000);

  return remaining > 0 ? remaining : 0;
}

/**
 * Extract token from Authorization header
 * Supports "Bearer <token>" format
 * 
 * @param authHeader - Authorization header value
 * @returns Token string or null
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Validate token format (basic check before verification)
 * 
 * @param token - Token string to validate
 * @returns boolean indicating if format is valid
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  // JWT format: header.payload.signature
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  // Basic length check
  return parts.every(part => part.length > 0);
}

/**
 * Parse expiry string to seconds
 * Supports formats like "24h", "7d", "60s", "30m"
 * 
 * @param expiry - Expiry string
 * @returns Number of seconds
 */
function parseExpiryToSeconds(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  
  if (!match) {
    // Default to 24 hours if format is invalid
    return 24 * 60 * 60;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 24 * 60 * 60;
    default: return 24 * 60 * 60;
  }
}

/**
 * Refresh an access token using a refresh token
 * 
 * @param refreshToken - Valid refresh token
 * @param newRole - Optional updated role
 * @returns New access token or error
 */
export function refreshAccessToken(
  refreshToken: string,
  newRole?: UserRole
): JWTVerificationResult & { newAccessToken?: JWTGenerationResult } {
  const verification = verifyToken(refreshToken);

  if (!verification.isValid || !verification.payload) {
    return verification;
  }

  // Verify it's a refresh token
  const payload = verification.payload as any;
  if (payload.type !== 'refresh') {
    return {
      isValid: false,
      error: 'Invalid token type',
    };
  }

  // Generate new access token
  const newAccessToken = generateAccessToken(
    payload.userId,
    payload.walletAddress,
    newRole ?? normalizeTokenRole(payload.role),
    {
      sessionId: payload.sessionId,
    }
  );

  return {
    isValid: true,
    payload: verification.payload,
    newAccessToken,
  };
}

/**
 * Create a short-lived temporary token (for one-time operations)
 * 
 * @param data - Data to encode
 * @param expiryMinutes - Expiry in minutes (default 5)
 * @returns Temporary token
 */
export function generateTemporaryToken(
  data: Record<string, any>,
  expiryMinutes: number = 5
): string {
  const payload = {
    ...data,
    type: 'temporary',
  };

  return jwt.sign(payload, JWT_CONFIG.SECRET, {
    expiresIn: `${expiryMinutes}m`,
    issuer: JWT_CONFIG.ISSUER,
  });
}

/**
 * Check if token needs refresh (expires within threshold)
 * 
 * @param token - JWT token to check
 * @param thresholdMinutes - Minutes before expiry to trigger refresh (default: 5)
 * @returns boolean indicating if refresh is needed
 */
export function shouldRefreshToken(
  token: string,
  thresholdMinutes: number = 5
): boolean {
  const timeRemaining = getTokenTimeRemaining(token);
  
  if (timeRemaining === null) {
    return false;
  }

  const thresholdSeconds = thresholdMinutes * 60;
  return timeRemaining > 0 && timeRemaining < thresholdSeconds;
}

/**
 * Refresh token pair with rotation
 * Issues new access token and optionally rotates refresh token
 * 
 * @param refreshToken - Current refresh token
 * @param rotateRefreshToken - Whether to issue new refresh token (default: true)
 * @returns New token pair or error
 */
export function refreshTokenPair(
  refreshToken: string,
  rotateRefreshToken: boolean = true
): {
  success: boolean;
  accessToken?: JWTGenerationResult;
  newRefreshToken?: JWTGenerationResult;
  error?: string;
} {
  try {
    // Verify refresh token
    const verification = verifyToken(refreshToken);

    if (!verification.isValid || !verification.payload) {
      return {
        success: false,
        error: verification.error || 'Invalid refresh token',
      };
    }

    const payload = verification.payload;

    // Verify it's a refresh token
    if ((payload as any).type !== 'refresh') {
      return {
        success: false,
        error: 'Token is not a refresh token',
      };
    }

    const role = normalizeTokenRole(payload.role);

    // Generate new access token
    const newAccessToken = generateAccessToken(
      payload.userId,
      payload.walletAddress,
      role,
      {
        username: payload.username,
        sessionId: payload.sessionId,
      }
    );

    // Optionally generate new refresh token (rotation)
    let newRefreshToken: JWTGenerationResult | undefined;
    
    if (rotateRefreshToken && payload.sessionId) {
      newRefreshToken = generateRefreshToken(
        payload.userId,
        payload.walletAddress,
        payload.sessionId,
        role,
        payload.username
      );
    }

    return {
      success: true,
      accessToken: newAccessToken,
      newRefreshToken,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed',
    };
  }
}

/**
 * Validate refresh token and extract session ID
 * 
 * @param refreshToken - Refresh token to validate
 * @returns Session ID or null
 */
export function getSessionIdFromRefreshToken(refreshToken: string): string | null {
  try {
    const decoded = decodeToken(refreshToken);
    
    if (!decoded || (decoded as any).type !== 'refresh') {
      return null;
    }

    return decoded.sessionId || null;
  } catch {
    return null;
  }
}

/**
 * Create token pair with automatic refresh capability
 * Enhanced version that includes refresh metadata
 * 
 * @param userId - User ID
 * @param walletAddress - Wallet address
 * @param role - User role
 * @param sessionId - Session ID
 * @param username - Optional username
 * @returns Token pair with refresh capability
 */
export function generateRefreshableTokenPair(
  userId: string,
  walletAddress: string,
  role: UserRole,
  sessionId: string,
  username?: string
): {
  accessToken: JWTGenerationResult;
  refreshToken: JWTGenerationResult;
  refreshThreshold: number; // Seconds before expiry to refresh
} {
  const tokens = generateTokenPair(userId, walletAddress, role, sessionId, username);

  // Threshold is 5 minutes before expiry
  const refreshThreshold = tokens.accessToken.expiresIn - (5 * 60);

  return {
    ...tokens,
    refreshThreshold,
  };
}

/**
 * Validate token and determine if it needs refresh
 * 
 * @param token - Access token to check
 * @returns Status object with refresh recommendation
 */
export function getTokenRefreshStatus(token: string): {
  isValid: boolean;
  needsRefresh: boolean;
  timeRemaining: number | null;
  expiresAt: Date | null;
  error?: string;
} {
  const verification = verifyToken(token);
  
  if (!verification.isValid) {
    return {
      isValid: false,
      needsRefresh: false,
      timeRemaining: null,
      expiresAt: null,
      error: verification.error,
    };
  }

  const timeRemaining = getTokenTimeRemaining(token);
  const expiresAt = getTokenExpiration(token);
  const needsRefresh = shouldRefreshToken(token);

  return {
    isValid: true,
    needsRefresh,
    timeRemaining,
    expiresAt,
  };
}

function normalizeTokenRole(role?: string | null): UserRole {
  const normalized = (role ?? '').toLowerCase();

  if (
    normalized === UserRole.ADMIN ||
    normalized === UserRole.CREATOR ||
    normalized === UserRole.FUNDER ||
    normalized === UserRole.GUEST
  ) {
    return normalized;
  }

  return UserRole.FUNDER;
}

/**
 * Export for testing
 */
export const __TEST__ = {
  parseExpiryToSeconds,
};
