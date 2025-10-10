/**
 * Location Details Display Component
 * 
 * Displays verified address, zoning compliance, utility feasibility,
 * and environmental restrictions
 */

import React from 'react';
import { LocationDetails } from '../../services/locationValidationService';

export interface LocationDetailsDisplayProps {
  details: LocationDetails | null;
  loading?: boolean;
}

export default function LocationDetailsDisplay({
  details,
  loading = false,
}: LocationDetailsDisplayProps) {
  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
        <p className="text-sm text-gray-600">Verifying location...</p>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center border-2 border-dashed border-gray-300">
        <svg
          className="w-12 h-12 text-gray-400 mx-auto mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <p className="text-sm text-gray-600">
          Select a location to view details
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Formatted Address */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">
          Verified Address
        </h4>
        <p className="text-sm text-gray-700">{details.formattedAddress}</p>
        {details.jurisdiction && (
          <p className="text-xs text-gray-500 mt-1">
            Jurisdiction: {details.jurisdiction}
          </p>
        )}
      </div>

      {/* Zoning Compliance */}
      {details.zoning && (
        <div className={`rounded-lg border p-4 ${
          details.zoning.compliant
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-2 mb-2">
            {details.zoning.compliant ? (
              <svg
                className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
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
            ) : (
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
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            <div className="flex-1">
              <h4 className={`text-sm font-semibold ${
                details.zoning.compliant ? 'text-green-900' : 'text-red-900'
              }`}>
                Zoning: {details.zoning.classification}
              </h4>
              <p className={`text-xs mt-1 ${
                details.zoning.compliant ? 'text-green-700' : 'text-red-700'
              }`}>
                {details.zoning.compliant ? 'Compliant' : 'Non-Compliant'}
              </p>
            </div>
          </div>

          {details.zoning.restrictions && details.zoning.restrictions.length > 0 && (
            <div className="mt-2 pl-7">
              <p className="text-xs font-medium text-gray-700 mb-1">Restrictions:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {details.zoning.restrictions.map((restriction, index) => (
                  <li key={index}>• {restriction}</li>
                ))}
              </ul>
            </div>
          )}

          {details.zoning.requirements && details.zoning.requirements.length > 0 && (
            <div className="mt-2 pl-7">
              <p className="text-xs font-medium text-gray-700 mb-1">Requirements:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {details.zoning.requirements.map((requirement, index) => (
                  <li key={index}>• {requirement}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Utility Interconnection */}
      {details.utility && (
        <div className={`rounded-lg border p-4 ${
          details.utility.gridConnectionAvailable
            ? 'bg-blue-50 border-blue-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-start gap-2 mb-2">
            <svg
              className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                details.utility.gridConnectionAvailable ? 'text-blue-600' : 'text-yellow-600'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <div className="flex-1">
              <h4 className={`text-sm font-semibold ${
                details.utility.gridConnectionAvailable ? 'text-blue-900' : 'text-yellow-900'
              }`}>
                Utility Grid Connection
              </h4>
              <p className={`text-xs mt-1 ${
                details.utility.gridConnectionAvailable ? 'text-blue-700' : 'text-yellow-700'
              }`}>
                Feasibility: {details.utility.interconnectionFeasibility.toUpperCase()}
              </p>
            </div>
          </div>

          {details.utility.nearestSubstation && (
            <div className="mt-2 pl-7 text-xs text-gray-600 space-y-1">
              <p>Nearest: {details.utility.nearestSubstation}</p>
              {details.utility.distanceToGrid && (
                <p>Distance: {(details.utility.distanceToGrid / 1000).toFixed(2)} km</p>
              )}
              {details.utility.estimatedConnectionCost && (
                <p>
                  Est. Connection Cost: ${details.utility.estimatedConnectionCost.toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Environmental Info */}
      {details.environmental && (
        <div className={`rounded-lg border p-4 ${
          details.environmental.protectedArea
            ? 'bg-red-50 border-red-200'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-start gap-2">
            <svg
              className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                details.environmental.protectedArea ? 'text-red-600' : 'text-gray-600'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h4 className={`text-sm font-semibold ${
                details.environmental.protectedArea ? 'text-red-900' : 'text-gray-900'
              }`}>
                Environmental Status
              </h4>
              <p className={`text-xs mt-1 ${
                details.environmental.protectedArea ? 'text-red-700' : 'text-gray-700'
              }`}>
                {details.environmental.protectedArea ? 'Protected Area' : 'No Special Protections'}
              </p>
              {details.environmental.assessmentRequired && (
                <p className="text-xs text-gray-600 mt-1">
                  ⚠️ Environmental assessment required
                </p>
              )}
            </div>
          </div>

          {details.environmental.restrictions && details.environmental.restrictions.length > 0 && (
            <div className="mt-2 pl-7">
              <p className="text-xs font-medium text-gray-700 mb-1">Restrictions:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {details.environmental.restrictions.map((restriction, index) => (
                  <li key={index}>• {restriction}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}




