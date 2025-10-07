import type { NextApiRequest, NextApiResponse } from 'next';

// Simple in-memory counters for demonstration.  Each request increments
// energy production and carbon savings with random deltas.  In a real
// deployment this endpoint would not exist; Switchboard or another
// oracle would ingest meter data from IoT devices.
let kwh = 0;
let co2 = 0;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const deltaWh = Math.floor(200 + Math.random() * 800); // 0.2–1.0 kWh in Wh
  kwh += deltaWh;
  const co2kg = (deltaWh / 1000) * 400; // 400g CO2 per kWh for this reading
  co2 += co2kg;
  const reading = {
    ts: Date.now(),
    kwh: Math.round(kwh) / 1000,
    co2: Math.round(co2 * 1000) / 1000, // Return cumulative CO2
    raw_wh: deltaWh,
  };
  res.status(200).json(reading);
}
