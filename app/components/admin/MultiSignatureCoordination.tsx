/**
 * Multi-Signature Coordination Interface
 * 
 * WO-94: Multi-signature tracking and approval collection
 * 
 * Features:
 * - Required signatures display
 * - Current approval status
 * - Signature collection
 * - Real-time progress updates
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface MultiSignatureCoordinationProps {
  contractId: string;
  signatureRequirements: {
    currentThreshold: number;
    totalSigners: number;
    requiredSignatures: number;
    authorizedSigners: string[];
    pendingApprovals: number;
  };
  pendingModifications: any[];
}

export default function MultiSignatureCoordination({
  contractId,
  signatureRequirements,
  pendingModifications,
}: MultiSignatureCoordinationProps) {
  const { user } = useAuth();
  const [expandedProposal, setExpandedProposal] = useState<string | null>(null);

  // WO-94: Calculate signature progress
  const getSignatureProgress = (proposal: any) => {
    const percentage = (proposal.currentApprovals / proposal.requiredApprovals) * 100;
    return Math.min(percentage, 100);
  };

  // WO-94: Sign proposal
  const handleSign = async (proposalId: string) => {
    try {
      // In production, this would trigger wallet signature
      const signature = `sig_${Date.now()}`;
      
      // Submit signature to backend
      console.log('[WO-94] Signing proposal:', proposalId);
      alert('Signature functionality would trigger wallet signing');
    } catch (error) {
      console.error('[WO-94] Signature error:', error);
      alert('Failed to sign proposal');
    }
  };

  return (
    <div className="space-y-6">
      {/* WO-94: Signature Requirements Overview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-blue-900 mb-4">Signature Configuration</h4>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-blue-700">Total Signers</div>
            <div className="text-3xl font-bold text-blue-900">
              {signatureRequirements.totalSigners}
            </div>
          </div>
          <div>
            <div className="text-sm text-blue-700">Required Signatures</div>
            <div className="text-3xl font-bold text-blue-900">
              {signatureRequirements.requiredSignatures}
            </div>
          </div>
          <div>
            <div className="text-sm text-blue-700">Pending Approvals</div>
            <div className="text-3xl font-bold text-yellow-600">
              {signatureRequirements.pendingApprovals}
            </div>
          </div>
        </div>
      </div>

      {/* WO-94: Authorized Signers List */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Authorized Signers</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {signatureRequirements.authorizedSigners.map((signer: string, index: number) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="font-mono text-sm text-gray-900">
                  {signer.slice(0, 8)}...{signer.slice(-6)}
                </div>
                {user?.walletAddress?.toString() === signer && (
                  <div className="text-xs text-green-600 font-medium">You</div>
                )}
              </div>
              <div className="text-green-500">✓</div>
            </div>
          ))}
        </div>
      </div>

      {/* WO-94: Pending Modifications Requiring Signatures */}
      {pendingModifications.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Pending Modifications Awaiting Signatures
          </h4>
          <div className="space-y-4">
            {pendingModifications.map((proposal: any) => {
              const progress = getSignatureProgress(proposal);
              const isExpanded = expandedProposal === proposal.id;
              const userWallet = user?.walletAddress?.toString() || '';
              const canSign = signatureRequirements.authorizedSigners.includes(userWallet);

              return (
                <div key={proposal.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            proposal.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            proposal.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {proposal.status}
                          </span>
                          <span className="font-medium text-gray-900">{proposal.description}</span>
                        </div>

                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-600">Approval Progress</span>
                            <span className="font-medium text-gray-900">
                              {proposal.currentApprovals}/{proposal.requiredApprovals} signatures
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                          <span>Proposed: {new Date(proposal.proposedAt).toLocaleString()}</span>
                          {proposal.expiresAt && (
                            <span>Expires: {new Date(proposal.expiresAt).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expand/Collapse Details */}
                    <button
                      onClick={() => setExpandedProposal(isExpanded ? null : proposal.id)}
                      className="mt-4 text-blue-600 text-sm hover:underline"
                    >
                      {isExpanded ? 'Hide Details' : 'Show Details'}
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm font-medium text-gray-700">Proposed By</div>
                            <div className="text-sm text-gray-900 font-mono">
                              {proposal.proposedBy.slice(0, 16)}...
                            </div>
                          </div>

                          <div>
                            <div className="text-sm font-medium text-gray-700">Approvers ({proposal.approvers.length})</div>
                            <div className="mt-2 space-y-1">
                              {proposal.approvers.map((approver: string, idx: number) => (
                                <div key={idx} className="text-sm text-gray-600 font-mono">
                                  ✓ {approver.slice(0, 16)}...
                                </div>
                              ))}
                            </div>
                          </div>

                          {canSign && proposal.status === 'PENDING' && (
                            <button
                              onClick={() => handleSign(proposal.id)}
                              className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                              Sign This Proposal
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No pending modifications */}
      {pendingModifications.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-gray-400 text-5xl mb-4">✓</div>
          <p className="text-gray-600">No pending modifications requiring signatures</p>
        </div>
      )}
    </div>
  );
}



