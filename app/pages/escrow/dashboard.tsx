/**
 * Escrow Dashboard Page
 * 
 * WO-85: Escrow Dashboard with Role-Based Views
 * 
 * Features:
 * - Display all active escrow contracts
 * - Role-based views (creator vs funder)
 * - Real-time updates
 * - Summary statistics
 * - Responsive design
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtime } from '../../contexts/RealtimeContext';

export default function EscrowDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { subscribe } = useRealtime();
  
  const [contracts, setContracts] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<'creator' | 'funder' | 'both'>('both');
  const [isLoading, setIsLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    totalContracts: 0,
    activeFunding: 0,
    completedMilestones: 0,
    pendingReleases: 0,
  });

  // WO-85: Fetch user's escrow contracts
  useEffect(() => {
    async function fetchContracts() {
      if (!user) return;
      
      try {
        const response = await fetch('/api/escrow/user/contracts');
        const data = await response.json();
        
        if (data.success) {
          setContracts(data.contracts || []);
          setUserRole(data.userRole || 'both');
          setStatistics(data.statistics || statistics);
        }
      } catch (error) {
        console.error('[WO-85] Failed to fetch contracts:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchContracts();
  }, [user]);

  // WO-85: Subscribe to real-time contract updates
  useEffect(() => {
    const unsubscribe = subscribe('project:funded' as any, (data) => {
      // Update contract in list
      setContracts(prev =>
        prev.map(contract =>
          contract.id === data.contractId
            ? { ...contract, ...data.updates }
            : contract
        )
      );
      
      // Update statistics if needed
      if (data.statisticsUpdate) {
        setStatistics(prev => ({ ...prev, ...data.statisticsUpdate }));
      }
    });

    return unsubscribe;
  }, [subscribe]);

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-yellow-900 mb-2">Authentication Required</h2>
            <p className="text-yellow-700 mb-4">Please connect your wallet to view your escrow dashboard.</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Escrow Dashboard</h1>
          <p className="text-gray-600">
            Manage your escrow contracts and milestone-based payments
          </p>
        </div>

        {/* WO-85: Summary Statistics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Contracts"
            value={statistics.totalContracts}
            icon="📋"
            color="blue"
          />
          <StatCard
            title="Active Funding"
            value={`$${statistics.activeFunding.toLocaleString()}`}
            icon="💰"
            color="green"
          />
          <StatCard
            title="Completed Milestones"
            value={statistics.completedMilestones}
            icon="✓"
            color="purple"
          />
          <StatCard
            title="Pending Releases"
            value={statistics.pendingReleases}
            icon="⏳"
            color="orange"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => router.push('/escrow/create')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            + Create New Contract
          </button>
          <button
            onClick={() => router.push('/projects')}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Browse Projects
          </button>
        </div>

        {/* WO-85: Role-Based Contract Display */}
        {contracts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Contracts Yet</h3>
            <p className="text-gray-600 mb-6">
              {userRole === 'creator' 
                ? "Create your first escrow contract to start accepting milestone-based funding."
                : "Browse projects and fund escrow contracts to get started."}
            </p>
            <button
              onClick={() => router.push(userRole === 'creator' ? '/escrow/create' : '/projects')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              {userRole === 'creator' ? 'Create Contract' : 'Browse Projects'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Creator Contracts */}
            {contracts.filter(c => c.isCreator).length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>👤</span> Your Contracts (Creator)
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {contracts
                    .filter(c => c.isCreator)
                    .map(contract => (
                      <ContractCard
                        key={contract.id}
                        contract={contract}
                        viewType="creator"
                        onClick={() => router.push(`/escrow/${contract.contractId}`)}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Funder Contracts */}
            {contracts.filter(c => !c.isCreator).length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>💼</span> Your Investments (Funder)
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {contracts
                    .filter(c => !c.isCreator)
                    .map(contract => (
                      <ContractCard
                        key={contract.id}
                        contract={contract}
                        viewType="funder"
                        onClick={() => router.push(`/escrow/${contract.contractId}`)}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

/**
 * WO-85: Statistics Card Component
 */
function StatCard({ title, value, icon, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className={`text-xs font-medium px-2 py-1 rounded ${colorClasses[color as keyof typeof colorClasses]}`}>
          Live
        </span>
      </div>
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

/**
 * WO-85: Contract Card Component with Role-Based Display
 */
function ContractCard({ contract, viewType, onClick }: any) {
  const fundingProgress = (contract.currentBalance / contract.fundingTarget) * 100;
  const milestoneProgress = contract.milestones
    ? (contract.milestones.filter((m: any) => m.status === 'RELEASED').length / contract.milestones.length) * 100
    : 0;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {contract.project?.title || 'Untitled Project'}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-mono">{contract.contractId.slice(0, 12)}...</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              contract.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
              contract.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {contract.status}
            </span>
          </div>
        </div>
      </div>

      {/* WO-85: Role-Specific Information */}
      {viewType === 'creator' ? (
        <>
          {/* Creator View */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Funding Progress</span>
                <span>${contract.currentBalance.toLocaleString()} / ${contract.fundingTarget.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(fundingProgress, 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Milestones Completed</span>
                <span>{contract.completedMilestones || 0} / {contract.totalMilestones || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(milestoneProgress, 100)}%` }}
                ></div>
              </div>
            </div>

            {contract.alerts && contract.alerts.length > 0 && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                ⚠️ {contract.alerts[0]}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Funder View */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <div>
                <div className="text-sm text-gray-600">Your Investment</div>
                <div className="text-xl font-bold text-gray-900">
                  ${contract.yourInvestment?.toLocaleString() || '0'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Expected Return</div>
                <div className="text-xl font-bold text-green-600">
                  +{((contract.yourInvestment || 0) * 0.12).toFixed(0)}%
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">Next Release</div>
              <div className="text-sm font-medium text-gray-900">
                {contract.nextRelease 
                  ? `$${contract.nextRelease.amount.toLocaleString()} on ${new Date(contract.nextRelease.date).toLocaleDateString()}`
                  : 'No scheduled releases'}
              </div>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-gray-900">
                {fundingProgress >= 100 ? 'Fully Funded' : `${fundingProgress.toFixed(0)}% Funded`}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-sm">
        <span className="text-gray-600">
          Created {new Date(contract.createdAt).toLocaleDateString()}
        </span>
        <span className="text-blue-600 font-medium hover:text-blue-700">
          View Details →
        </span>
      </div>
    </div>
  );
}

