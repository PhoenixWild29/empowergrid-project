/**
 * Signature Collection Interface
 * 
 * WO-107: Multi-signature workflow management with real-time tracking
 * 
 * Features:
 * - Pending signature requests display
 * - Real-time approval status updates
 * - Signature verification details
 * - Time-locked operation tracking
 * - Stakeholder communication
 * - Approval workflow history
 */

import React, { useState, useEffect } from 'react';
import { useRealtime } from '../../contexts/RealtimeContext';
import SignatureVerificationModal from './SignatureVerificationModal';
import TimeLockedOperationDisplay from './TimeLockedOperationDisplay';
import ApprovalWorkflowHistory from './ApprovalWorkflowHistory';

interface SignatureCollectionInterfaceProps {
  contractId: string;
}

export default function SignatureCollectionInterface({ contractId }: SignatureCollectionInterfaceProps) {
  const { subscribe } = useRealtime();
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // WO-107: Fetch pending signature requests
  useEffect(() => {
    async function fetchPendingRequests() {
      try {
        const response = await fetch(`/api/escrow/contracts/${contractId}/administration`);
        const data = await response.json();

        if (data.success) {
          setPendingRequests(data.data.pendingModifications || []);
        }
      } catch (error) {
        console.error('[WO-107] Failed to fetch pending requests:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPendingRequests();
  }, [contractId]);

  // WO-107: Real-time signature updates via WebSocket
  useEffect(() => {
    if (!contractId) return;

    // Subscribe to contract updates
    const unsubscribe = subscribe('contract:updated' as any, (event: any) => {
      if (event.contractId === contractId && event.type === 'signature:collected') {
        console.log('[WO-107] Signature collected:', event);
        
        // Update pending requests
        setPendingRequests(prev => 
          prev.map(req =>
            req.id === event.requestId
              ? {
                  ...req,
                  currentApprovals: event.currentApprovals,
                  approvers: [...req.approvers, event.signer],
                  status: event.status,
                }
              : req
          )
        );
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [contractId, subscribe]);

  // WO-107: Sign request
  const handleSign = async (requestId: string) => {
    try {
      // Would trigger wallet signature in production
      console.log('[WO-107] Signing request:', requestId);
      alert('Wallet signature would be requested here');
    } catch (error) {
      console.error('[WO-107] Signature error:', error);
      alert('Failed to sign request');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading signature requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* WO-107: Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Multi-Signature Requests</h2>
        <p className="mt-2 text-gray-600">
          Review and sign pending multi-signature requests
        </p>
      </div>

      {/* WO-107: Pending Requests */}
      {pendingRequests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-gray-400 text-5xl mb-4">✓</div>
          <p className="text-gray-600">No pending signature requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request) => {
            const progress = (request.currentApprovals / request.requiredApprovals) * 100;
            const isComplete = request.currentApprovals >= request.requiredApprovals;

            return (
              <div key={request.id} className="bg-white rounded-lg shadow border border-gray-200">
                <div className="p-6">
                  {/* Request Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={'px-3 py-1 text-xs font-medium rounded-full ' + (
                          isComplete ? 'bg-green-100 text-green-800' :
                          request.currentApprovals > 0 ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        )}>
                          {isComplete ? 'Completed' : 
                           request.currentApprovals > 0 ? 'In Progress' : 'Pending'}
                        </span>
                        <span className={'px-2 py-1 text-xs font-medium rounded ' + (
                          request.type === 'PARAMETER_UPDATE' ? 'bg-blue-100 text-blue-800' :
                          request.type === 'EMERGENCY_RELEASE' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        )}>
                          {request.type}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.description}
                      </h3>

                      <p className="text-sm text-gray-600 mt-2">
                        Proposed by: {request.proposedBy.slice(0, 16)}...
                      </p>
                    </div>

                    {/* Expiration */}
                    {request.expiresAt && (
                      <div className="text-right text-sm">
                        <div className="text-gray-600">Expires</div>
                        <div className="font-medium text-gray-900">
                          {new Date(request.expiresAt).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* WO-107: Approval Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Signature Progress</span>
                      <span className="font-medium text-gray-900">
                        {request.currentApprovals}/{request.requiredApprovals} signatures
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={'h-3 rounded-full transition-all duration-500 ' + (
                          progress === 100 ? 'bg-green-600' :
                          progress >= 50 ? 'bg-blue-600' :
                          'bg-yellow-600'
                        )}
                        style={{ width: progress + '%' }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {Math.round(progress)}% complete
                    </div>
                  </div>

                  {/* WO-107: Required Signers */}
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Required Signers ({request.requiredApprovals})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {request.approvers && request.approvers.map((approver: string, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-50 border border-green-200 rounded-full"
                        >
                          <span className="text-green-600">✓</span>
                          <span className="text-xs font-mono text-green-800">
                            {approver.slice(0, 8)}...
                          </span>
                        </div>
                      ))}
                      {Array.from({ length: Math.max(0, request.requiredApprovals - (request.approvers?.length || 0)) }).map((_, idx) => (
                        <div
                          key={'pending-' + idx}
                          className="px-3 py-1 bg-gray-100 border border-gray-300 rounded-full"
                        >
                          <span className="text-xs text-gray-500">Awaiting</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* WO-107: Actions */}
                  <div className="flex items-center space-x-3">
                    {!isComplete && (
                      <button
                        onClick={() => handleSign(request.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        Sign Request
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowVerificationModal(true);
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm"
                    >
                      View Details
                    </button>

                    {request.timeLockId && (
                      <TimeLockedOperationDisplay
                        timeLockId={request.timeLockId}
                        compact
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* WO-107: Approval Workflow History */}
      <ApprovalWorkflowHistory contractId={contractId} />

      {/* WO-107: Signature Verification Modal */}
      {showVerificationModal && selectedRequest && (
        <SignatureVerificationModal
          request={selectedRequest}
          onClose={() => {
            setShowVerificationModal(false);
            setSelectedRequest(null);
          }}
        />
      )}
    </div>
  );
}



