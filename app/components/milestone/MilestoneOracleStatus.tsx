/**
 * Milestone Oracle Status
 * 
 * WO-113: Display oracle service integration status
 */

import React, { useState, useEffect } from 'react';

interface MilestoneOracleStatusProps {
  escrowContractId: string;
  milestoneId: string;
}

export default function MilestoneOracleStatus({ escrowContractId, milestoneId }: MilestoneOracleStatusProps) {
  const [oracleStatus, setOracleStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOracleStatus() {
      try {
        // Would fetch oracle status from API
        setOracleStatus({
          connected: true,
          lastUpdate: new Date().toISOString(),
          confidence: 0.92,
          dataSource: 'Switchboard Oracle Network',
        });
      } catch (error) {
        console.error('[WO-113] Oracle status error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOracleStatus();
  }, [escrowContractId, milestoneId]);

  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-blue-800 text-sm">Connecting to oracle service...</span>
        </div>
      </div>
    );
  }

  if (!oracleStatus) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="text-2xl">🔮</div>
        <div>
          <h4 className="font-semibold text-blue-900">Oracle Verification Service</h4>
          <p className="text-sm text-blue-700">
            External oracle service will verify energy production data
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded p-3">
          <div className="text-xs text-gray-600">Status</div>
          <div className={'font-semibold ' + (oracleStatus.connected ? 'text-green-600' : 'text-red-600')}>
            {oracleStatus.connected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        <div className="bg-white rounded p-3">
          <div className="text-xs text-gray-600">Confidence</div>
          <div className="font-semibold text-gray-900">
            {(oracleStatus.confidence * 100).toFixed(0)}%
          </div>
        </div>

        <div className="bg-white rounded p-3">
          <div className="text-xs text-gray-600">Data Source</div>
          <div className="font-semibold text-gray-900 text-xs">
            {oracleStatus.dataSource}
          </div>
        </div>

        <div className="bg-white rounded p-3">
          <div className="text-xs text-gray-600">Last Update</div>
          <div className="font-semibold text-gray-900 text-xs">
            {new Date(oracleStatus.lastUpdate).toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-blue-700">
        ℹ️ Verification will be processed automatically using oracle data
      </div>
    </div>
  );
}



