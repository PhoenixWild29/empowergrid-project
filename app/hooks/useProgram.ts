// React hook for program interactions

import { useState, useCallback } from 'react';
import { AsyncState, Project, Milestone } from '../types';
import {
  fetchProjects,
  fetchProject,
  fetchProjectMilestones,
  createProject,
} from '../utils/program';
import { useWallet } from './useWallet';

export const useProjects = () => {
  const [projectsState, setProjectsState] = useState<AsyncState<Project[]>>({
    data: null,
    loading: false,
    error: null,
  });

  const loadProjects = useCallback(async () => {
    setProjectsState({ data: null, loading: true, error: null });

    try {
      const projects = await fetchProjects();
      setProjectsState({ data: projects, loading: false, error: null });
    } catch (error) {
      setProjectsState({
        data: null,
        loading: false,
        error:
          error instanceof Error ? error.message : 'Failed to load projects',
      });
    }
  }, []);

  return {
    ...projectsState,
    loadProjects,
  };
};

export const useProject = (projectId?: number, creator?: string) => {
  const [projectState, setProjectState] = useState<AsyncState<Project | null>>({
    data: null,
    loading: false,
    error: null,
  });

  const [milestonesState, setMilestonesState] = useState<
    AsyncState<Milestone[]>
  >({
    data: null,
    loading: false,
    error: null,
  });

  const loadProject = useCallback(async () => {
    if (!projectId || !creator) return;

    setProjectState({ data: null, loading: true, error: null });

    try {
      const project = await fetchProject(
        projectId,
        new (await import('@solana/web3.js')).PublicKey(creator)
      );
      setProjectState({ data: project, loading: false, error: null });

      // Load milestones if project exists
      if (project) {
        setMilestonesState({ data: null, loading: true, error: null });
        try {
          const milestones = await fetchProjectMilestones(
            new (await import('@solana/web3.js')).PublicKey(project.vault)
          ); // Using vault as proxy for project PDA
          setMilestonesState({ data: milestones, loading: false, error: null });
        } catch (error) {
          setMilestonesState({
            data: null,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to load milestones',
          });
        }
      }
    } catch (error) {
      setProjectState({
        data: null,
        loading: false,
        error:
          error instanceof Error ? error.message : 'Failed to load project',
      });
    }
  }, [projectId, creator]);

  return {
    project: projectState,
    milestones: milestonesState,
    loadProject,
  };
};

export const useCreateProject = () => {
  const { publicKey } = useWallet();
  const [createState, setCreateState] = useState<AsyncState<string>>({
    data: null,
    loading: false,
    error: null,
  });

  const createNewProject = useCallback(
    async (
      name: string,
      description: string,
      governanceAuthority: string,
      oracleAuthority: string,
      milestones: any[]
    ) => {
      if (!publicKey) {
        setCreateState({
          data: null,
          loading: false,
          error: 'Wallet not connected',
        });
        return;
      }

      setCreateState({ data: null, loading: true, error: null });

      try {
        const projectPDA = await createProject(
          name,
          description,
          new (await import('@solana/web3.js')).PublicKey(governanceAuthority),
          new (await import('@solana/web3.js')).PublicKey(oracleAuthority),
          milestones
        );
        setCreateState({ data: projectPDA, loading: false, error: null });
      } catch (error) {
        setCreateState({
          data: null,
          loading: false,
          error:
            error instanceof Error ? error.message : 'Failed to create project',
        });
      }
    },
    [publicKey]
  );

  return {
    ...createState,
    createProject: createNewProject,
  };
};
