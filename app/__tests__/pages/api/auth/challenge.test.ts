import { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import handler from '../../../../pages/api/auth/challenge';
import { clearAllNonces } from '../../../../lib/utils/nonceGenerator';

// Mock the logger to avoid file system operations during tests
jest.mock('../../../../lib/logging/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
  },
  logSecurityEvent: jest.fn(),
}));

describe('/api/auth/challenge', () => {
  beforeEach(() => {
    // Clear all nonces before each test
    clearAllNonces();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    clearAllNonces();
  });

  describe('POST /api/auth/challenge', () => {
    it('should generate a challenge without wallet address', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: {},
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());

      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('nonce');
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('expiresAt');
      expect(data).toHaveProperty('expiresIn', 300); // 5 minutes = 300 seconds
      expect(data).toHaveProperty('timestamp');

      // Verify nonce format
      expect(data.nonce).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:/);

      // Verify message contains expected text
      expect(data.message).toContain('Sign this message to authenticate with EmpowerGRID');
      expect(data.message).toContain('Nonce:');
    });

    it('should generate a challenge with valid wallet address', async () => {
      const testWalletAddress = 'HXtBm8XZbxaTt41uqaKhwUAa6Z1aPyvJdsZVENiWsetg';

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          walletAddress: testWalletAddress,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());

      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('nonce');
      expect(data).toHaveProperty('message');

      // Verify wallet address is included in message
      expect(data.message).toContain(testWalletAddress);
      expect(data.nonce).toContain(testWalletAddress);
    });

    it('should reject invalid wallet address', async () => {
      const invalidWalletAddress = 'invalid-wallet-123';

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          walletAddress: invalidWalletAddress,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());

      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      expect(data.message).toContain('invalid');
    });

    it('should reject non-POST methods', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      const data = JSON.parse(res._getData());

      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error', 'Method Not Allowed');
    });

    it('should handle OPTIONS requests (CORS preflight)', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'OPTIONS',
        headers: {
          origin: 'http://localhost:3000',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getHeaders()).toHaveProperty('access-control-allow-origin');
    });

    it('should generate unique nonces for multiple requests', async () => {
      const nonces = new Set<string>();

      // Generate 5 challenges
      for (let i = 0; i < 5; i++) {
        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: {},
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(201);
        const data = JSON.parse(res._getData());
        nonces.add(data.nonce);
      }

      // All nonces should be unique
      expect(nonces.size).toBe(5);
    });

    it('should include security headers in response', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: {},
      });

      await handler(req, res);

      const headers = res._getHeaders();

      expect(headers).toHaveProperty('content-security-policy');
      expect(headers).toHaveProperty('x-frame-options', 'DENY');
      expect(headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(headers).toHaveProperty('x-xss-protection', '1; mode=block');
      expect(headers).not.toHaveProperty('x-powered-by');
    });

    it('should return ISO 8601 formatted timestamps', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: {},
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());

      // Verify ISO 8601 format
      expect(new Date(data.expiresAt).toISOString()).toBe(data.expiresAt);
      expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);

      // Verify expiresAt is in the future
      const expiresAt = new Date(data.expiresAt);
      const now = new Date();
      expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());

      // Verify expiresAt is approximately 5 minutes from now (within 10 seconds tolerance)
      const expectedExpiry = now.getTime() + (5 * 60 * 1000);
      expect(Math.abs(expiresAt.getTime() - expectedExpiry)).toBeLessThan(10000);
    });

    it('should handle malformed JSON gracefully', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          invalidField: 'some value',
          anotherInvalidField: 123,
        },
      });

      await handler(req, res);

      // Should still succeed since all fields are optional
      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data).toHaveProperty('success', true);
    });
  });
});

