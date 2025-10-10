/**
 * Proposal Detail View with Voting Interface
 * 
 * WO-143: Comprehensive proposal view & voting
 * WO-144: Realms DAO enhancements
 * 
 * Features:
 * - Complete proposal details
 * - Vote counts with visual progress
 * - Voting interface (Yes/No)
 * - Voting deadline & time remaining
 * - User vote status
 * - Realms DAO integration
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import TokenGatedVotingInterface from '../../../components/governance/TokenGatedVotingInterface';

export default function ProposalDetailView() {
  const router = useRouter();
  const { id } = router.query;
  
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [userVote, setUserVote] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    fetchProposal();
  }, [id]);

  const fetchProposal = async () => {
    try {
      const response = await fetch(`/api/governance/proposals/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setProposal(data.proposal);
        
        // Check if user already voted
        const userId = 'current-user-id'; // Would come from auth context
        const existingVote = data.proposal.votes.find((v: any) => v.voterId === userId);
        setUserVote(existingVote);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch proposal:', error);
      setLoading(false);
    }
  };

  const handleVote = async (support: boolean) => {
    if (!proposal || voting) return;

    setVoting(true);
    try {
      const response = await fetch(`/api/governance/proposals/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ support }),
      });

      const data = await response.json();
      
      if (data.success) {
        setUserVote(data.vote);
        await fetchProposal(); // Refresh to show updated vote counts
      } else {
        alert(data.message || 'Failed to record vote');
      }
    } catch (error) {
      alert('Failed to submit vote');
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading proposal...</div>;
  }

  if (!proposal) {
    return <div className="p-8">Proposal not found</div>;
  }

  const results = proposal.votingResults;
  const totalVotes = results.votesFor + results.votesAgainst;
  const forPercentage = totalVotes > 0 ? (results.votesFor / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? (results.votesAgainst / totalVotes) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Proposals
        </button>

        {/* WO-143: Proposal Details */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{proposal.title}</h1>
              <p className="text-gray-600">
                Proposed by {proposal.proposer.username} • {new Date(proposal.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <ProposalStatusBadge status={proposal.status} />
          </div>

          <div className="prose max-w-none mb-6">
            <p className="text-gray-700 whitespace-pre-wrap">{proposal.description}</p>
          </div>

          {/* WO-144: Realms DAO Information */}
          {proposal.realmsProposalId && (
            <div className="border-t pt-6 mb-6">
              <h3 className="text-lg font-semibold mb-3">🏛️ Realms DAO Integration</h3>
              <div className="bg-purple-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Realms Proposal ID:</span>
                  <code className="text-xs bg-white px-2 py-1 rounded">{proposal.realmsProposalId.substring(0, 16)}...</code>
                </div>
                
                {proposal.realmsGovernance && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Governance Address:</span>
                    <code className="text-xs bg-white px-2 py-1 rounded">{proposal.realmsGovernance.substring(0, 16)}...</code>
                  </div>
                )}
                
                {proposal.onChainVotingUrl && (
                  <a
                    href={proposal.onChainVotingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm mt-2"
                  >
                    View on Realms.today →
                  </a>
                )}
              </div>
            </div>
          )}

          {/* WO-143: Vote Counts with Progress Bars */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Voting Results</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-700 font-medium">For</span>
                  <span className="font-semibold">{results.votesFor} votes ({Math.round(forPercentage)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all"
                    style={{ width: `${forPercentage}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-red-700 font-medium">Against</span>
                  <span className="font-semibold">{results.votesAgainst} votes ({Math.round(againstPercentage)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-red-500 h-3 rounded-full transition-all"
                    style={{ width: `${againstPercentage}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-sm text-gray-600 pt-2">
                <span>Total Participation: {results.participationRate}%</span>
                <span>Quorum: {results.quorumMet ? '✓ Met' : '✗ Not Met'} ({proposal.minQuorum}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* WO-143: Voting Interface */}
        {results.isActive && !userVote ? (
          <TokenGatedVotingInterface
            proposalId={proposal.id}
            onVote={handleVote}
            voting={voting}
            timeRemaining={results.timeRemaining}
          />
        ) : userVote ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">Your Vote</h3>
            <p className="text-gray-700">
              You voted <strong>{userVote.support ? 'FOR' : 'AGAINST'}</strong> this proposal
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Voted on {new Date(userVote.createdAt).toLocaleString()}
            </p>
          </div>
        ) : (
          <div className="bg-gray-100 rounded-lg p-6 text-center">
            <p className="text-gray-600">Voting is no longer active for this proposal</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProposalStatusBadge({ status }: { status: string }) {
  const colors = {
    PENDING: 'bg-gray-100 text-gray-800',
    ACTIVE: 'bg-blue-100 text-blue-800',
    PASSED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    EXECUTED: 'bg-purple-100 text-purple-800',
    CANCELLED: 'bg-gray-100 text-gray-600',
    EXPIRED: 'bg-orange-100 text-orange-800',
  };

  return (
    <span className={`px-4 py-2 rounded-full text-sm font-medium ${colors[status as keyof typeof colors]}`}>
      {status}
    </span>
  );
}


