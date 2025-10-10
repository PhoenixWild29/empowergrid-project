/**
 * Project Discovery Page
 * 
 * Comprehensive project discovery interface with:
 * - Virtual scrolling grid (WO#64)
 * - Advanced filtering (WO#70)
 * - Intelligent search (WO#76)
 * 
 * Features:
 * - High-performance virtual scrolling
 * - Real-time filters
 * - Autocomplete search
 * - Saved searches
 * - Infinite scroll
 * - Bookmarking
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { ProjectDiscoveryGrid } from '../../components/ProjectDiscoveryGrid';
import { FilterPanel, FilterState } from '../../components/ProjectFilters';
import { ProjectSearchInput, SavedSearches } from '../../components/ProjectSearch';
import { useProjectData } from '../../hooks/useProjectData';

export default function ProjectDiscoveryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({});

  // Fetch project data with search and filters
  const { totalCount } = useProjectData({
    filters: {
      ...filters,
      search: searchQuery || undefined,
    },
  });

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  // Handle saved search application
  const handleApplySavedSearch = (query: string, savedFilters?: Record<string, any>) => {
    setSearchQuery(query);
    if (savedFilters) {
      setFilters(savedFilters as FilterState);
    }
  };

  // Handle project click
  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Discover Projects
          </h1>
          <p className="text-gray-600">
            Find renewable energy projects to fund
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <ProjectSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Saved Searches */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <SavedSearches onApplySearch={handleApplySavedSearch} />
            </div>

            {/* Filters */}
            <FilterPanel
              filters={filters}
              onChange={handleFilterChange}
              resultCount={totalCount}
            />
          </aside>

          {/* Project Grid */}
          <main className="lg:col-span-3">
            <ProjectDiscoveryGrid
              filters={{
                ...filters,
                search: searchQuery || undefined,
              }}
              onProjectClick={handleProjectClick}
            />
          </main>
        </div>
      </div>
    </div>
  );
}




