/**
 * Dispute Resolution Interface
 * 
 * WO-116: Comprehensive dispute management interface
 * 
 * Features:
 * - Dispute details display
 * - Evidence collection
 * - Communication channels
 * - Arbitration workflows
 * - Resolution enforcement
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';

export default function DisputeResolutionPage() {
  const router = useRouter();
  const { disputeId } = router.query;
  const { user } = useAuth();

  const [dispute, setDispute] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEvidenceUpload, setShowEvidenceUpload] = useState(false);
  const [message, setMessage] = useState('');

  // WO-116: Fetch dispute details
  useEffect(() => {
    async function fetchDispute() {
      if (!disputeId) return;

      try {
        const response = await fetch(`/api/disputes/${disputeId}`);
        const data = await response.json();

        if (data.success) {
          setDispute(data.dispute);
        }
      } catch (error) {
        console.error('[WO-116] Failed to fetch dispute:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDispute();
  }, [disputeId]);

  // WO-116: Send message
  const handleSendMessage = async () => {
    if (message.length < 10) {
      alert('Message must be at least 10 characters');
      return;
    }

    try {
      const response = await fetch(`/api/disputes/${disputeId}/communications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          messageType: 'COMMENT',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('');
        // Reload dispute
        window.location.reload();
      }
    } catch (error) {
      console.error('[WO-116] Send message error:', error);
      alert('Failed to send message');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dispute details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!dispute) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Dispute not found</p>
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
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h1 className="text-3xl font-bold text-gray-900">{dispute.title}</h1>
              <span className={'px-3 py-1 text-sm font-medium rounded-full ' + (
                dispute.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' :
                dispute.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                'bg-blue-100 text-blue-800'
              )}>
                {dispute.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Dispute Details */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Dispute Details</h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Type</div>
                    <div className="text-gray-900">{dispute.disputeType.replace(/_/g, ' ')}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Description</div>
                    <div className="text-gray-900">{dispute.description}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-700">Priority</div>
                      <span className={'px-2 py-1 text-xs font-medium rounded ' + (
                        dispute.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                        dispute.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      )}>
                        {dispute.priority}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">Created</div>
                      <div className="text-gray-900 text-sm">{new Date(dispute.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Evidence Section */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Evidence</h2>
                  <button
                    onClick={() => setShowEvidenceUpload(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    + Submit Evidence
                  </button>
                </div>

                {dispute.evidence && dispute.evidence.length > 0 ? (
                  <div className="space-y-3">
                    {dispute.evidence.map((item: any) => (
                      <div key={item.id} className="border border-gray-200 rounded p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{item.fileName}</div>
                            <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                            <div className="text-xs text-gray-500 mt-2">
                              Submitted {new Date(item.createdAt).toLocaleDateString()}
                              {item.verified && <span className="text-green-600 ml-2">✓ Verified</span>}
                            </div>
                          </div>
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            View
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No evidence submitted yet
                  </div>
                )}
              </div>

              {/* Communications */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Communications</h2>
                
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {dispute.communications && dispute.communications.map((comm: any) => (
                    <div key={comm.id} className={'p-4 rounded-lg ' + (
                      comm.senderId === user?.id ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'
                    )}>
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {comm.senderId === user?.id ? 'You' : 'Other Party'}
                      </div>
                      <div className="text-gray-800">{comm.message}</div>
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(comm.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="border-t pt-4">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Type your message..."
                  />
                  <button
                    onClick={handleSendMessage}
                    className="mt-2 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Send Message
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Parties */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Involved Parties</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Initiated By</div>
                    <div className="font-mono text-sm text-gray-900">{dispute.initiatedBy.slice(0, 16)}...</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Respondent</div>
                    <div className="font-mono text-sm text-gray-900">{dispute.respondent.slice(0, 16)}...</div>
                  </div>
                  {dispute.arbitratorId && (
                    <div>
                      <div className="text-sm text-gray-600">Arbitrator</div>
                      <div className="font-mono text-sm text-gray-900">{dispute.arbitratorId.slice(0, 16)}...</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Timeline */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Status Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-600"></div>
                    <div className="text-sm text-gray-600">Created</div>
                  </div>
                  {dispute.status !== 'OPEN' && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      <div className="text-sm text-gray-600">Under Review</div>
                    </div>
                  )}
                  {dispute.resolvedAt && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                      <div className="text-sm text-gray-600">Resolved</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Resolution (if resolved) */}
              {dispute.resolution && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="font-semibold text-green-900 mb-4">Resolution</h3>
                  <div className="text-sm text-green-800">{dispute.resolution}</div>
                  {dispute.fundReleaseAmount && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <div className="text-sm font-medium text-green-900">Fund Release</div>
                      <div className="text-lg font-bold text-green-900">${dispute.fundReleaseAmount.toLocaleString()}</div>
                      <div className="text-xs text-green-700 mt-1">To: {dispute.fundReleaseTo}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}



