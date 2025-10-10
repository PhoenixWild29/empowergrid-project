/**
 * Emergency Procedure History
 * 
 * WO-101: Display past emergency actions with context and outcomes
 */

import React, { useState, useEffect } from 'react';

interface EmergencyProcedureHistoryProps {
  contractId: string;
  history: any[];
}

export default function EmergencyProcedureHistory({
  contractId,
  history: initialHistory,
}: EmergencyProcedureHistoryProps) {
  const [history, setHistory] = useState(initialHistory);
  const [isLoading, setIsLoading] = useState(false);

  // WO-101: Fetch emergency history
  useEffect(() => {
    async function fetchHistory() {
      setIsLoading(true);
      try {
        // Would fetch from API - for now using provided history
        setHistory(initialHistory);
      } catch (error) {
        console.error('[WO-101] Failed to fetch history:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchHistory();
  }, [contractId, initialHistory]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Emergency Procedure History</h2>
        <div className="text-center py-8 text-gray-500">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Emergency Procedure History</h2>

      {history.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-5xl mb-4">📋</div>
          <p>No emergency procedures have been executed on this contract</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((entry: any, index: number) => (
            <div key={entry.id || index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{entry.icon || '🚨'}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{entry.action}</h4>
                      <p className="text-sm text-gray-600">{entry.type}</p>
                    </div>
                  </div>
                </div>
                <span className={'px-3 py-1 text-xs font-medium rounded-full ' + (
                  entry.status === 'EXECUTED' ? 'bg-green-100 text-green-800' :
                  entry.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  entry.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                )}>
                  {entry.status}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Reason: </span>
                  <span className="text-gray-600">{entry.reason}</span>
                </div>
                {entry.amount && (
                  <div>
                    <span className="font-medium text-gray-700">Amount: </span>
                    <span className="text-gray-900">${entry.amount.toLocaleString()}</span>
                  </div>
                )}
                {entry.transactionHash && (
                  <div>
                    <span className="font-medium text-gray-700">Transaction: </span>
                    <span className="font-mono text-xs text-blue-600">{entry.transactionHash}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Executed: </span>
                  <span className="text-gray-600">{new Date(entry.executedAt).toLocaleString()}</span>
                </div>
              </div>

              {entry.outcome && (
                <div className="mt-3 p-3 bg-gray-50 rounded">
                  <div className="text-xs font-medium text-gray-700 mb-1">Outcome</div>
                  <div className="text-sm text-gray-600">{entry.outcome}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



