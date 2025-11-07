/**
 * Project Governance Dashboard
 * 
 * WO-152: Centralized project governance view
 * 
 * Features:
 * - Active proposals display
 * - Historical proposals
 * - Voting status
 * - Summary statistics
 * - Filtering & sorting
 * - Real-time updates
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function ProjectGovernanceDashboard() {
  const router = useRouter();
  const { id: projectId } = router.query;
  
  const [proposals, setProposals] = useState<any[]>([]);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!projectId) return;
    
    fetchData();
    
    // WO-152: Real-time updates (poll every 10 seconds)
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [projectId, filter]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);

      const [proposalsRes, resultsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/governance/proposals?${params}`),
        fetch(`/api/projects/${projectId}/governance/results`),
      ]);

      const proposalsData = await proposalsRes.json();
      const resultsData = await resultsRes.json();

      if (proposalsData.success) setProposals(proposalsData.proposals);
      if (resultsData.success) setResults(resultsData.results);
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch governance data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading governance dashboard...</div>;
  }

  // WO-152: Calculate summary statistics
  const stats = {
    totalProposals: results?.length || 0,
    active: proposals.filter((p: any) => p.status === 'ACTIVE').length,
    passed: results?.filter((r: any) => r.status === 'PASSED').length || 0,
    successRate: results?.length > 0
      ? Math.round((results.filter((r: any) => r.votingResults.outcome === 'PASSED').length / results.length) * 100)
      : 0,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Project Governance</h1>
          
          <button
            onClick={() => router.push(`/projects/${projectId}/governance/create-proposal`)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Proposal
          </button>
        </div>

        {/* WO-152: Summary Statistics */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <StatCard title="Total Proposals" value={stats.totalProposals} color="blue" />
          <StatCard title="Active" value={stats.active} color="green" />
          <StatCard title="Passed" value={stats.passed} color="purple" />
          <StatCard title="Success Rate" value={`${stats.successRate}%`} color="orange" />
        </div>

        {/* WO-152: Filtering */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-2">
            {['all', 'active', 'passed', 'failed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded ${
                  filter === status ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* WO-152: Active Proposals */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Proposals</h2>
          
          {proposals.length > 0 ? (
            <div className="space-y-3">
              {proposals.map((proposal: any) => (
                <div
                  key={proposal.id}
                  onClick={() => router.push(`/governance/proposals/${proposal.id}`)}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{proposal.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{proposal.description.substring(0, 100)}...</p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm ${
                      proposal.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' :
                      proposal.status === 'PASSED' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {proposal.status}
                    </span>
                  </div>
                  
                  <div className="flex gap-4 mt-3 text-sm">
                    <span className="text-green-600">✓ {proposal.voteStats.votesFor}</span>
                    <span className="text-red-600">✗ {proposal.voteStats.votesAgainst}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No proposals found</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: string | number; color: string }) {
  const bgColors = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    purple: 'bg-purple-100',
    orange: 'bg-orange-100',
  };

  return (
    <div className={`${bgColors[color as keyof typeof bgColors]} rounded-lg p-6`}>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}


