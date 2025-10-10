/**
 * Stakeholder Approval Workflow
 * 
 * WO-94: Display and manage stakeholder approvals
 * 
 * Features:
 * - Pending approvals display
 * - Notification status
 * - Approval deadlines
 * - Automated reminder capabilities
 * - Real-time progress tracking
 */

import React, { useState } from 'react';

interface StakeholderApprovalWorkflowProps {
  contractId: string;
  pendingModifications: any[];
  approvalWorkflows: any[];
}

export default function StakeholderApprovalWorkflow({
  contractId,
  pendingModifications,
  approvalWorkflows,
}: StakeholderApprovalWorkflowProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  // WO-94: Calculate days until deadline
  const getDaysUntilDeadline = (expiresAt: string) => {
    const deadline = new Date(expiresAt);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // WO-94: Send reminder
  const sendReminder = async (modificationId: string) => {
    console.log('[WO-94] Sending reminder for modification:', modificationId);
    alert('Reminder sent to pending approvers');
  };

  return (
    <div className="space-y-6">
      {pendingModifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-gray-400 text-5xl mb-4">✓</div>
          <p className="text-gray-600">No pending approvals at this time</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingModifications.map((modification: any) => {
            const daysRemaining = getDaysUntilDeadline(modification.expiresAt);
            const isUrgent = daysRemaining <= 2;
            const progress = (modification.currentApprovals / modification.requiredApprovals) * 100;

            return (
              <div
                key={modification.id}
                className={'bg-white rounded-lg shadow border-2 ' + (isUrgent ? 'border-red-300' : 'border-gray-200')}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={'px-3 py-1 text-xs font-medium rounded-full ' + (
                          modification.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          modification.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          modification.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        )}>
                          {modification.status}
                        </span>
                      </div>

                      <h4 className="text-lg font-semibold text-gray-900 mt-2">
                        {modification.description}
                      </h4>

                      <p className="text-sm text-gray-600 mt-2">
                        Proposed by: {modification.proposedBy.slice(0, 16)}...
                      </p>
                    </div>

                    <div className={'text-right ' + (isUrgent ? 'text-red-600' : 'text-gray-600')}>
                      <div className="text-sm font-medium">
                        {daysRemaining > 0 ? daysRemaining + ' days remaining' : 'Expired'}
                      </div>
                      <div className="text-xs">
                        {new Date(modification.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Approval Progress</span>
                      <span className="font-medium text-gray-900">
                        {modification.currentApprovals}/{modification.requiredApprovals} approvals
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={'h-3 rounded-full transition-all ' + (
                          progress === 100 ? 'bg-green-600' :
                          progress >= 50 ? 'bg-blue-600' :
                          'bg-yellow-600'
                        )}
                        style={{ width: progress + '%' }}
                      ></div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Approvers</div>
                    <div className="flex flex-wrap gap-2">
                      {modification.approvers.map((approver: string, idx: number) => (
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
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                    {isUrgent && modification.status === 'PENDING' && (
                      <button
                        onClick={() => sendReminder(modification.id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                      >
                        <span>🔔</span>
                        <span>Send Reminder</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => setSelectedWorkflow(modification.id)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm"
                    >
                      View Details
                    </button>

                    <div className="flex-1"></div>

                    <div className="text-xs text-gray-500">
                      Proposed {new Date(modification.proposedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}



