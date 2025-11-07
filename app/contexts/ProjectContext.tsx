/**
 * Project Context
 * 
 * Centralized state management for project data with optimistic updates
 * and error recovery using React Context API and React Query
 */

import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { UserRole } from '../types/auth';

// ============================================================================
// Types
// ============================================================================

export interface Project {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  tags: string[];
  status: 'DRAFT' | 'ACTIVE' | 'FUNDED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  targetAmount: number;
  currentAmount: number;
  energyCapacity?: number;
  escrowAddress?: string;
  creatorId: string;
  creator?: {
    id: string;
    username: string;
    walletAddress: string;
  };
  createdAt: string;
  updatedAt: string;
  fundedAt?: string;
  completedAt?: string;
  milestones?: Milestone[];
  fundings?: Funding[];
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  targetAmount: number;
  energyTarget?: number;
  dueDate: string;
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'RELEASED' | 'REJECTED';
  completedAt?: string;
}

export interface Funding {
  id: string;
  projectId: string;
  funderId: string;
  amount: number;
  transactionHash: string;
  createdAt: string;
}

export interface UserFundingPosition {
  projectId: string;
  totalFunded: number;
  fundingCount: number;
  lastFunded: string;
}

interface ProjectState {
  projects: Record<string, Project>;
  userFundingPositions: Record<string, UserFundingPosition>;
  activeFilters: {
    status?: string;
    category?: string;
    search?: string;
  };
  optimisticUpdates: Record<string, Project>;
}

type ProjectAction =
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: { id: string; data: Partial<Project> } }
  | { type: 'REMOVE_PROJECT'; payload: string }
  | { type: 'ADD_OPTIMISTIC_UPDATE'; payload: Project }
  | { type: 'REMOVE_OPTIMISTIC_UPDATE'; payload: string }
  | { type: 'ROLLBACK_OPTIMISTIC_UPDATE'; payload: string }
  | { type: 'SET_USER_FUNDING_POSITIONS'; payload: UserFundingPosition[] }
  | { type: 'SET_FILTERS'; payload: Partial<ProjectState['activeFilters']> };

interface ProjectContextType {
  state: ProjectState;
  
  // CRUD operations
  createProject: (data: any) => Promise<Project>;
  updateProject: (id: string, data: any) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  getProject: (id: string) => Project | undefined;
  getProjects: (filters?: any) => Project[];
  
  // Funding operations
  getUserFundingPosition: (projectId: string) => UserFundingPosition | undefined;
  
  // Filter operations
  setFilters: (filters: Partial<ProjectState['activeFilters']>) => void;
  
  // Loading and error states
  isLoading: boolean;
  error: Error | null;
}

// ============================================================================
// Reducer
// ============================================================================

const initialState: ProjectState = {
  projects: {},
  userFundingPositions: {},
  activeFilters: {},
  optimisticUpdates: {},
};

function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'SET_PROJECTS':
      return {
        ...state,
        projects: action.payload.reduce((acc, project) => {
          acc[project.id] = project;
          return acc;
        }, {} as Record<string, Project>),
      };
    
    case 'ADD_PROJECT':
      return {
        ...state,
        projects: {
          ...state.projects,
          [action.payload.id]: action.payload,
        },
      };
    
    case 'UPDATE_PROJECT':
      const existingProject = state.projects[action.payload.id];
      if (!existingProject) return state;
      
      return {
        ...state,
        projects: {
          ...state.projects,
          [action.payload.id]: {
            ...existingProject,
            ...action.payload.data,
          },
        },
      };
    
    case 'REMOVE_PROJECT':
      const { [action.payload]: removed, ...remainingProjects } = state.projects;
      return {
        ...state,
        projects: remainingProjects,
      };
    
    case 'ADD_OPTIMISTIC_UPDATE':
      return {
        ...state,
        optimisticUpdates: {
          ...state.optimisticUpdates,
          [action.payload.id]: action.payload,
        },
      };
    
    case 'REMOVE_OPTIMISTIC_UPDATE':
      const { [action.payload]: removedOptimistic, ...remainingOptimistic } = state.optimisticUpdates;
      return {
        ...state,
        optimisticUpdates: remainingOptimistic,
      };
    
    case 'ROLLBACK_OPTIMISTIC_UPDATE':
      const { [action.payload]: rolledBack, ...remainingAfterRollback } = state.optimisticUpdates;
      return {
        ...state,
        optimisticUpdates: remainingAfterRollback,
      };
    
    case 'SET_USER_FUNDING_POSITIONS':
      return {
        ...state,
        userFundingPositions: action.payload.reduce((acc, position) => {
          acc[position.projectId] = position;
          return acc;
        }, {} as Record<string, UserFundingPosition>),
      };
    
    case 'SET_FILTERS':
      return {
        ...state,
        activeFilters: {
          ...state.activeFilters,
          ...action.payload,
        },
      };
    
    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface ProjectProviderProps {
  children: ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  const [state, dispatch] = useReducer(projectReducer, initialState);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // ============================================================================
  // React Query Hooks
  // ============================================================================
  
  // Query for projects list (with filters applied)
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['projects', state.activeFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (state.activeFilters.status) params.append('status', state.activeFilters.status);
      if (state.activeFilters.category) params.append('category', state.activeFilters.category);
      if (state.activeFilters.search) params.append('search', state.activeFilters.search);
      
      const response = await fetch(`/api/projects?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      return data.projects as Project[];
    },
    enabled: true,
    staleTime: 30000, // 30 seconds
  });
  
  // Update local state when query data changes
  React.useEffect(() => {
    if (projects) {
      dispatch({ type: 'SET_PROJECTS', payload: projects });
    }
  }, [projects]);
  
  // Query for user funding positions
  const { data: fundingPositions } = useQuery({
    queryKey: ['userFundingPositions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/users/${user.id}/funding-positions`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.positions as UserFundingPosition[];
    },
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });
  
  // Update funding positions when data changes
  React.useEffect(() => {
    if (fundingPositions) {
      dispatch({ type: 'SET_USER_FUNDING_POSITIONS', payload: fundingPositions });
    }
  }, [fundingPositions]);
  
  // ============================================================================
  // Mutations
  // ============================================================================
  
  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create project');
      }
      
      return response.json();
    },
    onMutate: async (newProject) => {
      // Optimistic update: create temporary project
      const optimisticProject: Project = {
        id: `temp-${Date.now()}`,
        ...newProject,
        status: 'DRAFT',
        currentAmount: 0,
        creatorId: user?.id || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      dispatch({ type: 'ADD_OPTIMISTIC_UPDATE', payload: optimisticProject });
      
      return { optimisticProject };
    },
    onSuccess: (data, variables, context) => {
      // Remove optimistic update and add real project
      if (context?.optimisticProject) {
        dispatch({ type: 'REMOVE_OPTIMISTIC_UPDATE', payload: context.optimisticProject.id });
      }
      dispatch({ type: 'ADD_PROJECT', payload: data });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.optimisticProject) {
        dispatch({ type: 'ROLLBACK_OPTIMISTIC_UPDATE', payload: context.optimisticProject.id });
      }
    },
  });
  
  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update project');
      }
      
      return response.json();
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['projects'] });
      
      // Snapshot previous value
      const previousProject = state.projects[id];
      
      // Optimistically update
      dispatch({ type: 'UPDATE_PROJECT', payload: { id, data } });
      
      return { previousProject };
    },
    onSuccess: (data) => {
      dispatch({ type: 'UPDATE_PROJECT', payload: { id: data.id, data } });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error, { id }, context) => {
      // Rollback to previous value
      if (context?.previousProject) {
        dispatch({
          type: 'UPDATE_PROJECT',
          payload: { id, data: context.previousProject },
        });
      }
    },
  });
  
  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete project');
      }
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] });
      
      const previousProject = state.projects[id];
      dispatch({ type: 'REMOVE_PROJECT', payload: id });
      
      return { previousProject };
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error, id, context) => {
      // Rollback
      if (context?.previousProject) {
        dispatch({ type: 'ADD_PROJECT', payload: context.previousProject });
      }
    },
  });
  
  // ============================================================================
  // Context Value
  // ============================================================================
  
  const createProject = useCallback(
    async (data: any) => {
      return createProjectMutation.mutateAsync(data);
    },
    [createProjectMutation]
  );
  
  const updateProject = useCallback(
    async (id: string, data: any) => {
      return updateProjectMutation.mutateAsync({ id, data });
    },
    [updateProjectMutation]
  );
  
  const deleteProject = useCallback(
    async (id: string) => {
      return deleteProjectMutation.mutateAsync(id);
    },
    [deleteProjectMutation]
  );
  
  const getProject = useCallback(
    (id: string) => {
      // Check optimistic updates first
      if (state.optimisticUpdates[id]) {
        return state.optimisticUpdates[id];
      }
      return state.projects[id];
    },
    [state.projects, state.optimisticUpdates]
  );
  
  const getProjects = useCallback(
    (filters?: any) => {
      let projectsList = Object.values(state.projects);
      
      // Add optimistic updates
      const optimisticList = Object.values(state.optimisticUpdates);
      projectsList = [...optimisticList, ...projectsList];
      
      // Apply role-based filtering
      if (user?.role === UserRole.CREATOR) {
        projectsList = projectsList.filter((p) => p.creatorId === user.id);
      }
      
      // Apply additional filters if provided
      if (filters) {
        if (filters.status) {
          projectsList = projectsList.filter((p) => p.status === filters.status);
        }
        if (filters.category) {
          projectsList = projectsList.filter((p) => p.category === filters.category);
        }
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          projectsList = projectsList.filter(
            (p) =>
              p.title.toLowerCase().includes(searchLower) ||
              p.description.toLowerCase().includes(searchLower)
          );
        }
      }
      
      return projectsList;
    },
    [state.projects, state.optimisticUpdates, user]
  );
  
  const getUserFundingPosition = useCallback(
    (projectId: string) => {
      return state.userFundingPositions[projectId];
    },
    [state.userFundingPositions]
  );
  
  const setFilters = useCallback(
    (filters: Partial<ProjectState['activeFilters']>) => {
      dispatch({ type: 'SET_FILTERS', payload: filters });
    },
    []
  );
  
  const value: ProjectContextType = {
    state,
    createProject,
    updateProject,
    deleteProject,
    getProject,
    getProjects,
    getUserFundingPosition,
    setFilters,
    isLoading,
    error: error as Error | null,
  };
  
  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useProjects() {
  const context = useContext(ProjectContext);
  
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  
  return context;
}

export default ProjectContext;
