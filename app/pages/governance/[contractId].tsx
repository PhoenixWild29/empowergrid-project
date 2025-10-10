/**
 * Contract Governance Dashboard
 * 
 * WO-112: Comprehensive governance with analytics and voting
 * 
 * Features:
 * - Contract health metrics
 * - Stakeholder activity summaries
 * - Administrative analytics with charts
 * - Parameter change proposals
 * - Stakeholder voting system
 * - Governance workflow management
 * - Detailed reporting capabilities
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import ContractHealthMetrics from '../../components/governance/ContractHealthMetrics';
import StakeholderActivitySummary from '../../components/governance/StakeholderActivitySummary';
import AdministrativeAnalytics from '../../components/governance/AdministrativeAnalytics';
import ParameterChangeProposalInterface from '../../components/governance/ParameterChangeProposalInterface';
import StakeholderVotingSystem from '../../components/governance/StakeholderVotingSystem';
import GovernanceWorkflowManagement from '../../components/governance/GovernanceWorkflowManagement';

export default function ContractGovernanceDashboard() {
  const router = useRouter();
  const { contractId } = router.query;
  const { user } = useAuth();

  const [governanceData, setGovernanceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'proposals' | 'voting' | 'workflows'>('overview');

  // WO-112: Fetch governance data
  useEffect(() => {
    async function fetchGovernanceData() {
      if (!contractId) return;

      try {
        const response = await fetch(`/api/escrow/contracts/${contractId}/administration`);
        const data = await response.json();

        if (data.success) {
          setGovernanceData(data.data);
        }
      } catch (error) {
        console.error('[WO-112] Failed to fetch governance data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchGovernanceData();
  }, [contractId]);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading governance dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Contract Governance Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Comprehensive contract oversight and stakeholder management
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'analytics', label: 'Analytics' },
                  { id: 'proposals', label: 'Proposals' },
                  { id: 'voting', label: 'Voting' },
                  { id: 'workflows', label: 'Workflows' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={'px-6 py-4 text-sm font-medium ' + (
                      activeTab === tab.id
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* WO-112: Overview Tab */}
              {activeTab === 'overview' && governanceData && (
                <div className="space-y-6">
                  <ContractHealthMetrics
                    contractId={contractId as string}
                    governanceData={governanceData}
                  />
                  <StakeholderActivitySummary
                    contractId={contractId as string}
                    governanceData={governanceData}
                  />
                </div>
              )}

              {/* WO-112: Analytics Tab */}
              {activeTab === 'analytics' && (
                <AdministrativeAnalytics
                  contractId={contractId as string}
                  governanceData={governanceData}
                />
              )}

              {/* WO-112: Proposals Tab */}
              {activeTab === 'proposals' && (
                <ParameterChangeProposalInterface
                  contractId={contractId as string}
                />
              )}

              {/* WO-112: Voting Tab */}
              {activeTab === 'voting' && (
                <StakeholderVotingSystem
                  contractId={contractId as string}
                />
              )}

              {/* WO-112: Workflows Tab */}
              {activeTab === 'workflows' && governanceData && (
                <GovernanceWorkflowManagement
                  contractId={contractId as string}
                  workflows={governanceData.approvalWorkflows}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}



