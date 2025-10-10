/**
 * Signature Verification Modal
 * 
 * WO-107: Display cryptographic signature details
 */

import React from 'react';

interface SignatureVerificationModalProps {
  request: any;
  onClose: () => void;
}

export default function SignatureVerificationModal({ request, onClose }: SignatureVerificationModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Signature Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Request Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Request Information</h3>
              <div className="bg-gray-50 rounded p-4 space-y-2 text-sm">
                <div><span className="font-medium">Type:</span> {request.type}</div>
                <div><span className="font-medium">Description:</span> {request.description}</div>
                <div><span className="font-medium">Proposed:</span> {new Date(request.proposedAt).toLocaleString()}</div>
                {request.expiresAt && (
                  <div><span className="font-medium">Expires:</span> {new Date(request.expiresAt).toLocaleString()}</div>
                )}
              </div>
            </div>

            {/* Signature Status */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Signature Status</h3>
              <div className="space-y-3">
                {request.approvers && request.approvers.map((approver: string, idx: number) => (
                  <div key={idx} className="border border-green-200 bg-green-50 rounded p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-green-600 text-xl">✓</span>
                        <div>
                          <div className="font-mono text-sm text-gray-900">
                            {approver}
                          </div>
                          <div className="text-xs text-gray-600">Signature Valid</div>
                        </div>
                      </div>
                      <button className="text-blue-600 text-sm hover:underline">
                        Verify Signature
                      </button>
                    </div>
                  </div>
                ))}

                {/* Pending Signatures */}
                {Array.from({ length: Math.max(0, request.requiredApprovals - (request.approvers?.length || 0)) }).map((_, idx) => (
                  <div key={'pending-' + idx} className="border border-gray-200 bg-gray-50 rounded p-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-400 text-xl">○</span>
                      <div>
                        <div className="text-sm text-gray-600">Awaiting signature</div>
                        <div className="text-xs text-gray-500">Pending</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Request Data */}
            {request.data && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Request Data</h3>
                <pre className="bg-gray-900 text-green-400 rounded p-4 text-xs overflow-x-auto font-mono">
                  {JSON.stringify(request.data, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



