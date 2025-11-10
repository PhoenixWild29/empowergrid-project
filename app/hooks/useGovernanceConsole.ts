import { useQuery } from '@tanstack/react-query';
import { computeGovernanceHealth } from '../lib/governance/metrics';

interface Proposal {
  id: string;
  title: string;
  description: string;
  status: string;
  proposalType: string;
  votingEndsAt: string;
  voteStats?: {
    votesFor: number;
    votesAgainst: number;
    totalVotes: number;
  };
  minQuorum?: number;
}

export const useGovernanceConsole = () => {
  return useQuery({
    queryKey: ['governance-console'],
    queryFn: async () => {
      const response = await fetch('/api/governance/proposals?limit=20&sortBy=votingEndsAt&sortOrder=asc', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to load proposals');
      }
      const payload = await response.json();
      const proposals: Proposal[] = payload?.proposals ?? [];
      const metrics = computeGovernanceHealth(proposals);
      return { proposals, metrics };
    },
    staleTime: 30_000,
  });
};
