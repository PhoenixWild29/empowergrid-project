import type { NextApiRequest, NextApiResponse } from 'next';
import { checkEscrowHealth, dispatchAlerts } from '../../../lib/services/escrowHealth';

const authorizeCron = (req: NextApiRequest) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const header = req.headers['authorization'];
  if (header && header.startsWith('Bearer ')) {
    return header.slice('Bearer '.length) === secret;
  }

  const raw = req.headers['x-cron-secret'];
  if (Array.isArray(raw)) {
    return raw.includes(secret);
  }
  return raw === secret;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET,POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!authorizeCron(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const snapshot = await checkEscrowHealth();
    await dispatchAlerts(snapshot);
    return res.status(200).json({ success: true, data: snapshot });
  } catch (error: any) {
    console.error('[cron/escrow-health] failed', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal error' });
  }
}
