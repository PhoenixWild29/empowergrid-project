/**
 * Auth Service Tests
 */

import { AuthService, LoginRequest } from '../../lib/services/authService';
import { sessionService } from '../../lib/services/sessionService';
import { validateNonce, consumeNonce } from '../../lib/utils/nonceGenerator';
import { verifySignature } from '../../lib/utils/solanaCrypto';
import { generateTokenPair } from '../../lib/utils/jwt';
import { prisma } from '../../lib/prisma';
import {
  createMockUser,
  createMockSession,
  resetAllMocks,
  setupDefaultMocks,
} from '../utils/mocks';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../lib/utils/nonceGenerator', () => ({
  validateNonce: jest.fn(),
  consumeNonce: jest.fn(),
}));

jest.mock('../../lib/utils/solanaCrypto', () => ({
  verifySignature: jest.fn(),
}));

jest.mock('../../lib/utils/jwt', () => ({
  generateTokenPair: jest.fn(),
}));

jest.mock('../../lib/services/sessionService', () => ({
  sessionService: {
    createSession: jest.fn(),
    invalidateSession: jest.fn(),
    refreshSession: jest.fn(),
    getSession: jest.fn(),
  },
}));

describe('AuthService', () => {
  let authService: AuthService;
  const mockUser = createMockUser();
  const mockSession = createMockSession({ userId: mockUser.id });

  beforeEach(() => {
    resetAllMocks();
    setupDefaultMocks();
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('login', () => {
    const validLoginRequest: LoginRequest = {
      walletAddress: mockUser.walletAddress,
      signature: 'mock-signature',
      message: 'mock-message',
      nonce: 'valid-nonce',
    };

    it('should login successfully with valid credentials', async () => {
      (validateNonce as jest.Mock).mockReturnValue({ isValid: true });
      (verifySignature as jest.Mock).mockReturnValue({ isValid: true });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (generateTokenPair as jest.Mock).mockReturnValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
      });
      (sessionService.createSession as jest.Mock).mockResolvedValue(mockSession);

      const result = await authService.login(validLoginRequest, {
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(sessionService.createSession).toHaveBeenCalled();
    });

    it('should fail with invalid nonce', async () => {
      (validateNonce as jest.Mock).mockReturnValue({
        isValid: false,
        error: 'Nonce expired',
      });

      const result = await authService.login(validLoginRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBeDefined();
      expect(verifySignature).not.toHaveBeenCalled();
    });

    it('should fail with invalid signature', async () => {
      (validateNonce as jest.Mock).mockReturnValue({ isValid: true });
      (verifySignature as jest.Mock).mockReturnValue({
        isValid: false,
        error: 'Invalid signature',
      });

      const result = await authService.login(validLoginRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should create new user if not exists', async () => {
      (validateNonce as jest.Mock).mockReturnValue({ isValid: true });
      (verifySignature as jest.Mock).mockReturnValue({ isValid: true });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (generateTokenPair as jest.Mock).mockReturnValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
      });
      (sessionService.createSession as jest.Mock).mockResolvedValue(mockSession);

      const result = await authService.login(validLoginRequest);

      expect(result.success).toBe(true);
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result.user).toBeDefined();
    });

    it('should handle database errors gracefully', async () => {
      (validateNonce as jest.Mock).mockReturnValue({ isValid: true });
      (verifySignature as jest.Mock).mockReturnValue({ isValid: true });
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const result = await authService.login(validLoginRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      (sessionService.invalidateSession as jest.Mock).mockResolvedValue(true);

      const result = await authService.logout('token');

      expect(result).toBe(true);
      expect(sessionService.invalidateSession).toHaveBeenCalled();
    });

    it('should handle logout errors gracefully', async () => {
      (sessionService.invalidateSession as jest.Mock).mockRejectedValue(
        new Error('Session error')
      );

      await expect(authService.logout('token')).rejects.toThrow();
    });
  });

  describe('validateSession', () => {
    it('should validate session successfully', async () => {
      (sessionService.isSessionValid as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateSession('token');

      expect(result).toBe(true);
      expect(sessionService.isSessionValid).toHaveBeenCalledWith('token');
    });

    it('should fail with invalid session', async () => {
      (sessionService.isSessionValid as jest.Mock).mockResolvedValue(false);

      const result = await authService.validateSession('invalid-token');

      expect(result).toBe(false);
    });
  });
});

