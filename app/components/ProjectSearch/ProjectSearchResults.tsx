/**
 * Project Search Results Component
 * 
 * Displays search results with:
 * - Result ranking by relevance
 * - Search term highlighting
 * - Result count
 * - Sorting options
 */

import React from 'react';
import { ProjectListItem } from '../../hooks/useProjectData';
import EnhancedProjectCard from '../projects/EnhancedProjectCard';

export interface ProjectSearchResultsProps {
  results: ProjectListItem[];
  searchQuery: string;
  totalCount: number;
  sortBy: string;
  onSortChange: (sortBy: string) => void;
  loading?: boolean;
}

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'fundingProgress', label: 'Funding Progress' },
  { value: 'energyCapacity', label: 'Energy Capacity' },
  { value: 'createdAt', label: 'Date Created' },
];

export default function ProjectSearchResults({
  results,
  searchQuery,
  totalCount,
  sortBy,
  onSortChange,
  loading = false,
}: ProjectSearchResultsProps) {
  // Highlight search terms in text
  const highlightText = (text: string, query: string) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white rounded-lg border border-gray-200 p-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Search Results
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {totalCount.toLocaleString()} project{totalCount !== 1 ? 's' : ''} found
            {searchQuery && (
              <span> for &quot;{highlightText(searchQuery, searchQuery)}&quot;</span>
            )}
          </p>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Grid */}
      {results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((project) => (
            <div key={project.id} className="relative">
              <EnhancedProjectCard project={project} />
              
              {/* Relevance Score (if available) */}
              {sortBy === 'relevance' && (
                <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  Match
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Results Found
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Try different keywords or adjust your filters
          </p>
        </div>
      )}
    </div>
  );
}

