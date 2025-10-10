/**
 * Funding Activity Widget
 * 
 * WO-86: Real-time Monitoring Dashboard
 * Live funding transaction updates
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRealtime } from '../../contexts/RealtimeContext';

interface FundingActivityWidgetProps {
  projectId: string;
  fundings: any[];
  targetAmount: number;
  currentAmount: number;
}

export default function FundingActivityWidget({
  projectId,
  fundings = [],
  targetAmount,
  currentAmount,
}: FundingActivityWidgetProps) {
  const [recentFundings, setRecentFundings] = useState(fundings);
  const { subscribe, isConnected } = useRealtime();

  useEffect(() => {
    const unsubscribe = subscribe('project:funded', (data) => {
      if (data.projectId === projectId) {
        setRecentFundings(prev => [{
          id: data.fundingId,
          amount: data.amount,
          funder: data.funder,
          createdAt: new Date().toISOString(),
          isNew: true,
        }, ...prev]);
      }
    });

    return unsubscribe;
  }, [projectId, subscribe]);

  const fundingVelocity = calculateVelocity(recentFundings);
  const avgContribution = recentFundings.length > 0 
    ? currentAmount / recentFundings.length 
    : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span>💰</span> Funding Activity
        </h3>
        {isConnected && (
          <span className="text-xs text-green-600">● Live</span>
        )}
      </div>

      {/* Funding Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-1">Recent Funders</div>
          <div className="text-xl font-bold text-gray-900">{recentFundings.length}</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-1">Avg Contribution</div>
          <div className="text-xl font-bold text-gray-900">${avgContribution.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-1">Velocity</div>
          <div className="text-xl font-bold text-gray-900">{fundingVelocity.toFixed(1)}/day</div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Transactions</h4>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {recentFundings.slice(0, 10).map((funding: any) => (
            <div
              key={funding.id}
              className={`p-3 rounded-lg transition-all ${
                (funding as any).isNew 
                  ? 'bg-green-50 border border-green-200 animate-pulse' 
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">
                      {funding.funder?.username?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      {funding.funder?.username || 'Anonymous'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(funding.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">${funding.amount.toLocaleString()}</div>
                  {(funding as any).isNew && (
                    <div className="text-xs text-green-600">NEW!</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function calculateVelocity(fundings: any[]): number {
  if (fundings.length < 2) return 0;

  const oldest = new Date(fundings[fundings.length - 1].createdAt);
  const daysSince = Math.max(1, Math.floor((Date.now() - oldest.getTime()) / (1000 * 60 * 60 * 24)));
  
  return fundings.length / daysSince;
}

