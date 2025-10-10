import { PrismaClient } from '@prisma/client';
import { SESSION_CONFIG } from '../config/auth';
import { logger } from '../logging/logger';

// Use singleton Prisma client
import { prisma } from '../prisma';

/**
 * Session Data Interface
 */
export interface SessionData {
  id: string;
  userId: string;
  token: string;
  refreshToken?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Session Creation Input
 */
export interface CreateSessionInput {
  userId: string;
  token: string;
  refreshToken?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
}

/**
 * Session Service
 * Handles all session-related database operations
 */
export class SessionService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Create a new session in the database
   * 
   * @param input - Session creation data
   * @returns Created session
   */
  async createSession(input: CreateSessionInput): Promise<SessionData> {
    try {
      // Check if user has too many active sessions
      await this.enforceSessionLimit(input.userId);

      const session = await this.prisma.session.create({
        data: {
          userId: input.userId,
          token: input.token,
          refreshToken: input.refreshToken,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          expiresAt: input.expiresAt,
        },
      });

      logger.info('Session created', {
        sessionId: session.id,
        userId: input.userId,
        ipAddress: input.ipAddress,
      });

      return session;
    } catch (error) {
      logger.error('Failed to create session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: input.userId,
      });
      throw new Error('Failed to create session');
    }
  }

  /**
   * Get session by token
   * 
   * @param token - Access token
   * @returns Session data or null
   */
  async getSessionByToken(token: string): Promise<SessionData | null> {
    try {
      const session = await this.prisma.session.findUnique({
        where: { token },
      });

      // Check if session is expired
      if (session && new Date() > session.expiresAt) {
        await this.deleteSession(session.id);
        return null;
      }

      return session;
    } catch (error) {
      logger.error('Failed to get session by token', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Get session by ID
   * 
   * @param sessionId - Session ID
   * @returns Session data or null
   */
  async getSessionById(sessionId: string): Promise<SessionData | null> {
    try {
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
      });

      return session;
    } catch (error) {
      logger.error('Failed to get session by ID', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
      });
      return null;
    }
  }

  /**
   * Get all active sessions for a user
   * 
   * @param userId - User ID
   * @returns Array of active sessions
   */
  async getUserSessions(userId: string): Promise<SessionData[]> {
    try {
      const sessions = await this.prisma.session.findMany({
        where: {
          userId,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return sessions;
    } catch (error) {
      logger.error('Failed to get user sessions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      return [];
    }
  }

  /**
   * Update session metadata
   * 
   * @param sessionId - Session ID
   * @param updates - Fields to update
   * @returns Updated session or null
   */
  async updateSession(
    sessionId: string,
    updates: Partial<{
      token: string;
      refreshToken: string;
      ipAddress: string;
      userAgent: string;
      expiresAt: Date;
    }>
  ): Promise<SessionData | null> {
    try {
      const session = await this.prisma.session.update({
        where: { id: sessionId },
        data: updates,
      });

      logger.info('Session updated', { sessionId });

      return session;
    } catch (error) {
      logger.error('Failed to update session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
      });
      return null;
    }
  }

  /**
   * Delete a session (logout)
   * 
   * @param sessionId - Session ID
   * @returns Success boolean
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      await this.prisma.session.delete({
        where: { id: sessionId },
      });

      logger.info('Session deleted', { sessionId });

      return true;
    } catch (error) {
      logger.error('Failed to delete session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
      });
      return false;
    }
  }

  /**
   * Delete session by token
   * 
   * @param token - Access token
   * @returns Success boolean
   */
  async deleteSessionByToken(token: string): Promise<boolean> {
    try {
      await this.prisma.session.delete({
        where: { token },
      });

      logger.info('Session deleted by token');

      return true;
    } catch (error) {
      logger.error('Failed to delete session by token', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Delete all sessions for a user (logout from all devices)
   * 
   * @param userId - User ID
   * @returns Number of sessions deleted
   */
  async deleteAllUserSessions(userId: string): Promise<number> {
    try {
      const result = await this.prisma.session.deleteMany({
        where: { userId },
      });

      logger.info('All user sessions deleted', {
        userId,
        count: result.count,
      });

      return result.count;
    } catch (error) {
      logger.error('Failed to delete all user sessions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      return 0;
    }
  }

  /**
   * Clean up expired sessions
   * Should be run periodically (e.g., via cron job)
   * 
   * @returns Number of sessions deleted
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await this.prisma.session.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      logger.info('Expired sessions cleaned up', {
        count: result.count,
      });

      return result.count;
    } catch (error) {
      logger.error('Failed to clean up expired sessions', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  /**
   * Enforce session limit per user
   * Removes oldest sessions if limit is exceeded
   * 
   * @param userId - User ID
   */
  private async enforceSessionLimit(userId: string): Promise<void> {
    const sessions = await this.getUserSessions(userId);

    if (sessions.length >= SESSION_CONFIG.MAX_SESSIONS_PER_USER) {
      // Remove oldest session
      const oldestSession = sessions[sessions.length - 1];
      await this.deleteSession(oldestSession.id);

      logger.info('Session limit enforced, oldest session removed', {
        userId,
        removedSessionId: oldestSession.id,
      });
    }
  }

  /**
   * Validate that a session exists and is not expired
   * 
   * @param token - Access token
   * @returns boolean indicating validity
   */
  async isSessionValid(token: string): Promise<boolean> {
    const session = await this.getSessionByToken(token);
    return session !== null;
  }

  /**
   * Get session count for a user
   * 
   * @param userId - User ID
   * @returns Number of active sessions
   */
  async getSessionCount(userId: string): Promise<number> {
    try {
      const count = await this.prisma.session.count({
        where: {
          userId,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      return count;
    } catch (error) {
      logger.error('Failed to get session count', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      return 0;
    }
  }

  /**
   * Refresh a session (extend expiration)
   * 
   * @param sessionId - Session ID
   * @param newExpiresAt - New expiration date
   * @returns Updated session or null
   */
  async refreshSession(
    sessionId: string,
    newExpiresAt: Date
  ): Promise<SessionData | null> {
    return this.updateSession(sessionId, { expiresAt: newExpiresAt });
  }

  /**
   * Get session statistics
   * 
   * @returns Session statistics
   */
  async getSessionStatistics(): Promise<{
    total: number;
    active: number;
    expired: number;
  }> {
    try {
      const now = new Date();

      const [total, active, expired] = await Promise.all([
        this.prisma.session.count(),
        this.prisma.session.count({
          where: {
            expiresAt: {
              gt: now,
            },
          },
        }),
        this.prisma.session.count({
          where: {
            expiresAt: {
              lte: now,
            },
          },
        }),
      ]);

      return { total, active, expired };
    } catch (error) {
      logger.error('Failed to get session statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return { total: 0, active: 0, expired: 0 };
    }
  }

  /**
   * Blacklist a token (add to blacklist to prevent reuse)
   * 
   * @param token - JWT token to blacklist
   * @param userId - User ID who owns the token
   * @param reason - Reason for blacklisting
   * @param expiresAt - When the token expires
   * @returns Success boolean
   */
  async blacklistToken(
    token: string,
    userId: string,
    reason: string = 'logout',
    expiresAt: Date
  ): Promise<boolean> {
    try {
      await this.prisma.blacklistedToken.create({
        data: {
          token,
          userId,
          reason,
          expiresAt,
        },
      });

      logger.info('Token blacklisted', {
        userId,
        reason,
        tokenPrefix: token.substring(0, 16) + '...',
      });

      return true;
    } catch (error) {
      logger.error('Failed to blacklist token', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      return false;
    }
  }

  /**
   * Check if a token is blacklisted
   * 
   * @param token - JWT token to check
   * @returns boolean indicating if token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const blacklistedToken = await this.prisma.blacklistedToken.findUnique({
        where: { token },
      });

      return blacklistedToken !== null;
    } catch (error) {
      logger.error('Failed to check token blacklist status', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Fail closed - if we can't check, assume it's blacklisted for security
      return true;
    }
  }

  /**
   * Clean up expired blacklisted tokens
   * Should be run periodically (e.g., via cron job)
   * 
   * @returns Number of tokens removed
   */
  async cleanupExpiredBlacklistedTokens(): Promise<number> {
    try {
      const result = await this.prisma.blacklistedToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      logger.info('Expired blacklisted tokens cleaned up', {
        count: result.count,
      });

      return result.count;
    } catch (error) {
      logger.error('Failed to clean up expired blacklisted tokens', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  /**
   * Get blacklist statistics
   * 
   * @returns Blacklist statistics
   */
  async getBlacklistStatistics(): Promise<{
    total: number;
    active: number;
    expired: number;
    byReason: Record<string, number>;
  }> {
    try {
      const now = new Date();

      const [total, active, expired, allTokens] = await Promise.all([
        this.prisma.blacklistedToken.count(),
        this.prisma.blacklistedToken.count({
          where: {
            expiresAt: {
              gt: now,
            },
          },
        }),
        this.prisma.blacklistedToken.count({
          where: {
            expiresAt: {
              lte: now,
            },
          },
        }),
        this.prisma.blacklistedToken.findMany({
          select: {
            reason: true,
          },
        }),
      ]);

      // Count by reason
      const byReason: Record<string, number> = {};
      allTokens.forEach(token => {
        const reason = token.reason || 'unknown';
        byReason[reason] = (byReason[reason] || 0) + 1;
      });

      return { total, active, expired, byReason };
    } catch (error) {
      logger.error('Failed to get blacklist statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return { total: 0, active: 0, expired: 0, byReason: {} };
    }
  }

  /**
   * Remove a specific token from blacklist (use with caution)
   * 
   * @param token - Token to remove from blacklist
   * @returns Success boolean
   */
  async removeFromBlacklist(token: string): Promise<boolean> {
    try {
      await this.prisma.blacklistedToken.delete({
        where: { token },
      });

      logger.warn('Token removed from blacklist', {
        tokenPrefix: token.substring(0, 16) + '...',
      });

      return true;
    } catch (error) {
      logger.error('Failed to remove token from blacklist', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}

// Export singleton instance
export const sessionService = new SessionService();

