/**
 * useBookmarkProject Hook
 * 
 * Handles project bookmarking logic with API calls and state updates
 */

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface BookmarkedProject {
  projectId: string;
  bookmarkedAt: string;
}

export function useBookmarkProject() {
  const [bookmarkedProjects, setBookmarkedProjects] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('bookmarked_projects');
    if (stored) {
      try {
        const projectIds = JSON.parse(stored);
        setBookmarkedProjects(new Set(projectIds));
      } catch (error) {
        console.error('Failed to load bookmarks:', error);
      }
    }
  }, []);

  // Save bookmarks to localStorage
  const saveBookmarks = useCallback((projectIds: Set<string>) => {
    localStorage.setItem('bookmarked_projects', JSON.stringify(Array.from(projectIds)));
  }, []);

  // Toggle bookmark mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ projectId, bookmark }: { projectId: string; bookmark: boolean }) => {
      const response = await fetch(`/api/projects/${projectId}/bookmark`, {
        method: bookmark ? 'POST' : 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to update bookmark');
      }

      return { projectId, bookmark };
    },
    onSuccess: ({ projectId, bookmark }) => {
      setBookmarkedProjects((prev) => {
        const newSet = new Set(prev);
        if (bookmark) {
          newSet.add(projectId);
        } else {
          newSet.delete(projectId);
        }
        saveBookmarks(newSet);
        return newSet;
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['bookmarked-projects'] });
    },
  });

  const toggleBookmark = useCallback(
    (projectId: string) => {
      const isCurrentlyBookmarked = bookmarkedProjects.has(projectId);
      toggleMutation.mutate({
        projectId,
        bookmark: !isCurrentlyBookmarked,
      });
    },
    [bookmarkedProjects, toggleMutation]
  );

  const isBookmarked = useCallback(
    (projectId: string) => bookmarkedProjects.has(projectId),
    [bookmarkedProjects]
  );

  return {
    toggleBookmark,
    isBookmarked,
    bookmarkedProjects: Array.from(bookmarkedProjects),
    isUpdating: toggleMutation.isPending,
  };
}

export default useBookmarkProject;

