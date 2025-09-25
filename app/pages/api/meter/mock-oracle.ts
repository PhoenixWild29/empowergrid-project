import type { NextApiRequest, NextApiResponse } from 'next';

// Mock oracle endpoint that simulates a secondary oracle source
// This can be used for testing multi-oracle functionality

let kwh = 1000; // Start with different baseline than primary
let co2 = 400;

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  // Add some variance to simulate real-world differences
  const variance = 0.95 + Math.random() * 0.1; // ±5% variance

  const deltaWh = Math.floor((200 + Math.random() * 800) * variance);
  kwh += deltaWh;
  const co2kg = deltaWh * 0.0004 * variance; // rough kg CO2 offset factor with variance
  co2 += co2kg;

  const reading = {
    ts: Date.now(),
    kwh: Math.round(kwh) / 1000,
    co2: Math.round(co2 * 1000) / 1000,
    raw_wh: deltaWh,
    source: 'mock-oracle-secondary',
    confidence: 0.85, // Slightly lower confidence than primary
  };

  res.status(200).json(reading);
}