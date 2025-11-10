import { calculateValidatorMetrics } from '../../../lib/validators/metrics';
import type { ValidatorMilestoneItem } from '../../../lib/mock/validatorHubStore';

describe('calculateValidatorMetrics', () => {
  const baseMilestone = (overrides: Partial<ValidatorMilestoneItem>): ValidatorMilestoneItem => ({
    id: 'milestone',
    projectId: 'proj',
    projectName: 'Project',
    milestoneName: 'Milestone',
    requestedAmount: 1000,
    status: 'PENDING',
    priority: 'LOW',
    submittedAt: '2025-06-01T00:00:00.000Z',
    targetReleaseAt: '2025-06-05T00:00:00.000Z',
    slaHoursRemaining: 10,
    location: 'NY',
    technology: 'Solar',
    assignedValidators: [],
    riskFlags: [],
    evidence: [],
    decisionLog: [],
    ...overrides,
  });

  it('returns zeros for empty list', () => {
    const metrics = calculateValidatorMetrics([]);
    expect(metrics).toEqual({
      pending: 0,
      inReview: 0,
      needsInfo: 0,
      approved: 0,
      flagged: 0,
      slaBreaches: 0,
      averageSlaHoursRemaining: 0,
    });
  });

  it('counts statuses and averages SLA correctly', () => {
    const metrics = calculateValidatorMetrics([
      baseMilestone({ status: 'PENDING', slaHoursRemaining: 12 }),
      baseMilestone({ status: 'IN_REVIEW', slaHoursRemaining: -2, id: 'two' }),
      baseMilestone({ status: 'NEEDS_INFO', slaHoursRemaining: 4, id: 'three' }),
      baseMilestone({ status: 'APPROVED', slaHoursRemaining: 6, id: 'four' }),
      baseMilestone({ status: 'FLAGGED', slaHoursRemaining: 1, id: 'five' }),
    ]);

    expect(metrics.pending).toBe(1);
    expect(metrics.inReview).toBe(1);
    expect(metrics.needsInfo).toBe(1);
    expect(metrics.approved).toBe(1);
    expect(metrics.flagged).toBe(1);
    expect(metrics.slaBreaches).toBe(1);
    expect(metrics.averageSlaHoursRemaining).toBeCloseTo(4.2);
  });
});
