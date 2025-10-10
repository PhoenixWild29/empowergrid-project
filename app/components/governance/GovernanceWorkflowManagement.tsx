/**
 * Governance Workflow Management
 * 
 * WO-112: Track proposal lifecycle with status indicators
 */

import React from 'react';

interface GovernanceWorkflowManagementProps {
  contractId: string;
  workflows: any[];
}

export default function GovernanceWorkflowManagement({ contractId, workflows }: GovernanceWorkflowManagementProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Governance Workflows</h3>

      {workflows && workflows.length > 0 ? (
        <div className="space-y-6">
          {workflows.map((workflow) => (
            <div key={workflow.workflowId} className="bg-white rounded-lg border border-gray-200 p-6">
              {/* Workflow Header */}
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">{workflow.workflowType}</h4>
                <span className="text-sm text-gray-600">
                  Stage {workflow.completedStages}/{workflow.totalStages}
                </span>
              </div>

              {/* Stage Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  {Array.from({ length: workflow.totalStages }).map((_, idx) => (
                    <React.Fragment key={idx}>
                      <div className={'w-12 h-12 rounded-full flex items-center justify-center font-bold ' + (
                        idx < workflow.completedStages ? 'bg-green-600 text-white' :
                        idx === workflow.completedStages ? 'bg-blue-600 text-white' :
                        'bg-gray-200 text-gray-600'
                      )}>
                        {idx + 1}
                      </div>
                      {idx < workflow.totalStages - 1 && (
                        <div className={'flex-1 h-1 mx-2 ' + (
                          idx < workflow.completedStages ? 'bg-green-600' : 'bg-gray-200'
                        )}></div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Current Stage: <span className="font-medium">{workflow.currentStage}</span>
                </div>
              </div>

              {/* Approvals */}
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-3">Approvals</div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="text-sm font-medium">
                    {workflow.receivedApprovals}/{workflow.requiredApprovals}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: ((workflow.receivedApprovals / workflow.requiredApprovals) * 100) + '%' }}
                  ></div>
                </div>
              </div>

              {/* Approval History */}
              {workflow.approvalHistory && workflow.approvalHistory.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Approval History</div>
                  <div className="space-y-2">
                    {workflow.approvalHistory.map((approval: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <div className="flex items-center space-x-2">
                          <span className={approval.approved ? 'text-green-600' : 'text-red-600'}>
                            {approval.approved ? '✓' : '✗'}
                          </span>
                          <span className="font-mono text-xs">{approval.approver.slice(0, 12)}...</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(approval.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Proposed</div>
                  <div className="font-medium">{new Date(workflow.deadlines.proposed).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-gray-600">Expires</div>
                  <div className="font-medium">{new Date(workflow.deadlines.expires).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600">No active workflows</p>
        </div>
      )}
    </div>
  );
}



