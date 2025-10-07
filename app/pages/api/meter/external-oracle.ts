import type { NextApiRequest, NextApiResponse } from 'next';

// External oracle simulation - represents a third-party oracle service
// This simulates an external API with potentially different data characteristics

let kwh = 1200; // Different baseline
let co2 = 480;

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  // Simulate occasional network delays
  const delay = Math.random() < 0.1 ? 2000 : 0; // 10% chance of 2-second delay

  setTimeout(() => {
    try {
      // Add different variance pattern to simulate different measurement methodology
      const variance = 0.98 + Math.random() * 0.04; // ±2% variance (more precise)

      const deltaWh = Math.floor((180 + Math.random() * 720) * variance);
      kwh += deltaWh;
      const co2kg = deltaWh * 0.00042 * variance; // Slightly different CO2 factor
      co2 += co2kg;

      const reading = {
        ts: Date.now(),
        kwh: Math.round(kwh) / 1000,
        co2: Math.round(co2 * 1000) / 1000,
        raw_wh: deltaWh,
        source: 'external-oracle-service',
        confidence: 0.75, // Lower confidence due to being external
        metadata: {
          methodology: 'satellite-imaging',
          accuracy: '±2%',
          lastCalibration: new Date(
            Date.now() - 24 * 60 * 60 * 1000
          ).toISOString(), // 24 hours ago
        },
      };

      res.status(200).json(reading);
    } catch (error) {
      // Simulate occasional external service failures
      if (Math.random() < 0.05) {
        // 5% failure rate
        res.status(503).json({
          error: 'External service temporarily unavailable',
          retryAfter: 30,
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          message: (error as Error).message,
        });
      }
    }
  }, delay);
}
