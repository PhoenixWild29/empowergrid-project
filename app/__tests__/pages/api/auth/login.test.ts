/**
 * Auth Login API Endpoint Tests
 */

import { createMocks } from 'node-mocks-http';
import { createMockUser, resetAllMocks } from '../../../utils/mocks';

// Mock services - use path alias for consistency
jest.mock('@/lib/services/authService', () => ({
  authService: {
    login: jest.fn(),
  },
}));

jest.mock('@/lib/middleware/security', () => ({
  securityMiddleware: jest.fn(() => true),
}));

jest.mock('@/lib/middleware/authRateLimiter', () => ({
  applyAuthRateLimit: jest.fn(() => async () => true),
}));

jest.mock('@/lib/middleware/requestLogger', () => ({
  getClientIP: jest.fn(() => '127.0.0.1'),
  getUserAgent: jest.fn(() => 'test-agent'),
  logAuthenticationAttempt: jest.fn(),
}));

jest.mock('@/lib/services/securityMonitor', () => ({
  recordSecurityEvent: jest.fn(),
  SecurityEventType: {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILURE: 'LOGIN_FAILURE',
  },
}));

// Import handler and service after mocks
import handler from '@/pages/api/auth/login';
import { authService } from '@/lib/services/authService';

describe('/api/auth/login', () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    resetAllMocks();
    jest.clearAllMocks();
  });

  it('should login successfully with valid credentials', async () => {
    // Use valid nonce format: uuid:nanoid:timestamp
    const validNonce = '12345678-1234-1234-1234-123456789abc:mock-nanoid-1234:1234567890';
    const loginRequest = {
      walletAddress: mockUser.walletAddress,
      signature: 'mock-signature-that-is-at-least-64-characters-long-to-pass-validation-check',
      message: 'mock-message-that-is-long-enough',
      nonce: validNonce,
    };

    (authService.login as jest.Mock).mockResolvedValue({
      success: true,
      user: mockUser,
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      expiresAt: new Date(Date.now() + 3600 * 1000),
      sessionId: 'session-123',
    });

    const { req, res } = createMocks({
      method: 'POST',
      body: loginRequest,
      headers: {
        'content-type': 'application/json',
      },
    });
    (req as any).body = loginRequest;

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.accessToken).toBeDefined();
    expect(data.user).toBeDefined();
    expect(authService.login).toHaveBeenCalledWith(
      expect.objectContaining({
        walletAddress: loginRequest.walletAddress,
        signature: loginRequest.signature,
        message: loginRequest.message,
        nonce: loginRequest.nonce,
      }),
      expect.objectContaining({
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      })
    );
  });

  it('should reject invalid signature', async () => {
    const validNonce = '12345678-1234-1234-1234-123456789abc:mock-nanoid-1234:1234567890';
    const loginRequest = {
      walletAddress: mockUser.walletAddress,
      signature: 'invalid-signature-that-is-at-least-64-characters-long-to-pass-validation',
      message: 'mock-message-that-is-long-enough',
      nonce: validNonce,
    };

    (authService.login as jest.Mock).mockResolvedValue({
      success: false,
      error: {
        code: 'INVALID_SIGNATURE',
        message: 'Signature verification failed',
      },
    });

    const { req, res } = createMocks({
      method: 'POST',
      body: loginRequest,
      headers: {
        'content-type': 'application/json',
      },
    });
    (req as any).body = loginRequest;

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(false);
    expect(data.error).toBe('INVALID_SIGNATURE');
  });

  it('should reject expired nonce', async () => {
    // Use valid nonce format but expired timestamp
    const expiredNonce = '12345678-1234-1234-1234-123456789abc:mock-nanoid-1234:1000000000';
    const loginRequest = {
      walletAddress: mockUser.walletAddress,
      signature: 'mock-signature-that-is-at-least-64-characters-long-to-pass-validation',
      message: 'mock-message-that-is-long-enough',
      nonce: expiredNonce,
    };

    (authService.login as jest.Mock).mockResolvedValue({
      success: false,
      error: {
        code: 'EXPIRED_CHALLENGE',
        message: 'Challenge has expired',
      },
    });

    const { req, res } = createMocks({
      method: 'POST',
      body: loginRequest,
      headers: {
        'content-type': 'application/json',
      },
    });
    (req as any).body = loginRequest;

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('EXPIRED_CHALLENGE');
  });

  it('should validate request body', async () => {
    const invalidRequest = {
      walletAddress: '',
      signature: '',
    };

    const { req, res } = createMocks({
      method: 'POST',
      body: invalidRequest,
      headers: {
        'content-type': 'application/json',
      },
    });
    (req as any).body = invalidRequest;

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(false);
    expect(data.error).toBe('Validation Error');
  });

  it('should reject non-POST methods', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Method Not Allowed');
  });

  it('should handle server errors gracefully', async () => {
    const validNonce = '12345678-1234-1234-1234-123456789abc:mock-nanoid-1234:1234567890';
    (authService.login as jest.Mock).mockRejectedValue(
      new Error('Unexpected error')
    );

    const loginRequestBody = {
      walletAddress: mockUser.walletAddress,
      signature: 'mock-signature-that-is-at-least-64-characters-long-to-pass-validation',
      message: 'mock-message-that-is-long-enough',
      nonce: validNonce,
    };
    
    const { req, res } = createMocks({
      method: 'POST',
      body: loginRequestBody,
      headers: {
        'content-type': 'application/json',
      },
    });
    (req as any).body = loginRequestBody;

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(false);
    expect(data.error).toBe('Internal Server Error');
  });
});

