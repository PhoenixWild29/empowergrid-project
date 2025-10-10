/**
 * Stakeholder Activity Summary
 * 
 * WO-112: Stakeholder engagement metrics
 */

import React from 'react';

interface StakeholderActivitySummaryProps {
  contractId: string;
  governanceData: any;
}

export default function StakeholderActivitySummary({ contractId, governanceData }: StakeholderActivitySummaryProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Stakeholder Activity</h3>
      
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <div className="space-y-4">
            {governanceData.governanceInfo.stakeholders.map((stakeholder: any, index: number) => (
              <div key={index} className="flex items-center justify-between pb-4 border-b border-gray-100 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className={'w-10 h-10 rounded-full flex items-center justify-center font-bold ' + (
                    stakeholder.role === 'CREATOR' ? 'bg-purple-100 text-purple-600' :
                    stakeholder.role === 'FUNDER' ? 'bg-green-100 text-green-600' :
                    stakeholder.role === 'VERIFIER' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-600'
                  )}>
                    {stakeholder.role.charAt(0)}
                  </div>
                  <div>
                    <div className="font-mono text-sm text-gray-900">
                      {stakeholder.address.slice(0, 8)}...{stakeholder.address.slice(-6)}
                    </div>
                    <div className="text-xs text-gray-600">{stakeholder.role}</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    Voting Power: {stakeholder.votingPower}
                  </div>
                  <div className="text-xs text-gray-500">Active</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}



