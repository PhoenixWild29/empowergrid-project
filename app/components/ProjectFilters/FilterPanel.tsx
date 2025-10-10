/**
 * Filter Panel Component
 * 
 * Comprehensive filtering for projects:
 * - Geographic location (country, state, city)
 * - Energy capacity range (MW)
 * - Funding status and progress
 * - Project type
 * - Timeline filters
 * 
 * Features:
 * - Real-time filter application
 * - Active filter count
 * - Clear all functionality
 * - URL parameter sync
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';

export interface FilterState {
  location?: string;
  minCapacity?: number;
  maxCapacity?: number;
  fundingStage?: 'pre-funding' | 'active' | 'fully-funded';
  minFundingProgress?: number;
  maxFundingProgress?: number;
  projectType?: string[];
  startDateFrom?: string;
  startDateTo?: string;
  status?: string;
}

export interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  resultCount: number;
}

const PROJECT_TYPES = ['Solar', 'Wind', 'Hydro', 'Biomass', 'Geothermal', 'Hybrid'];
const FUNDING_STAGES = [
  { value: 'pre-funding', label: 'Pre-Funding' },
  { value: 'active', label: 'Active Funding' },
  { value: 'fully-funded', label: 'Fully Funded' },
];

export default function FilterPanel({
  filters,
  onChange,
  resultCount,
}: FilterPanelProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);

  // Count active filters
  const activeFilterCount = Object.keys(filters).filter(
    (key) => filters[key as keyof FilterState] !== undefined && filters[key as keyof FilterState] !== ''
  ).length;

  // Clear all filters
  const clearAllFilters = () => {
    onChange({});
    // Clear URL parameters
    router.push(router.pathname, undefined, { shallow: true });
  };

  // Update single filter
  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onChange(newFilters);
    
    // Update URL parameters
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') {
        if (Array.isArray(v)) {
          v.forEach((item) => params.append(k, item));
        } else {
          params.set(k, v.toString());
        }
      }
    });

    router.push(`${router.pathname}?${params.toString()}`, undefined, { shallow: true });
  };

  // Toggle project type
  const toggleProjectType = (type: string) => {
    const current = filters.projectType || [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    
    updateFilter('projectType', updated.length > 0 ? updated : undefined);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-600 hover:text-gray-900 p-2"
          >
            <svg
              className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''}
          </span>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      {expanded && (
        <div className="p-4 space-y-6">
          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Location
            </label>
            <input
              type="text"
              value={filters.location || ''}
              onChange={(e) => updateFilter('location', e.target.value || undefined)}
              placeholder="City, State, or Country"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Energy Capacity Range */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Energy Capacity (kW)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={filters.minCapacity || ''}
                onChange={(e) => updateFilter('minCapacity', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Min"
                min={0}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                value={filters.maxCapacity || ''}
                onChange={(e) => updateFilter('maxCapacity', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Max"
                max={10000}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Funding Stage */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Funding Stage
            </label>
            <select
              value={filters.fundingStage || ''}
              onChange={(e) => updateFilter('fundingStage', e.target.value || undefined)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Stages</option>
              {FUNDING_STAGES.map((stage) => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </select>
          </div>

          {/* Funding Progress Range */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Funding Progress (%)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={filters.minFundingProgress || ''}
                onChange={(e) => updateFilter('minFundingProgress', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Min %"
                min={0}
                max={100}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                value={filters.maxFundingProgress || ''}
                onChange={(e) => updateFilter('maxFundingProgress', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Max %"
                min={0}
                max={100}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Project Type (Multi-select) */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Project Type
            </label>
            <div className="space-y-2">
              {PROJECT_TYPES.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={(filters.projectType || []).includes(type)}
                    onChange={() => toggleProjectType(type)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Project Status */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Project Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => updateFilter('status', e.target.value || undefined)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="FUNDED">Funded</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Timeline Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Start Date Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={filters.startDateFrom || ''}
                onChange={(e) => updateFilter('startDateFrom', e.target.value || undefined)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={filters.startDateTo || ''}
                onChange={(e) => updateFilter('startDateTo', e.target.value || undefined)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Result Count */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <p className="text-sm font-medium text-gray-900">
          {resultCount.toLocaleString()} project{resultCount !== 1 ? 's' : ''} found
        </p>
      </div>
    </div>
  );
}




