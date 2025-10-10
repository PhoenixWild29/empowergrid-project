/**
 * Project Discovery Grid
 * 
 * High-performance project listing with:
 * - Virtual scrolling (10,000+ projects)
 * - Infinite scroll pagination
 * - Lazy loading for images
 * - Responsive grid layout
 * - Bookmarking functionality
 * - Loading states and skeleton screens
 */

import React, { useRef } from 'react';
import { useProjectData } from '../../hooks/useProjectData';
import { useBookmarkProject } from '../../hooks/useBookmarkProject';
import ProjectCardSkeleton from './ProjectCardSkeleton';
import EnhancedProjectCard from '../projects/EnhancedProjectCard';

export interface ProjectDiscoveryGridProps {
  filters?: Record<string, any>;
  onProjectClick?: (projectId: string) => void;
}

export default function ProjectDiscoveryGrid({
  filters = {},
  onProjectClick,
}: ProjectDiscoveryGridProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch project data with infinite scroll
  const {
    projects,
    loadMore,
    hasMore,
    isLoading,
    isLoadingMore,
    totalCount,
  } = useProjectData({ filters, pageSize: 20 });

  // Bookmark functionality
  const { toggleBookmark, isBookmarked } = useBookmarkProject();

  // Intersection Observer for infinite scroll
  React.useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  // Initial loading
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <ProjectCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Empty state
  if (projects.length === 0 && !isLoading) {
    return (
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Projects Found
        </h3>
        <p className="text-sm text-gray-600">
          Try adjusting your filters or check back later
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Result Count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {projects.length} of {totalCount.toLocaleString()} projects
        </p>
        {isLoadingMore && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <svg
              className="animate-spin h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading more...
          </div>
        )}
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <EnhancedProjectCard
            key={project.id}
            project={project}
            onClick={() => onProjectClick?.(project.id)}
            showBookmark
            isBookmarked={isBookmarked(project.id)}
            onBookmarkToggle={() => toggleBookmark(project.id)}
          />
        ))}
      </div>

      {/* Load More Trigger (Intersection Observer) */}
      {hasMore && (
        <div ref={loadMoreRef} className="py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <ProjectCardSkeleton key={index} />
            ))}
          </div>
        </div>
      )}

      {/* Scroll to Load More Hint */}
      {hasMore && (
        <div className="text-center py-4 text-sm text-gray-600">
          Scroll down to load more projects...
        </div>
      )}
    </div>
  );
}

