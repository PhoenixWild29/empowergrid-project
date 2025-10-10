/**
 * Realms DAO Governance View
 * 
 * WO-156: Realms DAO-specific governance interface
 * 
 * Features:
 * - Realms DAO proposals
 * - On-chain voting links
 * - Token requirements
 * - Contract addresses
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import GovernanceContextSwitcher from '../../components/governance/GovernanceContextSwitcher';

export default function RealmsGovernancePage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRealmsProposals();
  }, []);

  const fetchRealmsProposals = async () => {
    try {
      const response = await fetch('/api/governance/proposals');
      const data = await response.json();

      if (data.success) {
        // Filter for Realms DAO proposals only
        const realmsProposals = data.proposals.filter((p: any) => p.realmsProposalId);
        setProposals(realmsProposals);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch Realms proposals:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* WO-156: Context Switcher */}
        <div className="mb-6">
          <GovernanceContextSwitcher />
        </div>

        {/* WO-156: Breadcrumb indicating context */}
        <div className="text-sm text-gray-600 mb-4">
          <span>Governance</span>
          <span className="mx-2">→</span>
          <span className="text-purple-600 font-medium">Realms DAO</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">🏛️ Realms DAO Governance</h1>

        {loading ? (
          <div className="text-center py-12">Loading Realms proposals...</div>
        ) : proposals.length > 0 ? (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <div
                key={proposal.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
                onClick={() => router.push(`/governance/proposals/${proposal.id}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-semibold">{proposal.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{proposal.description.substring(0, 150)}...</p>
                  </div>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                    Realms DAO
                  </span>
                </div>

                {/* Contract addresses */}
                {proposal.realmsGovernance && (
                  <div className="mt-3 text-xs text-gray-500">
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      {proposal.realmsGovernance.substring(0, 20)}...
                    </code>
                  </div>
                )}

                {/* On-chain link */}
                {proposal.onChainVotingUrl && (
                  <a
                    href={proposal.onChainVotingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-purple-600 hover:text-purple-800 text-sm mt-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Vote on Realms.today →
                  </a>
                )}

                <div className="flex gap-4 mt-3 text-sm">
                  <span className="text-green-600">✓ {proposal.voteStats.votesFor}</span>
                  <span className="text-red-600">✗ {proposal.voteStats.votesAgainst}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No Realms DAO proposals found</p>
            <button
              onClick={() => router.push('/governance/proposals/create')}
              className="mt-4 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Create Realms Proposal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}



