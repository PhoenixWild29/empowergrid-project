/**
 * Location Map Component
 * 
 * Interactive map for selecting project locations
 * 
 * Features:
 * - Click to place pin
 * - Toggleable information overlays
 * - Zoom and pan controls
 * - Responsive design
 * 
 * Note: This is a placeholder implementation
 * For production, integrate with react-leaflet, mapbox-gl, or Google Maps
 */

import React, { useState } from 'react';

export interface MapOverlay {
  id: string;
  label: string;
  enabled: boolean;
  color: string;
}

export interface LocationMapProps {
  latitude: number;
  longitude: number;
  onLocationSelect: (latitude: number, longitude: number) => void;
  zoom?: number;
  height?: number;
  overlays?: MapOverlay[];
  onOverlayToggle?: (overlayId: string, enabled: boolean) => void;
}

const DEFAULT_OVERLAYS: MapOverlay[] = [
  { id: 'zoning', label: 'Zoning', enabled: false, color: '#3b82f6' },
  { id: 'utilities', label: 'Utilities', enabled: false, color: '#10b981' },
  { id: 'environmental', label: 'Environmental', enabled: false, color: '#f59e0b' },
];

export default function LocationMap({
  latitude,
  longitude,
  onLocationSelect,
  zoom = 12,
  height = 500,
  overlays = DEFAULT_OVERLAYS,
  onOverlayToggle,
}: LocationMapProps) {
  const [activeOverlays, setActiveOverlays] = useState<Set<string>>(new Set());

  const toggleOverlay = (overlayId: string) => {
    const newActiveOverlays = new Set(activeOverlays);
    
    if (newActiveOverlays.has(overlayId)) {
      newActiveOverlays.delete(overlayId);
    } else {
      newActiveOverlays.add(overlayId);
    }
    
    setActiveOverlays(newActiveOverlays);
    onOverlayToggle?.(overlayId, newActiveOverlays.has(overlayId));
  };

  // Simulate map click
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Simulate coordinate calculation (very simplified)
    const newLat = latitude + ((y - rect.height / 2) / rect.height) * 0.1;
    const newLon = longitude + ((x - rect.width / 2) / rect.width) * 0.1;
    
    onLocationSelect(newLat, newLon);
  };

  return (
    <div className="space-y-4">
      {/* Map Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Overlays:</span>
          <div className="flex flex-wrap gap-2">
            {overlays.map((overlay) => (
              <button
                key={overlay.id}
                type="button"
                onClick={() => toggleOverlay(overlay.id)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                  activeOverlays.has(overlay.id)
                    ? 'text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
                style={activeOverlays.has(overlay.id) ? { backgroundColor: overlay.color } : {}}
              >
                {overlay.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-600">
          Zoom: {zoom}x | Lat: {latitude.toFixed(6)} | Lon: {longitude.toFixed(6)}
        </div>
      </div>

      {/* Map Display (Placeholder) */}
      <div
        onClick={handleMapClick}
        className="relative bg-gradient-to-br from-green-100 to-blue-100 rounded-lg border-2 border-gray-300 overflow-hidden cursor-crosshair"
        style={{ height: `${height}px` }}
      >
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(0deg, transparent 24%, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,0.05) 75%, rgba(0,0,0,0.05) 76%, transparent 77%, transparent),
              linear-gradient(90deg, transparent 24%, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,0.05) 75%, rgba(0,0,0,0.05) 76%, transparent 77%, transparent)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Map Pin */}
        {latitude !== 0 && longitude !== 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full">
            <svg
              className="w-12 h-12 text-red-600 drop-shadow-lg animate-bounce"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 0C7.802 0 4 3.403 4 7.602C4 11.8 7.469 16.812 12 24C16.531 16.812 20 11.8 20 7.602C20 3.403 16.199 0 12 0ZM12 11C10.343 11 9 9.657 9 8C9 6.343 10.343 5 12 5C13.657 5 15 6.343 15 8C15 9.657 13.657 11 12 11Z" />
            </svg>
          </div>
        )}

        {/* Overlay indicators */}
        {activeOverlays.has('zoning') && (
          <div className="absolute top-4 left-4 bg-blue-600 bg-opacity-20 rounded-lg border-2 border-blue-600 border-dashed p-2 pointer-events-none">
            <p className="text-xs font-semibold text-blue-900">Zoning Zone</p>
          </div>
        )}
        
        {activeOverlays.has('utilities') && (
          <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none">
            <div className="w-3 h-3 bg-green-600 rounded-full shadow-lg" />
            <div className="w-px h-20 bg-green-600 mx-auto" />
            <p className="text-xs font-semibold text-green-900 bg-white px-2 py-1 rounded">Grid</p>
          </div>
        )}

        {/* Integration Note */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white bg-opacity-95 rounded-lg shadow-lg px-4 py-2 border border-gray-300 max-w-md">
          <p className="text-xs text-gray-700 text-center">
            <span className="font-semibold">Map Placeholder:</span> Integrate react-leaflet or mapbox-gl for production
          </p>
        </div>
      </div>

      {/* Map Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          💡 <span className="font-semibold">Tip:</span> Click anywhere on the map to place a pin and select your project location.
          Use the overlay toggles to view zoning, utilities, and environmental information.
        </p>
      </div>
    </div>
  );
}




