import { NextApiRequest, NextApiResponse } from 'next';
import { 
  verifyToken, 
  extractTokenFromHeader, 
  getTokenRefreshStatus,
  refreshTokenPair,
} from '../utils/jwt';
import { sessionService } from '../services/sessionService';
import { authService } from '../services/authService';
import { logger } from '../logging/logger';
import { UserProfile } from '../../types/auth';
import { recordSecurityEvent, SecurityEventType } from '../services/securityMonitor';

/**
 * Enhanced API Request with authenticated user
 */
export interface AuthenticatedRequest extends NextApiRequest {
  user: UserProfile;
  token: string;
  sessionId?: string;
}

/**
 * Authentication Result
 */
export interface AuthResult {
  isAuthenticated: boolean;
  user?: UserProfile;
  token?: string;
  error?: string;
}

/**
 * Extract and verify JWT token from request
 * 
 * @param req - Next.js API request
 * @returns Authentication result
 */
export async function authenticateRequest(
  req: NextApiRequest
): Promise<AuthResult> {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return {
        isAuthenticated: false,
        error: 'No authorization token provided',
      };
    }

    // Verify JWT token
    const verification = verifyToken(token);

    if (!verification.isValid || !verification.payload) {
      return {
        isAuthenticated: false,
        error: verification.error || 'Invalid token',
      };
    }

    // Check if token is blacklisted
    const isBlacklisted = await sessionService.isTokenBlacklisted(token);

    if (isBlacklisted) {
      logger.warn('Blacklisted token used', {
        tokenPrefix: token.substring(0, 16) + '...',
      });

      return {
        isAuthenticated: false,
        error: 'Token has been revoked',
      };
    }

    // Validate session exists and is not expired
    const isSessionValid = await sessionService.isSessionValid(token);

    if (!isSessionValid) {
      return {
        isAuthenticated: false,
        error: 'Session not found or expired',
      };
    }

    // Get user data
    const user = await authService.getUserByToken(token);

    if (!user) {
      return {
        isAuthenticated: false,
        error: 'User not found',
      };
    }

    return {
      isAuthenticated: true,
      user,
      token,
    };
  } catch (error) {
    logger.error('Authentication error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      isAuthenticated: false,
      error: 'Authentication failed',
    };
  }
}

/**
 * Check if token needs automatic refresh and handle it
 * 
 * @param token - Access token
 * @param res - Response object to set refresh header
 * @returns New access token if refreshed, otherwise original
 */
async function handleAutomaticTokenRefresh(
  token: string,
  res: NextApiResponse
): Promise<string> {
  try {
    // Check if token needs refresh
    const refreshStatus = getTokenRefreshStatus(token);

    if (!refreshStatus.needsRefresh) {
      return token;
    }

    // Get session to find refresh token
    const session = await sessionService.getSessionByToken(token);

    if (!session || !session.refreshToken) {
      // No refresh token available
      return token;
    }

    // Check if refresh token is blacklisted
    const isBlacklisted = await sessionService.isTokenBlacklisted(session.refreshToken);

    if (isBlacklisted) {
      return token;
    }

    // Refresh the token
    const refreshResult = refreshTokenPair(session.refreshToken, false); // Don't rotate on auto-refresh

    if (!refreshResult.success || !refreshResult.accessToken) {
      return token;
    }

    // Update session with new access token
    await sessionService.updateSession(session.id, {
      token: refreshResult.accessToken.accessToken,
      expiresAt: refreshResult.accessToken.expiresAt,
    });

    // Set new token in response header for client to update
    res.setHeader('X-New-Access-Token', refreshResult.accessToken.accessToken);
    res.setHeader('X-Token-Refreshed', 'true');

    logger.info('Token auto-refreshed', {
      userId: session.userId,
      sessionId: session.id,
    });

    return refreshResult.accessToken.accessToken;
  } catch (error) {
    logger.error('Auto token refresh failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Return original token if refresh fails
    return token;
  }
}

/**
 * Middleware to protect API routes with automatic token refresh
 * Verifies JWT token, attaches user to request, and auto-refreshes expiring tokens
 * 
 * Usage:
 * ```typescript
 * export default withAuth(async (req, res, user) => {
 *   // Your protected endpoint logic
 *   res.json({ message: 'Success', userId: user.id });
 * });
 * ```
 * 
 * @param handler - Protected route handler
 * @param options - Optional configuration
 * @returns Next.js API handler with authentication
 */
export function withAuth(
  handler: (
    req: AuthenticatedRequest,
    res: NextApiResponse,
    user: UserProfile
  ) => Promise<void> | void,
  options?: {
    autoRefresh?: boolean; // Enable automatic token refresh (default: true)
  }
) {
  const autoRefresh = options?.autoRefresh !== false;

  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Authenticate request
    const authResult = await authenticateRequest(req);

    if (!authResult.isAuthenticated || !authResult.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: authResult.error || 'Authentication required',
        statusCode: 401,
      });
    }

    // Handle automatic token refresh if enabled
    let currentToken = authResult.token!;
    if (autoRefresh) {
      currentToken = await handleAutomaticTokenRefresh(currentToken, res);
    }

    // Attach user and token to request
    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.user = authResult.user;
    authenticatedReq.token = currentToken;

    // Call the protected handler
    try {
      await handler(authenticatedReq, res, authResult.user);
    } catch (error) {
      logger.error('Protected route error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: authResult.user.id,
      });

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: 'An error occurred processing your request',
          statusCode: 500,
        });
      }
    }
  };
}

/**
 * Middleware for optional authentication
 * Attaches user if authenticated, but doesn't require it
 * 
 * Usage:
 * ```typescript
 * export default withOptionalAuth(async (req, res, user) => {
 *   if (user) {
 *     // User is authenticated
 *   } else {
 *     // User is not authenticated (guest)
 *   }
 * });
 * ```
 */
export function withOptionalAuth(
  handler: (
    req: AuthenticatedRequest | NextApiRequest,
    res: NextApiResponse,
    user?: UserProfile
  ) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Try to authenticate
    const authResult = await authenticateRequest(req);

    if (authResult.isAuthenticated && authResult.user) {
      // Attach user to request
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = authResult.user;
      authenticatedReq.token = authResult.token!;

      await handler(authenticatedReq, res, authResult.user);
    } else {
      // Continue without authentication
      await handler(req, res, undefined);
    }
  };
}

/**
 * Middleware to require specific user role
 * 
 * Usage:
 * ```typescript
 * export default withRole(['ADMIN', 'CREATOR'], async (req, res, user) => {
 *   // Only admins and creators can access this
 * });
 * ```
 */
export function withRole(
  allowedRoles: string[],
  handler: (
    req: AuthenticatedRequest,
    res: NextApiResponse,
    user: UserProfile
  ) => Promise<void> | void
) {
  return withAuth(async (req, res, user) => {
    // Check if user has required role
    if (!allowedRoles.includes(user.role)) {
      logger.warn('Insufficient permissions', {
        userId: user.id,
        userRole: user.role,
        requiredRoles: allowedRoles,
      });

      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to access this resource',
        statusCode: 403,
      });
    }

    // User has required role, call handler
    await handler(req, res, user);
  });
}

/**
 * Middleware to require verified users only
 * 
 * Usage:
 * ```typescript
 * export default withVerification(async (req, res, user) => {
 *   // Only verified users can access this
 * });
 * ```
 */
export function withVerification(
  handler: (
    req: AuthenticatedRequest,
    res: NextApiResponse,
    user: UserProfile
  ) => Promise<void> | void
) {
  return withAuth(async (req, res, user) => {
    // Check if user is verified
    if (!user.verified) {
      logger.warn('Unverified user attempted access', {
        userId: user.id,
        walletAddress: user.walletAddress,
      });

      return res.status(403).json({
        success: false,
        error: 'Verification Required',
        message: 'You must complete verification to access this resource',
        statusCode: 403,
      });
    }

    // User is verified, call handler
    await handler(req, res, user);
  });
}

/**
 * Combine multiple middleware functions
 * 
 * Usage:
 * ```typescript
 * export default combineMiddleware(
 *   withAuth,
 *   withRole(['ADMIN']),
 *   withVerification
 * )(async (req, res, user) => {
 *   // Only verified admins can access this
 * });
 * ```
 */
export function combineMiddleware(
  ...middlewares: Array<
    (handler: any) => (req: NextApiRequest, res: NextApiResponse) => Promise<void>
  >
) {
  return (handler: any) => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    );
  };
}

/**
 * Check if request has valid authentication
 * Lightweight check without full user loading
 * 
 * @param req - Next.js API request
 * @returns boolean indicating if authenticated
 */
export async function isAuthenticated(req: NextApiRequest): Promise<boolean> {
  const authResult = await authenticateRequest(req);
  return authResult.isAuthenticated;
}

/**
 * Get user from request if authenticated
 * 
 * @param req - Next.js API request
 * @returns User profile or null
 */
export async function getUserFromRequest(
  req: NextApiRequest
): Promise<UserProfile | null> {
  const authResult = await authenticateRequest(req);
  return authResult.user || null;
}

