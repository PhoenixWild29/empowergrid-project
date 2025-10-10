/**
 * Contract Administration Panel
 * 
 * WO-94: Contract administration with parameter modification workflows
 * 
 * Features:
 * - Current contract parameters display
 * - Modification history
 * - Administrative controls
 * - Multi-signature coordination
 * - Stakeholder approval workflows
 * - Role-based access control
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../../components/Layout';
import { useAuth } from '../../../../contexts/AuthContext';
import ParameterModificationWizard from '../../../../components/admin/ParameterModificationWizard';
import MultiSignatureCoordination from '../../../../components/admin/MultiSignatureCoordination';
import StakeholderApprovalWorkflow from '../../../../components/admin/StakeholderApprovalWorkflow';

export default function ContractAdministrationPanel() {
  const router = useRouter();
  const { contractId } = router.query;
  const { user } = useAuth();

  const [administrationData, setAdministrationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'approvals' | 'signatures'>('overview');

  // WO-94: Fetch administration data
  useEffect(() => {
    async function fetchAdministrationData() {
      if (!contractId) return;

      try {
        const response = await fetch(`/api/escrow/contracts/${contractId}/administration`);
        const data = await response.json();

        if (data.success) {
          setAdministrationData(data.data);
        } else {
          setError(data.message || 'Failed to load administration data');
        }
      } catch (error) {
        console.error('[WO-94] Failed to fetch administration data:', error);
        setError('Failed to load administration data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAdministrationData();
  }, [contractId]);

  // WO-94: Role-based access control
  const isAuthorized = administrationData && (
    administrationData.signatureRequirements.authorizedSigners.includes(user?.walletAddress)
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading administration panel...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !isAuthorized) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
            <p className="text-gray-700">
              {error || 'You do not have permission to access this administration panel.'}
            </p>
            <button
              onClick={() => router.push('/escrow/dashboard')}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* WO-94: Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Contract Administration</h1>
            <p className="mt-2 text-gray-600">
              Manage contract parameters and monitor administrative activities
            </p>
            <div className="mt-2 text-sm text-gray-500">
              Contract ID: <span className="font-mono">{contractId}</span>
            </div>
          </div>

          {/* WO-94: Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Total Signers</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">
                {administrationData.signatureRequirements.totalSigners}
              </div>
              <div className="mt-1 text-sm text-gray-600">
                {administrationData.signatureRequirements.requiredSignatures} required
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Pending Modifications</div>
              <div className="mt-2 text-3xl font-bold text-yellow-600">
                {administrationData.modificationTracking.pendingModifications}
              </div>
              <div className="mt-1 text-sm text-gray-600">
                Awaiting approval
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Admin Actions</div>
              <div className="mt-2 text-3xl font-bold text-blue-600">
                {administrationData.metadata.adminActionCount}
              </div>
              <div className="mt-1 text-sm text-gray-600">
                Total modifications
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Security Level</div>
              <div className="mt-2 text-3xl font-bold text-green-600">
                {administrationData.metadata.securityLevel}
              </div>
              <div className="mt-1 text-sm text-gray-600">
                {administrationData.metadata.contractAge} days old
              </div>
            </div>
          </div>

          {/* WO-94: Action Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowWizard(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              📝 Modify Contract Parameters
            </button>
          </div>

          {/* WO-94: Tab Navigation */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-4 text-sm font-medium ${
                    activeTab === 'overview'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-6 py-4 text-sm font-medium ${
                    activeTab === 'history'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Modification History
                </button>
                <button
                  onClick={() => setActiveTab('approvals')}
                  className={`px-6 py-4 text-sm font-medium ${
                    activeTab === 'approvals'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Pending Approvals
                </button>
                <button
                  onClick={() => setActiveTab('signatures')}
                  className={`px-6 py-4 text-sm font-medium ${
                    activeTab === 'signatures'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Signatures
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* WO-94: Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Parameters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-gray-200 rounded p-4">
                        <div className="text-sm text-gray-500">Governance Model</div>
                        <div className="text-lg font-medium text-gray-900">
                          {administrationData.governanceInfo.governanceModel}
                        </div>
                      </div>
                      <div className="border border-gray-200 rounded p-4">
                        <div className="text-sm text-gray-500">Voting Threshold</div>
                        <div className="text-lg font-medium text-gray-900">
                          {administrationData.governanceInfo.votingThreshold} signatures
                        </div>
                      </div>
                      <div className="border border-gray-200 rounded p-4">
                        <div className="text-sm text-gray-500">Stakeholders</div>
                        <div className="text-lg font-medium text-gray-900">
                          {administrationData.governanceInfo.stakeholders.length}
                        </div>
                      </div>
                      <div className="border border-gray-200 rounded p-4">
                        <div className="text-sm text-gray-500">Execution Delay</div>
                        <div className="text-lg font-medium text-gray-900">
                          {administrationData.governanceInfo.executionDelay}s
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stakeholders List */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Stakeholders</h3>
                    <div className="space-y-2">
                      {administrationData.governanceInfo.stakeholders.map((stakeholder: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              stakeholder.role === 'CREATOR' ? 'bg-purple-100 text-purple-600' :
                              stakeholder.role === 'FUNDER' ? 'bg-green-100 text-green-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {stakeholder.role.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {stakeholder.address.slice(0, 8)}...{stakeholder.address.slice(-6)}
                              </div>
                              <div className="text-xs text-gray-500">{stakeholder.role}</div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            Voting Power: {stakeholder.votingPower}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pending Operations */}
                  {administrationData.pendingOperations.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Operations</h3>
                      <div className="space-y-3">
                        {administrationData.pendingOperations.map((operation: any) => (
                          <div key={operation.id} className="border border-yellow-200 bg-yellow-50 rounded p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">{operation.description}</div>
                                <div className="text-sm text-gray-600 mt-1">
                                  Status: <span className="font-medium">{operation.status}</span>
                                </div>
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(operation.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* WO-94: Modification History Tab */}
              {activeTab === 'history' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Modification History</h3>
                  
                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-sm text-gray-600">Total Changes</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {administrationData.modificationTracking.totalModifications}
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded">
                      <div className="text-sm text-gray-600">Approved</div>
                      <div className="text-2xl font-bold text-green-600">
                        {administrationData.modificationTracking.approvedModifications}
                      </div>
                    </div>
                    <div className="bg-red-50 p-4 rounded">
                      <div className="text-sm text-gray-600">Rejected</div>
                      <div className="text-2xl font-bold text-red-600">
                        {administrationData.modificationTracking.rejectedModifications}
                      </div>
                    </div>
                  </div>

                  {/* History Timeline */}
                  <div className="space-y-4">
                    {administrationData.administrativeHistory.map((entry: any, index: number) => (
                      <div key={entry.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded ${
                                entry.changeType === 'CONTRACT_CREATED' ? 'bg-purple-100 text-purple-800' :
                                entry.changeType === 'PARAMETER_UPDATED' ? 'bg-blue-100 text-blue-800' :
                                entry.changeType === 'MILESTONE_MODIFIED' ? 'bg-green-100 text-green-800' :
                                entry.changeType === 'EMERGENCY_ACTION' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {entry.changeType.replace(/_/g, ' ')}
                              </span>
                              <span className="text-sm font-medium text-gray-900">{entry.action}</span>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">{entry.details}</p>
                            <div className="mt-2 text-xs text-gray-500">
                              By: {entry.authorizedBy.slice(0, 12)}... • {new Date(entry.timestamp).toLocaleString()}
                            </div>
                          </div>
                          
                          {/* Show before/after states if available */}
                          {(entry.beforeState || entry.afterState) && (
                            <button className="text-blue-600 text-sm hover:underline">
                              View Details
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WO-94: Approvals Tab */}
              {activeTab === 'approvals' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Approvals</h3>
                  
                  {administrationData.pendingModifications.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      No pending approvals
                    </div>
                  ) : (
                    <StakeholderApprovalWorkflow
                      contractId={contractId as string}
                      pendingModifications={administrationData.pendingModifications}
                      approvalWorkflows={administrationData.approvalWorkflows}
                    />
                  )}
                </div>
              )}

              {/* WO-94: Signatures Tab */}
              {activeTab === 'signatures' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Multi-Signature Status</h3>
                  <MultiSignatureCoordination
                    contractId={contractId as string}
                    signatureRequirements={administrationData.signatureRequirements}
                    pendingModifications={administrationData.pendingModifications}
                  />
                </div>
              )}
            </div>
          </div>

          {/* WO-94: Parameter Modification Wizard Modal */}
          {showWizard && (
            <ParameterModificationWizard
              contractId={contractId as string}
              onClose={() => setShowWizard(false)}
              onSuccess={() => {
                setShowWizard(false);
                // Reload administration data
                window.location.reload();
              }}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}



