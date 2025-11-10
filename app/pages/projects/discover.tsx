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

import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';

import Layout from '../../components/Layout';
import { ProjectDiscoveryGrid } from '../../components/ProjectDiscoveryGrid';
import { FilterPanel, FilterState } from '../../components/ProjectFilters/FilterPanel';
import { ProjectSearchInput, SavedSearches } from '../../components/ProjectSearch';
import RecommendedForYou from '../../components/recommendations/RecommendedForYou';
import { useProjectData } from '../../hooks/useProjectData';

export default function ProjectDiscoveryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({});

  const { totalCount } = useProjectData({
    filters: {
      ...filters,
      search: searchQuery || undefined,
    },
  });

  const activeFilterCount = useMemo(
    () =>
      Object.entries(filters).filter(([_, value]) => {
        if (value === undefined || value === null) return false;
        if (typeof value === 'string') return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        return true;
      }).length,
    [filters]
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleApplySavedSearch = (query: string, savedFilters?: Record<string, any>) => {
    setSearchQuery(query);
    if (savedFilters) {
      setFilters(savedFilters as FilterState);
    }
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  return (
    <Layout>
      <div className='space-y-10 pb-10'>
        <section className='relative overflow-hidden rounded-4xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-sky-500 px-8 py-12 text-white shadow-lg sm:px-12'>
          <div className='relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between'>
            <div className='max-w-2xl space-y-4'>
              <span className='inline-flex items-center rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-50 ring-1 ring-white/30'>
                Empower communities · Build renewable microgrids
              </span>
              <h1 className='text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl'>
                Fund verified renewable projects with milestone-protected escrow
              </h1>
              <p className='text-sm leading-6 text-emerald-50/90 sm:text-base'>
                Explore community-owned solar, wind, and microgrid initiatives. Funds are released only when independent validators confirm milestone completion.
              </p>
            </div>
            <dl className='grid w-full max-w-md grid-cols-2 gap-6 rounded-3xl bg-white/10 p-6 text-left text-sm font-medium lg:w-auto lg:grid-cols-1'>
              <div>
                <dt className='text-emerald-50/80'>Projects actively raising</dt>
                <dd className='mt-1 text-3xl font-semibold'>{totalCount}</dd>
              </div>
              <div>
                <dt className='text-emerald-50/80'>Average estimated yield</dt>
                <dd className='mt-1 text-3xl font-semibold'>6.8%</dd>
              </div>
              <div>
                <dt className='text-emerald-50/80'>Communities powered</dt>
                <dd className='mt-1 text-3xl font-semibold'>320+</dd>
              </div>
            </dl>
          </div>
          <div className='pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl lg:h-72 lg:w-72' aria-hidden='true' />
        </section>

        <section className='rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-8'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-end'>
            <div className='flex-1'>
              <ProjectSearchInput value={searchQuery} onChange={setSearchQuery} onSearch={handleSearch} />
            </div>
            <div className='lg:w-72'>
              <SavedSearches onApplySearch={handleApplySavedSearch} />
            </div>
          </div>

          <div className='mt-6 rounded-2xl border border-emerald-100/70 bg-emerald-50/40 p-4 text-sm text-emerald-800 sm:flex sm:items-center sm:justify-between'>
            <p>
              <strong className='font-semibold'>{totalCount}</strong> regenerative energy projects match your criteria.
            </p>
            <p className='mt-2 text-xs text-emerald-700 sm:mt-0'>
              {activeFilterCount > 0 ? `${activeFilterCount} filters applied` : 'Refine results with smart filters'}
            </p>
          </div>

          <details className='group mt-4 rounded-2xl border border-emerald-100 bg-white/80 transition shadow-sm open:shadow-md'>
            <summary className='cursor-pointer list-none rounded-2xl px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 sm:px-6'>
              Project filters
            </summary>
            <div className='border-t border-emerald-100 px-4 py-4 sm:px-6 sm:py-6'>
              <FilterPanel filters={filters} onChange={handleFilterChange} resultCount={totalCount} />
            </div>
          </details>
        </section>

        <section className='space-y-6'>
          <RecommendedForYou limit={4} />
        </section>

        <section className='space-y-6'>
          <div className='flex flex-col justify-between gap-3 sm:flex-row sm:items-center'>
            <h2 className='text-xl font-semibold text-slate-900'>Explore marketplace</h2>
            <p className='text-sm text-slate-500'>Showing live projects with milestone-protected escrow releases.</p>
          </div>

          <ProjectDiscoveryGrid
            filters={{
              ...filters,
              search: searchQuery || undefined,
            }}
            onProjectClick={handleProjectClick}
          />
        </section>
      </div>
    </Layout>
  );
}






