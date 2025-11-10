import type { NextApiRequest, NextApiResponse } from 'next';
import { validatorHubStore } from '../../../lib/mock/validatorHubStore';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const validators = validatorHubStore.listValidators();
    return res.status(200).json({ success: true, validators });
  }

  if (req.method === 'POST') {
    const { milestoneId, validatorId, actor = 'System' } = req.body ?? {};
    if (!milestoneId || !validatorId) {
      return res.status(400).json({ success: false, error: 'Assignment requires milestoneId and validatorId.' });
    }

    const milestone = validatorHubStore.assignValidator(milestoneId, validatorId, actor);
    if (!milestone) {
      return res.status(404).json({ success: false, error: 'Milestone or validator not found.' });
    }

    return res.status(200).json({ success: true, milestone });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
