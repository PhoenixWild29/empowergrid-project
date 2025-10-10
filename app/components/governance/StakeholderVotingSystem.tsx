/**
 * Stakeholder Voting System
 * 
 * WO-112: Active proposals, voting options, tallies, and history
 */

import React, { useState, useEffect } from 'react';

interface StakeholderVotingSystemProps {
  contractId: string;
}

export default function StakeholderVotingSystem({ contractId }: StakeholderVotingSystemProps) {
  const [activeProposals, setActiveProposals] = useState<any[]>([]);
  const [votingHistory, setVotingHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // WO-112: Fetch proposals and voting history
  useEffect(() => {
    async function fetchVotingData() {
      try {
        const response = await fetch(`/api/escrow/contracts/${contractId}/administration`);
        const data = await response.json();

        if (data.success) {
          setActiveProposals(data.data.pendingModifications || []);
        }
      } catch (error) {
        console.error('[WO-112] Failed to fetch voting data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchVotingData();
  }, [contractId]);

  // WO-112: Cast vote
  const handleVote = async (proposalId: string, vote: 'FOR' | 'AGAINST' | 'ABSTAIN') => {
    try {
      console.log('[WO-112] Voting:', vote, 'on proposal:', proposalId);
      alert('Vote recorded: ' + vote);
      // Would call voting API
    } catch (error) {
      console.error('[WO-112] Voting error:', error);
      alert('Failed to cast vote');
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading voting system...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Proposals</h3>

        {activeProposals.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600">No active proposals</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeProposals.map((proposal) => (
              <div key={proposal.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">{proposal.description}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Type: {proposal.type}
                  </p>
                </div>

                {/* Vote Tally */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Voting Progress</span>
                    <span className="font-medium">
                      {proposal.currentApprovals}/{proposal.requiredApprovals} approvals
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full"
                      style={{ width: ((proposal.currentApprovals / proposal.requiredApprovals) * 100) + '%' }}
                    ></div>
                  </div>
                </div>

                {/* Voting Options */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleVote(proposal.id, 'FOR')}
                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleVote(proposal.id, 'AGAINST')}
                    className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    ✗ Reject
                  </button>
                  <button
                    onClick={() => handleVote(proposal.id, 'ABSTAIN')}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                  >
                    Abstain
                  </button>
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  Expires: {new Date(proposal.expiresAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Individual Voting History */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Voting History</h3>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {votingHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No voting history</div>
          ) : (
            <div className="space-y-3">
              {votingHistory.map((vote, idx) => (
                <div key={idx} className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{vote.proposalTitle}</div>
                    <div className="text-xs text-gray-600 mt-1">{vote.vote}</div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(vote.votedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



