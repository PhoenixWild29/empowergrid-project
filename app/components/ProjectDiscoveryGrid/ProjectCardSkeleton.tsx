/**
 * Project Card Skeleton
 * 
 * Loading placeholder for project cards
 * Improves perceived performance during data fetching
 */

import React from 'react';

export default function ProjectCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
      {/* Image skeleton */}
      <div className="w-full h-48 bg-gray-200 rounded-lg mb-4" />

      {/* Title skeleton */}
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />

      {/* Description skeleton */}
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>

      {/* Metrics skeleton */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="h-12 bg-gray-200 rounded" />
        <div className="h-12 bg-gray-200 rounded" />
      </div>

      {/* Progress bar skeleton */}
      <div className="h-3 bg-gray-200 rounded-full mb-4" />

      {/* Footer skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="h-8 bg-gray-200 rounded w-20" />
      </div>
    </div>
  );
}






