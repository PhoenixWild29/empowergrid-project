import { computeGovernanceHealth } from '../../../lib/governance/metrics';

describe('computeGovernanceHealth', () => {
  it('returns zeros for empty proposals', () => {
    expect(computeGovernanceHealth([])).toEqual({
      active: 0,
      passed: 0,
      failed: 0,
      quorumAverage: 0,
      participationRate: 0,
    });
  });

  it('aggregates status counts and averages', () => {
    const metrics = computeGovernanceHealth([
      { status: 'ACTIVE', minQuorum: 100, voteStats: { votesFor: 40, votesAgainst: 10, totalVotes: 50 } },
      { status: 'PASSED', minQuorum: 80, voteStats: { votesFor: 60, votesAgainst: 10, totalVotes: 70 } },
      { status: 'FAILED', minQuorum: 60, voteStats: { votesFor: 10, votesAgainst: 40, totalVotes: 50 } },
    ]);

    expect(metrics.active).toBe(1);
    expect(metrics.passed).toBe(1);
    expect(metrics.failed).toBe(1);
    expect(metrics.quorumAverage).toBeCloseTo(80.0);
    expect(metrics.participationRate).toBeCloseTo((50 / 100 * 100 + 70 / 80 * 100 + 50 / 60 * 100) / 3, 1);
  });
});
