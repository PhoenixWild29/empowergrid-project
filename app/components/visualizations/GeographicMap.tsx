/**
 * Geographic Map Component
 * 
 * WO-100: Interactive Visualization with Geographic Mapping
 * Display projects on interactive map
 */

'use client';

import React from 'react';

interface GeographicMapProps {
  projects: any[];
  selectedProjectId?: string;
  onProjectSelect?: (projectId: string) => void;
}

export default function GeographicMap({
  projects = [],
  selectedProjectId,
  onProjectSelect,
}: GeographicMapProps) {
  // Mock coordinates for demonstration
  const projectsWithCoords = projects.map((p, i) => ({
    ...p,
    lat: 37.7749 + (Math.random() - 0.5) * 10,
    lng: -122.4194 + (Math.random() - 0.5) * 20,
  }));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>🗺️</span> Geographic Distribution
      </h3>

      {/* Map Placeholder */}
      <div className="aspect-video bg-gray-100 rounded-lg relative overflow-hidden mb-4">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🌍</div>
            <p className="text-gray-600 font-medium">Interactive Map</p>
            <p className="text-sm text-gray-500 mt-2">
              {projects.length} projects displayed
            </p>
            <p className="text-xs text-gray-400 mt-4">
              Production: Integrate react-leaflet or mapbox-gl
            </p>
          </div>
        </div>

        {/* Simple project markers */}
        {projectsWithCoords.slice(0, 10).map((project, index) => (
          <div
            key={project.id}
            className="absolute w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform"
            style={{
              left: `${20 + (index * 8)}%`,
              top: `${30 + (index % 3) * 20}%`,
            }}
            onClick={() => onProjectSelect?.(project.id)}
            title={project.title}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Funded</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-gray-600">Completed</span>
          </div>
        </div>
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          View Fullscreen
        </button>
      </div>
    </div>
  );
}

