interface ProposalLike {
  status: string;
  voteStats?: {
    votesFor: number;
    votesAgainst: number;
    totalVotes: number;
  };
  minQuorum?: number;
}

export interface GovernanceHealthMetrics {
  active: number;
  passed: number;
  failed: number;
  quorumAverage: number;
  participationRate: number;
}

export const computeGovernanceHealth = (proposals: ProposalLike[]): GovernanceHealthMetrics => {
  if (!proposals || proposals.length === 0) {
    return {
      active: 0,
      passed: 0,
      failed: 0,
      quorumAverage: 0,
      participationRate: 0,
    };
  }

  let quorumSum = 0;
  let participationSum = 0;

  const counts = proposals.reduce(
    (acc, proposal) => {
      if (proposal.status === 'ACTIVE') acc.active += 1;
      if (proposal.status === 'PASSED') acc.passed += 1;
      if (proposal.status === 'FAILED') acc.failed += 1;

      if (proposal.minQuorum) {
        quorumSum += proposal.minQuorum;
      }

      const votesFor = proposal.voteStats?.votesFor ?? 0;
      const votesAgainst = proposal.voteStats?.votesAgainst ?? 0;
      const totalVotes = votesFor + votesAgainst;
      if (proposal.minQuorum) {
        participationSum += Math.min(100, (totalVotes / proposal.minQuorum) * 100);
      }
      return acc;
    },
    { active: 0, passed: 0, failed: 0 }
  );

  const divisor = proposals.length;

  return {
    ...counts,
    quorumAverage: Number((quorumSum / divisor || 0).toFixed(1)),
    participationRate: Number((participationSum / divisor || 0).toFixed(1)),
  };
};
