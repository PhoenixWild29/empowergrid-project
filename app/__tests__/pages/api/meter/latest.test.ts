import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '@/pages/api/meter/latest';

// Reset mocks before each test
beforeEach(() => {
  // Reset the module to clear the in-memory counters
  jest.resetModules();
});

describe('/api/meter/latest', () => {
  it('returns meter reading with correct structure', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);

    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('ts');
    expect(data).toHaveProperty('kwh');
    expect(data).toHaveProperty('co2');
    expect(data).toHaveProperty('raw_wh');

    expect(typeof data.ts).toBe('number');
    expect(typeof data.kwh).toBe('number');
    expect(typeof data.co2).toBe('number');
    expect(typeof data.raw_wh).toBe('number');
  });

  it('increments readings on multiple calls', async () => {
    // First call
    const { req: req1, res: res1 } = createMocks<
      NextApiRequest,
      NextApiResponse
    >({
      method: 'GET',
    });
    await handler(req1, res1);
    const data1 = JSON.parse(res1._getData());

    // Second call
    const { req: req2, res: res2 } = createMocks<
      NextApiRequest,
      NextApiResponse
    >({
      method: 'GET',
    });
    await handler(req2, res2);
    const data2 = JSON.parse(res2._getData());

    // Values should have increased
    expect(data2.kwh).toBeGreaterThan(data1.kwh);
    expect(data2.co2).toBeGreaterThan(data1.co2);
    expect(data2.ts).toBeGreaterThanOrEqual(data1.ts);
  });

  it('returns realistic energy values', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    await handler(req, res);

    const data = JSON.parse(res._getData());

    // Check that values are reasonable
    expect(data.kwh).toBeGreaterThan(0);
    expect(data.co2).toBeGreaterThan(0);
    expect(data.raw_wh).toBeGreaterThan(0);
    expect(data.raw_wh).toBeLessThan(2000); // Max delta should be reasonable
  });

  it('only accepts GET requests', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
  });

  it('returns consistent CO2 to kWh ratio', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    await handler(req, res);

    const data = JSON.parse(res._getData());

    // CO2 should be approximately 0.4 * kWh (400g CO2 per kWh)
    const expectedCo2 = data.kwh * 400;
    expect(data.co2).toBeCloseTo(expectedCo2, 1);
  });

  it('handles timestamp correctly', async () => {
    const beforeCall = Date.now();

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    await handler(req, res);

    const afterCall = Date.now();
    const data = JSON.parse(res._getData());

    expect(data.ts).toBeGreaterThanOrEqual(beforeCall);
    expect(data.ts).toBeLessThanOrEqual(afterCall);
  });
});
