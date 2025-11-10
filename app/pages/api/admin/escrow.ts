import type { NextApiRequest, NextApiResponse } from 'next';
import { getEscrowConfig, updateEscrowConfig, isAdminRequest } from '../../../lib/services/escrowConfigStore';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ success: true, config: getEscrowConfig() });
  }

  if (req.method === 'POST') {
    if (!isAdminRequest(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const updated = updateEscrowConfig(payload ?? {}, { actor: 'api' });
      return res.status(200).json({ success: true, config: updated });
    } catch (error: any) {
      console.error('[admin/escrow] update failed', error);
      return res.status(400).json({ success: false, error: error?.message ?? 'Invalid payload' });
    }
  }

  res.setHeader('Allow', 'GET,POST');
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
