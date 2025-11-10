import type { ValidatorMilestoneItem } from '../mock/validatorHubStore';

export interface ValidatorHubMetrics {
  pending: number;
  inReview: number;
  needsInfo: number;
  approved: number;
  flagged: number;
  slaBreaches: number;
  averageSlaHoursRemaining: number;
}

export const calculateValidatorMetrics = (items: ValidatorMilestoneItem[]): ValidatorHubMetrics => {
  if (!items || items.length === 0) {
    return {
      pending: 0,
      inReview: 0,
      needsInfo: 0,
      approved: 0,
      flagged: 0,
      slaBreaches: 0,
      averageSlaHoursRemaining: 0,
    };
  }

  let totalHours = 0;

  const metrics = items.reduce(
    (acc, item) => {
      if (item.status === 'PENDING') acc.pending += 1;
      if (item.status === 'IN_REVIEW') acc.inReview += 1;
      if (item.status === 'NEEDS_INFO') acc.needsInfo += 1;
      if (item.status === 'APPROVED') acc.approved += 1;
      if (item.status === 'FLAGGED') acc.flagged += 1;
      if (item.slaHoursRemaining < 0) acc.slaBreaches += 1;
      totalHours += item.slaHoursRemaining;
      return acc;
    },
    {
      pending: 0,
      inReview: 0,
      needsInfo: 0,
      approved: 0,
      flagged: 0,
      slaBreaches: 0,
    }
  );

  return {
    ...metrics,
    averageSlaHoursRemaining: Number((totalHours / items.length).toFixed(1)),
  };
};
