/**
 * Location Selector Component
 * 
 * Orchestrates all location selection sub-components:
 * - LocationMap
 * - AddressSearchInput
 * - CoordinateInput
 * - LocationDetailsDisplay
 * 
 * Manages state and data flow between components
 * Automatically updates related form fields
 */

import React, { useState, useEffect } from 'react';
import LocationMap from './LocationMap';
import AddressSearchInput from './AddressSearchInput';
import CoordinateInput from './CoordinateInput';
import LocationDetailsDisplay from './LocationDetailsDisplay';
import {
  verifyAddress,
  reverseGeocode,
  checkZoningCompliance,
  checkUtilityFeasibility,
  LocationDetails,
} from '../../services/locationValidationService';

export interface LocationSelectorProps {
  value?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  onChange: (location: {
    address: string;
    formattedAddress?: string;
    latitude: number;
    longitude: number;
    jurisdiction?: string;
  }) => void;
  onValidationChange?: (valid: boolean) => void;
}

export default function LocationSelector({
  value,
  onChange,
  onValidationChange,
}: LocationSelectorProps) {
  const [address, setAddress] = useState(value?.address || '');
  const [latitude, setLatitude] = useState(value?.latitude || 0);
  const [longitude, setLongitude] = useState(value?.longitude || 0);
  const [locationDetails, setLocationDetails] = useState<LocationDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [inputMethod, setInputMethod] = useState<'search' | 'coordinates' | 'map'>('search');

  // Verify location when coordinates change
  useEffect(() => {
    if (latitude !== 0 && longitude !== 0) {
      loadLocationDetails();
    }
  }, [latitude, longitude]);

  const loadLocationDetails = async () => {
    setLoading(true);

    try {
      // If we have an address, verify it
      let details: LocationDetails | null = null;

      if (address) {
        details = await verifyAddress(address);
      } else {
        // Reverse geocode coordinates
        const reversedAddress = await reverseGeocode(latitude, longitude);
        if (reversedAddress) {
          details = await verifyAddress(reversedAddress);
        }
      }

      if (details) {
        // Get additional validation data
        const [zoning, utility] = await Promise.all([
          checkZoningCompliance({ latitude, longitude }),
          checkUtilityFeasibility({ latitude, longitude }),
        ]);

        details.zoning = zoning;
        details.utility = utility;

        setLocationDetails(details);

        // Update form fields
        onChange({
          address: details.address,
          formattedAddress: details.formattedAddress,
          latitude: details.coordinates.latitude,
          longitude: details.coordinates.longitude,
          jurisdiction: details.jurisdiction,
        });

        // Validate
        const isValid =
          details.zoning?.compliant !== false &&
          details.utility?.gridConnectionAvailable !== false;
        
        onValidationChange?.(isValid);
      }
    } catch (error) {
      console.error('Failed to load location details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle address search
  const handleAddressChange = (newAddress: string, coordinates?: { latitude: number; longitude: number }) => {
    setAddress(newAddress);
    setInputMethod('search');

    if (coordinates) {
      setLatitude(coordinates.latitude);
      setLongitude(coordinates.longitude);
    }
  };

  // Handle coordinate input
  const handleCoordinateChange = (lat: number, lon: number) => {
    setLatitude(lat);
    setLongitude(lon);
    setInputMethod('coordinates');
  };

  // Handle map click
  const handleMapClick = (lat: number, lon: number) => {
    setLatitude(lat);
    setLongitude(lon);
    setInputMethod('map');
  };

  return (
    <div className="space-y-6">
      {/* Input Method Selector */}
      <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 border border-gray-200">
        {[
          { id: 'search', label: 'Search Address', icon: '🔍' },
          { id: 'coordinates', label: 'Enter Coordinates', icon: '📍' },
          { id: 'map', label: 'Click on Map', icon: '🗺️' },
        ].map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => setInputMethod(method.id as any)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              inputMethod === method.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="mr-2">{method.icon}</span>
            {method.label}
          </button>
        ))}
      </div>

      {/* Address Search */}
      {inputMethod === 'search' && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Search for Address
          </label>
          <AddressSearchInput
            value={address}
            onChange={handleAddressChange}
            placeholder="Enter city, street address, or landmark..."
          />
        </div>
      )}

      {/* Coordinate Input */}
      {inputMethod === 'coordinates' && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Enter Coordinates
          </label>
          <CoordinateInput
            latitude={latitude}
            longitude={longitude}
            onChange={handleCoordinateChange}
          />
        </div>
      )}

      {/* Interactive Map */}
      {inputMethod === 'map' && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Click on Map to Select Location
          </label>
          <LocationMap
            latitude={latitude}
            longitude={longitude}
            onLocationSelect={handleMapClick}
            height={400}
          />
        </div>
      )}

      {/* Location Details */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Location Validation
        </h3>
        <LocationDetailsDisplay
          details={locationDetails}
          loading={loading}
        />
      </div>

      {/* Accessibility Note */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <svg
            className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-xs font-medium text-gray-900">Keyboard Navigation</p>
            <p className="text-xs text-gray-600 mt-1">
              Use Tab to navigate between input methods. Press Enter to select suggestions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

