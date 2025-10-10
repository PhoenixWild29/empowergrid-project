/**
 * Geographic Project Map
 * 
 * Displays project locations on a map with status and capacity information
 * Note: This is a placeholder implementation using a grid layout
 * For production, integrate with a real mapping library like react-leaflet or mapbox-gl
 */

import React, { useState } from 'react';

export interface ProjectLocation {
  id: string;
  title: string;
  location: string;
  latitude?: number;
  longitude?: number;
  status: 'DRAFT' | 'ACTIVE' | 'FUNDED' | 'IN_PROGRESS' | 'COMPLETED';
  energyCapacity: number;
  fundingProgress: number;
}

export interface GeographicProjectMapProps {
  projects: ProjectLocation[];
  onProjectClick?: (projectId: string) => void;
}

const STATUS_COLORS = {
  DRAFT: '#6b7280',
  ACTIVE: '#3b82f6',
  FUNDED: '#10b981',
  IN_PROGRESS: '#f59e0b',
  COMPLETED: '#8b5cf6',
};

export default function GeographicProjectMap({
  projects,
  onProjectClick,
}: GeographicProjectMapProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  
  // Filter projects
  const filteredProjects = filter === 'ALL'
    ? projects
    : projects.filter((p) => p.status === filter);
  
  // Group projects by location
  const projectsByLocation = filteredProjects.reduce((acc, project) => {
    const location = project.location;
    if (!acc[location]) {
      acc[location] = [];
    }
    acc[location].push(project);
    return acc;
  }, {} as Record<string, ProjectLocation[]>);
  
  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <svg
          className="w-16 h-16 text-gray-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
        <p className="text-gray-600 text-lg font-medium">No projects to display</p>
        <p className="text-gray-500 text-sm mt-1">
          Project locations will appear here once projects are created
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Map Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Project Locations ({filteredProjects.length})
          </h3>
          
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="FUNDED">Funded</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-200">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs font-medium text-gray-600">
                {status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Map Placeholder - Grid Layout */}
      <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border border-gray-200 p-6 min-h-[500px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(projectsByLocation).map(([location, locationProjects]) => (
            <div
              key={location}
              className="bg-white rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600"
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
                  <h4 className="font-semibold text-gray-900">{location}</h4>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {locationProjects.length} project{locationProjects.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="p-4 space-y-3">
                {locationProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      setSelectedProject(project.id);
                      onProjectClick?.(project.id);
                    }}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedProject === project.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium text-gray-900 text-sm line-clamp-1">
                        {project.title}
                      </h5>
                      <span
                        className="px-2 py-1 text-xs font-semibold rounded-full text-white flex-shrink-0 ml-2"
                        style={{ backgroundColor: STATUS_COLORS[project.status] }}
                      >
                        {project.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Capacity:</span>
                        <span className="font-semibold text-gray-900">
                          {project.energyCapacity} kW
                        </span>
                      </div>
                      
                      <div className="relative">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${project.fundingProgress}%`,
                              backgroundColor: STATUS_COLORS[project.status],
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {project.fundingProgress}% Funded
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Integration Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
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
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-900">Map Integration</p>
            <p className="text-sm text-blue-700 mt-1">
              This is a placeholder grid view. For production, integrate with a mapping library like
              react-leaflet or mapbox-gl to display projects on an interactive map.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}




