/**
 * Coordinate Input Component
 * 
 * Manual latitude/longitude input with format validation
 */

import React from 'react';
import { validateCoordinates } from '../../services/locationValidationService';

export interface CoordinateInputProps {
  latitude: number;
  longitude: number;
  onChange: (latitude: number, longitude: number) => void;
  onValidate?: (valid: boolean, error?: string) => void;
  disabled?: boolean;
}

export default function CoordinateInput({
  latitude,
  longitude,
  onChange,
  onValidate,
  disabled = false,
}: CoordinateInputProps) {
  const [latError, setLatError] = React.useState<string | null>(null);
  const [lonError, setLonError] = React.useState<string | null>(null);

  const handleLatitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    
    if (!isNaN(value)) {
      onChange(value, longitude);
      
      const validation = validateCoordinates(value, longitude);
      setLatError(validation.valid ? null : validation.error || null);
      onValidate?.(validation.valid, validation.error);
    }
  };

  const handleLongitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    
    if (!isNaN(value)) {
      onChange(latitude, value);
      
      const validation = validateCoordinates(latitude, value);
      setLonError(validation.valid ? null : validation.error || null);
      onValidate?.(validation.valid, validation.error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Latitude */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Latitude
          </label>
          <input
            type="number"
            step="0.000001"
            value={latitude || ''}
            onChange={handleLatitudeChange}
            disabled={disabled}
            placeholder="e.g., 37.774929"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              latError
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          />
          {latError && (
            <p className="text-xs text-red-600 mt-1">{latError}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Range: -90 to 90</p>
        </div>

        {/* Longitude */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Longitude
          </label>
          <input
            type="number"
            step="0.000001"
            value={longitude || ''}
            onChange={handleLongitudeChange}
            disabled={disabled}
            placeholder="e.g., -122.419418"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              lonError
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          />
          {lonError && (
            <p className="text-xs text-red-600 mt-1">{lonError}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Range: -180 to 180</p>
        </div>
      </div>

      {/* Coordinate Display */}
      {latitude !== 0 && longitude !== 0 && !latError && !lonError && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
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
            <div>
              <p className="text-sm font-medium text-blue-900">Coordinates Valid</p>
              <p className="text-xs text-blue-700 mt-1">
                {latitude.toFixed(6)}°, {longitude.toFixed(6)}°
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






