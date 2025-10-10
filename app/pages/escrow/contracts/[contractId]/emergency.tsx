/**
 * Emergency Control Panel
 * 
 * WO-101: Secure emergency procedure interface with audit trail
 * 
 * Features:
 * - Secure access with multi-factor authentication
 * - Emergency action display with consequences
 * - Multi-step confirmation dialogs
 * - Detailed impact analysis
 * - Real-time notifications
 * - Emergency procedure history
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../../components/Layout';
import { useAuth } from '../../../../contexts/AuthContext';
import EmergencyActionCard from '../../../../components/emergency/EmergencyActionCard';
import EmergencyConfirmationDialog from '../../../../components/emergency/EmergencyConfirmationDialog';
import EmergencyProcedureHistory from '../../../../components/emergency/EmergencyProcedureHistory';

export default function EmergencyControlPanel() {
  const router = useRouter();
  const { contractId } = router.query;
  const { user } = useAuth();

  const [contract, setContract] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [emergencyHistory, setEmergencyHistory] = useState<any[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // WO-101: Fetch contract data and verify authorization
  useEffect(() => {
    async function fetchContractData() {
      if (!contractId) return;

      try {
        const response = await fetch(`/api/escrow/${contractId}`);
        const data = await response.json();

        if (data.success) {
          setContract(data.contract);
          
          // WO-101: Verify elevated permissions
          const adminResponse = await fetch(`/api/escrow/contracts/${contractId}/administration`);
          const adminData = await adminResponse.json();
          
          if (adminData.success) {
            setIsAuthorized(true);
          }
        } else {
          setError('Contract not found');
        }
      } catch (error) {
        console.error('[WO-101] Failed to fetch contract:', error);
        setError('Failed to load contract data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchContractData();
  }, [contractId]);

  // WO-101: Available emergency actions
  const emergencyActions: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    severity: 'HIGH' | 'CRITICAL';
    color: string;
    consequences: string[];
    requiresAmount: boolean;
    requiresRecipient: boolean;
  }> = [
    {
      id: 'PARTIAL_RELEASE',
      title: 'Partial Fund Release',
      description: 'Release specific amount of funds for emergency purposes',
      icon: '💰',
      severity: 'HIGH' as const,
      color: 'yellow',
      consequences: [
        'Specified amount will be released immediately after time-lock',
        'Contract balance will be reduced',
        'All stakeholders will be notified',
        'Action requires multi-signature approval',
      ],
      requiresAmount: true,
      requiresRecipient: true,
    },
    {
      id: 'FULL_RELEASE',
      title: 'Full Fund Release',
      description: 'Release all remaining funds and complete the contract',
      icon: '🏦',
      severity: 'CRITICAL' as const,
      color: 'red',
      consequences: [
        'ALL funds will be released immediately after time-lock',
        'Contract will be marked as COMPLETED',
        'No further operations will be possible',
        'Action requires all signers to approve',
      ],
      requiresAmount: false,
      requiresRecipient: true,
    },
    {
      id: 'CONTRACT_SUSPENSION',
      title: 'Suspend Contract',
      description: 'Emergency stop - suspend all contract operations',
      icon: '⛔',
      severity: 'CRITICAL' as const,
      color: 'red',
      consequences: [
        'Contract will be immediately suspended',
        'No deposits or releases allowed',
        'Status set to EMERGENCY_STOPPED',
        'Can be reversed by authorized parties',
      ],
      requiresAmount: false,
      requiresRecipient: false,
    },
    {
      id: 'DISPUTE_RESOLUTION',
      title: 'Dispute Arbitration Release',
      description: 'Release funds according to dispute arbitration decision',
      icon: '⚖️',
      severity: 'HIGH' as const,
      color: 'purple',
      consequences: [
        'Funds released per arbitration decision',
        'Dispute marked as resolved',
        'Resolution logged permanently',
        'Action requires arbitrator approval',
      ],
      requiresAmount: true,
      requiresRecipient: true,
    },
  ];

  // WO-101: Initiate emergency action
  const handleInitiateAction = (action: any) => {
    setSelectedAction(action);
    setShowConfirmation(true);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading emergency control panel...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthorized || error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
            <div className="text-red-600 text-6xl text-center mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-red-600 mb-4 text-center">Access Denied</h2>
            <p className="text-gray-700 text-center">
              {error || 'You do not have elevated permissions to access emergency controls.'}
            </p>
            <button
              onClick={() => router.push('/escrow/dashboard')}
              className="mt-6 w-full bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
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
          {/* WO-101: Security Warning Header */}
          <div className="bg-red-600 text-white p-6 rounded-lg shadow-lg mb-8">
            <div className="flex items-center space-x-4">
              <div className="text-5xl">⚠️</div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold">Emergency Control Panel</h1>
                <p className="mt-2 text-red-100">
                  Critical operations only. All actions are logged and require multi-signature approval.
                </p>
              </div>
            </div>
          </div>

          {/* Contract Summary */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contract Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-gray-600">Contract ID</div>
                <div className="font-mono text-sm font-medium mt-1">{contract.contractId}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Current Balance</div>
                <div className="text-lg font-bold text-gray-900 mt-1">
                  ${contract.currentBalance.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <div className="mt-1">
                  <span className={'px-3 py-1 rounded-full text-sm font-medium ' + (
                    contract.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    contract.status === 'EMERGENCY_STOPPED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  )}>
                    {contract.status}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Required Signatures</div>
                <div className="text-lg font-bold text-gray-900 mt-1">
                  {contract.requiredSignatures || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* WO-101: Emergency Actions Grid */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Emergency Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {emergencyActions.map((action) => (
                <EmergencyActionCard
                  key={action.id}
                  action={action}
                  onInitiate={() => handleInitiateAction(action)}
                />
              ))}
            </div>
          </div>

          {/* WO-101: Emergency Procedure History */}
          <EmergencyProcedureHistory
            contractId={contractId as string}
            history={emergencyHistory}
          />

          {/* WO-101: Confirmation Dialog */}
          {showConfirmation && selectedAction && (
            <EmergencyConfirmationDialog
              action={selectedAction}
              contract={contract}
              onClose={() => {
                setShowConfirmation(false);
                setSelectedAction(null);
              }}
              onConfirm={() => {
                setShowConfirmation(false);
                setSelectedAction(null);
                // Reload contract data
                window.location.reload();
              }}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}



