/**
 * Proposal List View
 * 
 * WO-138: Browse and discover governance proposals
 * 
 * Features:
 * - Paginated proposal list (20 per page)
 * - Filter by status
 * - Sort by date/votes/status
 * - Loading & error states
 * - Empty state
 * - Clickable items
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface Proposal {
  id: string;
  title: string;
  description: string;
  status: string;
  proposer: {
    username: string;
  };
  voteStats: {
    votesFor: number;
    votesAgainst: number;
    totalVotes: number;
  };
  createdAt: string;
  votingEndsAt: string;
}

export default function ProposalListView() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // WO-138: Filters and pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');

  useEffect(() => {
    fetchProposals();
  }, [page, statusFilter, sortBy]);

  const fetchProposals = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder: 'desc',
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter.toUpperCase());
      }

      const response = await fetch(`/api/governance/proposals?${params}`);
      const data = await response.json();

      if (data.success) {
        setProposals(data.proposals);
        setTotalPages(data.pagination.totalPages);
      } else {
        setError('Failed to load proposals');
      }
    } catch (err) {
      setError('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  // WO-138: Loading state
  if (loading && proposals.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading proposals...</p>
        </div>
      </div>
    );
  }

  // WO-138: Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchProposals}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Governance Proposals</h1>
          
          <button
            onClick={() => router.push('/governance/proposals/create')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Proposal
          </button>
        </div>

        {/* WO-138: Filters and Sort */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="all">All Proposals</option>
                <option value="active">Active</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="executed">Executed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="createdAt">Creation Date</option>
                <option value="votingEndsAt">Voting Deadline</option>
              </select>
            </div>
          </div>
        </div>

        {/* WO-138: Empty state */}
        {proposals.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No proposals found matching your filters</p>
            <button
              onClick={() => {
                setStatusFilter('all');
                setSortBy('createdAt');
                setPage(1);
              }}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* WO-138: Proposal list */}
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <ProposalListItem
                  key={proposal.id}
                  proposal={proposal}
                  onClick={() => router.push(`/governance/proposals/${proposal.id}`)}
                />
              ))}
            </div>

            {/* WO-138: Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                
                <span className="px-4 py-2">
                  Page {page} of {totalPages}
                </span>
                
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// WO-138: Clickable proposal item
function ProposalListItem({ proposal, onClick }: { proposal: Proposal; onClick: () => void }) {
  const statusColors = {
    PENDING: 'bg-gray-100 text-gray-800',
    ACTIVE: 'bg-blue-100 text-blue-800',
    PASSED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    EXECUTED: 'bg-purple-100 text-purple-800',
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-semibold text-gray-900">{proposal.title}</h3>
        <span className={`px-3 py-1 rounded-full text-sm ${statusColors[proposal.status as keyof typeof statusColors]}`}>
          {proposal.status}
        </span>
      </div>
      
      <p className="text-gray-600 mb-4 line-clamp-2">{proposal.description}</p>
      
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>By {proposal.proposer.username}</span>
        
        <div className="flex gap-4">
          <span className="text-green-600">✓ {proposal.voteStats.votesFor}</span>
          <span className="text-red-600">✗ {proposal.voteStats.votesAgainst}</span>
          
          {proposal.votingEndsAt && (
            <span>
              Ends: {new Date(proposal.votingEndsAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}



