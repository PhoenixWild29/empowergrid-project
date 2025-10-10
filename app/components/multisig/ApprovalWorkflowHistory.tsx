/**
 * Approval Workflow History
 * 
 * WO-107: Complete signature collection timeline
 */

import React, { useState, useEffect } from 'react';

interface ApprovalWorkflowHistoryProps {
  contractId: string;
}

export default function ApprovalWorkflowHistory({ contractId }: ApprovalWorkflowHistoryProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // WO-107: Fetch approval history
  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch(`/api/escrow/contracts/${contractId}/administration?limit=20`);
        const data = await response.json();

        if (data.success) {
          setHistory(data.data.administrativeHistory || []);
        }
      } catch (error) {
        console.error('[WO-107] Failed to fetch history:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchHistory();
  }, [contractId]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval History</h3>
        <div className="text-center py-8 text-gray-500">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval Workflow History</h3>

      {history.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No approval history</div>
      ) : (
        <div className="space-y-4">
          {history.map((entry, index) => (
            <div key={entry.id || index} className="flex items-start space-x-4 pb-4 border-b border-gray-200 last:border-0">
              {/* Timeline Dot */}
              <div className="flex flex-col items-center">
                <div className={'w-10 h-10 rounded-full flex items-center justify-center ' + (
                  entry.changeType === 'CONTRACT_CREATED' ? 'bg-purple-100 text-purple-600' :
                  entry.changeType === 'PARAMETER_UPDATED' ? 'bg-blue-100 text-blue-600' :
                  entry.changeType === 'EMERGENCY_ACTION' ? 'bg-red-100 text-red-600' :
                  'bg-gray-100 text-gray-600'
                )}>
                  {entry.changeType === 'CONTRACT_CREATED' ? '🎉' :
                   entry.changeType === 'PARAMETER_UPDATED' ? '📝' :
                   entry.changeType === 'EMERGENCY_ACTION' ? '🚨' :
                   entry.changeType === 'STATUS_CHANGED' ? '🔄' :
                   '✓'}
                </div>
                {index < history.length - 1 && (
                  <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                )}
              </div>

              {/* Event Details */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{entry.action}</h4>
                    <p className="text-sm text-gray-600 mt-1">{entry.details}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      By: {entry.authorizedBy.slice(0, 16)}...
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(entry.timestamp).toLocaleString()}
                  </div>
                </div>

                {/* Before/After States */}
                {(entry.beforeState || entry.afterState) && (
                  <details className="mt-3">
                    <summary className="text-sm text-blue-600 cursor-pointer hover:underline">
                      View state changes
                    </summary>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      {entry.beforeState && (
                        <div>
                          <div className="text-xs font-medium text-gray-700 mb-1">Before</div>
                          <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto">
                            {JSON.stringify(entry.beforeState, null, 2)}
                          </pre>
                        </div>
                      )}
                      {entry.afterState && (
                        <div>
                          <div className="text-xs font-medium text-gray-700 mb-1">After</div>
                          <pre className="bg-green-50 rounded p-2 text-xs overflow-x-auto">
                            {JSON.stringify(entry.afterState, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



