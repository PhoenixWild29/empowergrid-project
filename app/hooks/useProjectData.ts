/**
 * useProjectData Hook
 * 
 * Custom hook for fetching project data with infinite scroll pagination
 * and managing loading states
 */

import { useState, useEffect, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

export interface ProjectListItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  targetAmount: number;
  currentAmount: number;
  fundingProgress: number;
  energyCapacity?: number;
  location: string;
  creator: {
    id: string;
    username: string;
    reputation: number;
    verified: boolean;
  };
  funderCount: number;
  milestoneCount: number;
  createdAt: string;
}

export interface ProjectListResponse {
  success: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  projects: ProjectListItem[];
}

export interface UseProjectDataOptions {
  filters?: Record<string, any>;
  pageSize?: number;
  enabled?: boolean;
}

export function useProjectData({
  filters = {},
  pageSize = 20,
  enabled = true,
}: UseProjectDataOptions = {}) {
  const [allProjects, setAllProjects] = useState<ProjectListItem[]>([]);

  // Fetch projects with infinite query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['projects', 'infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: pageSize.toString(),
        ...filters,
      });

      const response = await fetch(`/api/projects?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data: ProjectListResponse = await response.json();
      return data;
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled,
  });

  // Flatten all pages into single array
  useEffect(() => {
    if (data?.pages) {
      const flattened = data.pages.flatMap((page) => page.projects);
      setAllProjects(flattened);
    }
  }, [data]);

  // Load more function
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    projects: allProjects,
    loadMore,
    hasMore: hasNextPage,
    isLoading,
    isLoadingMore: isFetchingNextPage,
    isError,
    error,
    totalCount: data?.pages[0]?.pagination.total || 0,
  };
}

export default useProjectData;






