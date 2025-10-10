import { PrismaClient } from '@prisma/client';
import { verifySignature } from '../utils/solanaCrypto';
import { validateNonce, consumeNonce } from '../utils/nonceGenerator';
import { generateTokenPair } from '../utils/jwt';
import { sessionService, SessionService } from './sessionService';
import { AuthErrorCode, USER_DEFAULTS, WalletProvider } from '../config/auth';
import { logger, logSecurityEvent } from '../logging/logger';
import { UserRole, UserProfile } from '../../types/auth';
import { prisma } from '../prisma';

/**
 * Login Request Data
 */
export interface LoginRequest {
  walletAddress: string;
  signature: string;
  message: string;
  nonce: string;
  provider?: WalletProvider;
}

/**
 * Login Result
 */
export interface LoginResult {
  success: boolean;
  user?: UserProfile;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  expiresAt?: Date;
  sessionId?: string;
  error?: {
    code: AuthErrorCode;
    message: string;
  };
}

/**
 * Authentication Service
 * Handles the complete authentication flow
 */
export class AuthService {
  private prisma: PrismaClient;
  private sessionService: SessionService;

  constructor(
    prismaClient?: PrismaClient,
    sessionServiceInstance?: SessionService
  ) {
    this.prisma = prismaClient || prisma;
    this.sessionService = sessionServiceInstance || sessionService;
  }

  /**
   * Main login method
   * Orchestrates the entire authentication flow:
   * 1. Validate nonce
   * 2. Verify signature
   * 3. Get or create user
   * 4. Generate JWT tokens
   * 5. Create session
   * 
   * @param request - Login request data
   * @param metadata - Additional metadata (IP, user agent)
   * @returns Login result with tokens or error
   */
  async login(
    request: LoginRequest,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<LoginResult> {
    try {
      // Step 1: Validate nonce
      const nonceValidation = validateNonce(request.nonce);
      if (!nonceValidation.isValid) {
        logSecurityEvent(
          'login_failed_invalid_nonce',
          undefined,
          metadata?.ipAddress,
          {
            walletAddress: request.walletAddress,
            error: nonceValidation.error,
          }
        );

        return {
          success: false,
          error: {
            code: this.mapNonceErrorToCode(nonceValidation.error),
            message: nonceValidation.error || 'Invalid nonce',
          },
        };
      }

      // Step 2: Verify signature
      const signatureVerification = verifySignature(
        request.message,
        request.signature,
        request.walletAddress
      );

      if (!signatureVerification.isValid) {
        logSecurityEvent(
          'login_failed_invalid_signature',
          undefined,
          metadata?.ipAddress,
          {
            walletAddress: request.walletAddress,
            error: signatureVerification.error,
          }
        );

        // Don't consume nonce if signature is invalid
        return {
          success: false,
          error: {
            code: AuthErrorCode.INVALID_SIGNATURE,
            message: signatureVerification.error || 'Invalid signature',
          },
        };
      }

      // Step 3: Verify message contains the nonce
      if (!request.message.includes(request.nonce)) {
        logSecurityEvent(
          'login_failed_nonce_mismatch',
          undefined,
          metadata?.ipAddress,
          {
            walletAddress: request.walletAddress,
          }
        );

        return {
          success: false,
          error: {
            code: AuthErrorCode.INVALID_SIGNATURE,
            message: 'Message does not match challenge',
          },
        };
      }

      // Step 4: Consume nonce to prevent replay attacks
      const nonceConsumed = consumeNonce(request.nonce);
      if (!nonceConsumed) {
        logSecurityEvent(
          'login_failed_nonce_already_used',
          undefined,
          metadata?.ipAddress,
          {
            walletAddress: request.walletAddress,
          }
        );

        return {
          success: false,
          error: {
            code: AuthErrorCode.CHALLENGE_ALREADY_USED,
            message: 'Challenge has already been used',
          },
        };
      }

      // Step 5: Get or create user
      const user = await this.getOrCreateUser(request.walletAddress);
      if (!user) {
        return {
          success: false,
          error: {
            code: AuthErrorCode.REGISTRATION_FAILED,
            message: 'Failed to register user',
          },
        };
      }

      // Step 6: Generate JWT tokens
      const tokens = generateTokenPair(
        user.id,
        request.walletAddress,
        user.role,
        '', // Will be set after session creation
        user.username
      );

      // Step 7: Create session
      const session = await this.sessionService.createSession({
        userId: user.id,
        token: tokens.accessToken.accessToken,
        refreshToken: tokens.refreshToken.accessToken,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        expiresAt: tokens.accessToken.expiresAt,
      });

      // Log successful login
      logger.info('User logged in successfully', {
        userId: user.id,
        walletAddress: request.walletAddress,
        sessionId: session.id,
        ipAddress: metadata?.ipAddress,
      });

      logSecurityEvent(
        'login_successful',
        user.id,
        metadata?.ipAddress,
        {
          walletAddress: request.walletAddress,
          provider: request.provider,
        }
      );

      return {
        success: true,
        user,
        accessToken: tokens.accessToken.accessToken,
        refreshToken: tokens.refreshToken.accessToken,
        expiresIn: tokens.accessToken.expiresIn,
        expiresAt: tokens.accessToken.expiresAt,
        sessionId: session.id,
      };
    } catch (error) {
      logger.error('Login failed with unexpected error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        walletAddress: request.walletAddress,
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        success: false,
        error: {
          code: AuthErrorCode.UNKNOWN_ERROR,
          message: 'An unexpected error occurred during login',
        },
      };
    }
  }

  /**
   * Get existing user or create new user for wallet address
   * 
   * @param walletAddress - Wallet address
   * @returns User profile or null
   */
  private async getOrCreateUser(
    walletAddress: string
  ): Promise<UserProfile | null> {
    try {
      // Check if user exists
      let dbUser = await this.prisma.user.findUnique({
        where: { walletAddress },
        include: { userStats: true },
      });

      // Create new user if doesn't exist
      if (!dbUser) {
        logger.info('Creating new user', { walletAddress });

        // Generate username from wallet address
        const username = this.generateUsernameFromWallet(walletAddress);

        dbUser = await this.prisma.user.create({
          data: {
            walletAddress,
            username,
            role: USER_DEFAULTS.ROLE,
            reputation: USER_DEFAULTS.REPUTATION,
            verified: USER_DEFAULTS.VERIFIED,
            userStats: {
              create: {
                projectsCreated: 0,
                projectsFunded: 0,
                totalFunded: 0,
                successfulProjects: 0,
                totalEarnings: 0,
              },
            },
          },
          include: { userStats: true },
        });

        logger.info('New user created', {
          userId: dbUser.id,
          walletAddress,
        });
      }

      // Convert to UserProfile format
      const userProfile: UserProfile = {
        id: dbUser.id,
        walletAddress: { toBase58: () => dbUser!.walletAddress } as any, // Simplified
        username: dbUser.username,
        email: dbUser.email || undefined,
        avatar: dbUser.avatar || undefined,
        bio: dbUser.bio || undefined,
        website: dbUser.website || undefined,
        twitter: (dbUser.socialLinks as any)?.twitter,
        linkedin: (dbUser.socialLinks as any)?.linkedin,
        role: dbUser.role as UserRole,
        reputation: dbUser.reputation,
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt,
        verified: dbUser.verified,
        stats: {
          projectsCreated: dbUser.userStats?.projectsCreated || 0,
          projectsFunded: dbUser.userStats?.projectsFunded || 0,
          totalFunded: dbUser.userStats?.totalFunded || 0,
          successfulProjects: dbUser.userStats?.successfulProjects || 0,
        },
      };

      return userProfile;
    } catch (error) {
      logger.error('Failed to get or create user', {
        error: error instanceof Error ? error.message : 'Unknown error',
        walletAddress,
      });
      return null;
    }
  }

  /**
   * Generate a unique username from wallet address
   * 
   * @param walletAddress - Wallet address
   * @returns Generated username
   */
  private generateUsernameFromWallet(walletAddress: string): string {
    // Take first 4 and last 4 characters of wallet address
    const prefix = walletAddress.substring(0, 4);
    const suffix = walletAddress.substring(walletAddress.length - 4);
    return `user_${prefix}${suffix}`;
  }

  /**
   * Map nonce validation error to auth error code
   * 
   * @param error - Nonce validation error message
   * @returns Auth error code
   */
  private mapNonceErrorToCode(error?: string): AuthErrorCode {
    if (!error) return AuthErrorCode.CHALLENGE_NOT_FOUND;

    if (error.includes('expired')) return AuthErrorCode.EXPIRED_CHALLENGE;
    if (error.includes('not found')) return AuthErrorCode.CHALLENGE_NOT_FOUND;
    if (error.includes('already used')) return AuthErrorCode.CHALLENGE_ALREADY_USED;

    return AuthErrorCode.CHALLENGE_NOT_FOUND;
  }

  /**
   * Logout user (invalidate session)
   * 
   * @param token - Access token
   * @returns Success boolean
   */
  async logout(token: string): Promise<boolean> {
    try {
      const success = await this.sessionService.deleteSessionByToken(token);

      if (success) {
        logger.info('User logged out', { token: token.substring(0, 16) + '...' });
      }

      return success;
    } catch (error) {
      logger.error('Logout failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Validate an active session
   * 
   * @param token - Access token
   * @returns boolean indicating validity
   */
  async validateSession(token: string): Promise<boolean> {
    return this.sessionService.isSessionValid(token);
  }

  /**
   * Get user by access token
   * 
   * @param token - Access token
   * @returns User profile or null
   */
  async getUserByToken(token: string): Promise<UserProfile | null> {
    try {
      const session = await this.sessionService.getSessionByToken(token);
      if (!session) {
        return null;
      }

      const dbUser = await this.prisma.user.findUnique({
        where: { id: session.userId },
        include: { userStats: true },
      });

      if (!dbUser) {
        return null;
      }

      // Convert to UserProfile
      const userProfile: UserProfile = {
        id: dbUser.id,
        walletAddress: { toBase58: () => dbUser.walletAddress } as any,
        username: dbUser.username,
        email: dbUser.email || undefined,
        avatar: dbUser.avatar || undefined,
        bio: dbUser.bio || undefined,
        website: dbUser.website || undefined,
        twitter: (dbUser.socialLinks as any)?.twitter,
        linkedin: (dbUser.socialLinks as any)?.linkedin,
        role: dbUser.role as UserRole,
        reputation: dbUser.reputation,
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt,
        verified: dbUser.verified,
        stats: {
          projectsCreated: dbUser.userStats?.projectsCreated || 0,
          projectsFunded: dbUser.userStats?.projectsFunded || 0,
          totalFunded: dbUser.userStats?.totalFunded || 0,
          successfulProjects: dbUser.userStats?.successfulProjects || 0,
        },
      };

      return userProfile;
    } catch (error) {
      logger.error('Failed to get user by token', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

