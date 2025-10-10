/**
 * Contract Health Metrics
 * 
 * WO-112: Display contract health indicators
 */

import React from 'react';

interface ContractHealthMetricsProps {
  contractId: string;
  governanceData: any;
}

export default function ContractHealthMetrics({ contractId, governanceData }: ContractHealthMetricsProps) {
  // Calculate health score
  const calculateHealthScore = () => {
    let score = 100;
    
    // Deduct for pending modifications
    score -= governanceData.modificationTracking.pendingModifications * 5;
    
    // Deduct for pending operations
    score -= governanceData.pendingOperations.length * 3;
    
    return Math.max(0, Math.min(100, score));
  };

  const healthScore = calculateHealthScore();

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Health Metrics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Overall Health Score */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-2">Health Score</div>
          <div className={'text-4xl font-bold ' + (
            healthScore >= 90 ? 'text-green-600' :
            healthScore >= 70 ? 'text-blue-600' :
            healthScore >= 50 ? 'text-yellow-600' :
            'text-red-600'
          )}>
            {healthScore}
          </div>
          <div className="text-xs text-gray-500 mt-1">/100</div>
        </div>

        {/* Active Stakeholders */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-2">Active Stakeholders</div>
          <div className="text-4xl font-bold text-gray-900">
            {governanceData.governanceInfo.stakeholders.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Total participants</div>
        </div>

        {/* Pending Actions */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-2">Pending Actions</div>
          <div className="text-4xl font-bold text-yellow-600">
            {governanceData.modificationTracking.pendingModifications}
          </div>
          <div className="text-xs text-gray-500 mt-1">Awaiting approval</div>
        </div>

        {/* Total Modifications */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-2">Total Changes</div>
          <div className="text-4xl font-bold text-blue-600">
            {governanceData.modificationTracking.totalModifications}
          </div>
          <div className="text-xs text-gray-500 mt-1">All time</div>
        </div>
      </div>
    </div>
  );
}



