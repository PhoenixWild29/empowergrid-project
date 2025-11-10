import type { NextApiRequest, NextApiResponse } from 'next';
import { validatorHubStore } from '../../../lib/mock/validatorHubStore';
import { calculateValidatorMetrics } from '../../../lib/validators/metrics';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const milestones = validatorHubStore.listMilestones();
    const metrics = calculateValidatorMetrics(milestones);

    return res.status(200).json({
      success: true,
      milestones,
      metrics,
    });
  }

  if (req.method === 'PATCH') {
    const { milestoneId, status, actor = 'System', comment } = req.body ?? {};
    if (!milestoneId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Milestone update requires milestoneId and status.',
      });
    }

    const updated = validatorHubStore.updateMilestoneStatus(milestoneId, status, actor, comment);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Milestone not found.' });
    }

    const milestones = validatorHubStore.listMilestones();
    const metrics = calculateValidatorMetrics(milestones);

    return res.status(200).json({
      success: true,
      milestone: updated,
      metrics,
    });
  }

  if (req.method === 'POST') {
    const { milestoneId, actor = 'System', message } = req.body ?? {};
    if (!milestoneId || !message) {
      return res.status(400).json({ success: false, error: 'Comment requires milestoneId and message.' });
    }

    const updated = validatorHubStore.addComment(milestoneId, actor, message);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Milestone not found.' });
    }

    return res.status(200).json({ success: true, milestone: updated });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
