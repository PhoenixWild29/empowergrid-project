/**
 * useProjects Hook
 * 
 * Custom hook for accessing project state and operations
 * Provides a clean interface to the ProjectContext
 */

import { useProjects as useProjectsContext } from '../contexts/ProjectContext';

export { useProjectsContext as useProjects };

// Re-export types for convenience
export type {
  Project,
  Milestone,
  Funding,
  UserFundingPosition,
} from '../contexts/ProjectContext';

/**
 * Hook for accessing individual project data
 * 
 * @param projectId - Project ID to retrieve
 * @returns Project data or undefined
 */
export function useProject(projectId: string) {
  const { getProject, isLoading, error } = useProjectsContext();
  
  return {
    project: getProject(projectId),
    isLoading,
    error,
  };
}

/**
 * Hook for accessing filtered projects
 * 
 * @param filters - Optional filters to apply
 * @returns Filtered projects array
 */
export function useProjectList(filters?: {
  status?: string;
  category?: string;
  search?: string;
}) {
  const { getProjects, isLoading, error } = useProjectsContext();
  
  return {
    projects: getProjects(filters),
    isLoading,
    error,
  };
}

/**
 * Hook for project CRUD operations
 * 
 * @returns Project management functions
 */
export function useProjectActions() {
  const { createProject, updateProject, deleteProject } = useProjectsContext();
  
  return {
    createProject,
    updateProject,
    deleteProject,
  };
}

/**
 * Hook for user funding positions
 * 
 * @param projectId - Optional project ID to get specific position
 * @returns Funding position data
 */
export function useUserFunding(projectId?: string) {
  const { getUserFundingPosition } = useProjectsContext();
  
  if (projectId) {
    return {
      position: getUserFundingPosition(projectId),
    };
  }
  
  return {
    position: undefined,
  };
}

export default useProjectsContext;




