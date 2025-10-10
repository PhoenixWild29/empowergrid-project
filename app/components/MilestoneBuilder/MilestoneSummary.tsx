/**
 * Milestone Summary Component
 * 
 * Displays auto-calculated running totals and validation status
 */

import React from 'react';
import { Milestone } from '../../types/projectCreation';
import { calculateMilestoneTotals } from '../../utils/milestoneValidation';

export interface MilestoneSummaryProps {
  milestones: Milestone[];
  projectCapacity: number;
  projectFunding: number;
  validationErrors?: string[];
  validationWarnings?: string[];
}

export default function MilestoneSummary({
  milestones,
  projectCapacity,
  projectFunding,
  validationErrors = [],
  validationWarnings = [],
}: MilestoneSummaryProps) {
  const totals = calculateMilestoneTotals(milestones);
  const energyPercentage = projectCapacity > 0
    ? (totals.totalEnergy / (projectCapacity * 1500)) * 100 // Rough annual estimate
    : 0;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <p className="text-xs font-medium text-gray-600 mb-1">Total Milestones</p>
          <p className="text-2xl font-bold text-blue-600">{totals.count}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <p className="text-xs font-medium text-gray-600 mb-1">Total Energy</p>
          <p className="text-lg font-bold text-green-600">
            {(totals.totalEnergy / 1000).toFixed(1)} MWh
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <p className="text-xs font-medium text-gray-600 mb-1">Funding Allocated</p>
          <p className="text-lg font-bold text-purple-600">
            {totals.totalFunding.toFixed(1)}%
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <p className="text-xs font-medium text-gray-600 mb-1">Completion Est.</p>
          <p className="text-sm font-bold text-orange-600">
            {totals.completionEstimate
              ? new Date(totals.completionEstimate).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })
              : 'N/A'}
          </p>
        </div>
      </div>

      {/* Energy Comparison */}
      {projectCapacity > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Energy Target vs Project Capacity
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Milestone Targets:</span>
              <span className="font-semibold text-gray-900">
                {totals.totalEnergy.toLocaleString()} kWh
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Est. Annual Production:</span>
              <span className="font-semibold text-gray-900">
                {(projectCapacity * 1500).toLocaleString()} kWh/year
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
              <div
                className={`h-3 rounded-full transition-all ${
                  energyPercentage > 110
                    ? 'bg-red-500'
                    : energyPercentage > 90
                    ? 'bg-green-500'
                    : 'bg-yellow-500'
                }`}
                style={{ width: `${Math.min(energyPercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              {energyPercentage.toFixed(0)}% of estimated annual capacity
            </p>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h5 className="text-sm font-semibold text-red-900 mb-2">
                Validation Errors ({validationErrors.length})
              </h5>
              <ul className="text-xs text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Validation Warnings */}
      {validationWarnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <h5 className="text-sm font-semibold text-yellow-900 mb-2">
                Warnings ({validationWarnings.length})
              </h5>
              <ul className="text-xs text-yellow-700 space-y-1">
                {validationWarnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {validationErrors.length === 0 && milestones.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm font-medium text-green-900">
              Milestones validated successfully
            </p>
          </div>
        </div>
      )}
    </div>
  );
}




