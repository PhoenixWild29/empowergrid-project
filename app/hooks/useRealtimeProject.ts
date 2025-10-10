/**
 * useRealtimeProject Hook
 * 
 * WO-89: Hook for real-time project updates
 * Subscribes to project-specific events and updates local state
 */

import { useState, useEffect } from 'react';
import { useRealtime } from '../contexts/RealtimeContext';

interface Project {
  id: string;
  currentAmount: number;
  status: string;
  fundingProgress: number;
  funderCount: number;
  [key: string]: any;
}

export function useRealtimeProject(initialProject: Project) {
  const [project, setProject] = useState(initialProject);
  const { subscribe } = useRealtime();

  useEffect(() => {
    // Subscribe to funding updates
    const unsubscribeFunding = subscribe('project:funded', (data) => {
      if (data.projectId === project.id) {
        setProject(prev => ({
          ...prev,
          currentAmount: data.currentAmount,
          fundingProgress: data.fundingProgress,
          funderCount: prev.funderCount + 1,
        }));
      }
    });

    // Subscribe to status changes
    const unsubscribeStatus = subscribe('project:statusChanged', (data) => {
      if (data.projectId === project.id) {
        setProject(prev => ({
          ...prev,
          status: data.status,
        }));
      }
    });

    return () => {
      unsubscribeFunding();
      unsubscribeStatus();
    };
  }, [project.id, subscribe]);

  return project;
}

/**
 * Hook for milestone completion updates
 */
export function useRealtimeMilestones(projectId: string) {
  const [completedMilestones, setCompletedMilestones] = useState<string[]>([]);
  const { subscribe } = useRealtime();

  useEffect(() => {
    const unsubscribe = subscribe('milestone:completed', (data) => {
      if (data.projectId === projectId) {
        setCompletedMilestones(prev => [...prev, data.milestoneId]);
      }
    });

    return unsubscribe;
  }, [projectId, subscribe]);

  return completedMilestones;
}

/**
 * Hook for new project announcements
 */
export function useNewProjects() {
  const [newProjects, setNewProjects] = useState<any[]>([]);
  const { subscribe } = useRealtime();

  useEffect(() => {
    const unsubscribe = subscribe('project:created', (data) => {
      setNewProjects(prev => [data, ...prev].slice(0, 10)); // Keep last 10
    });

    return unsubscribe;
  }, [subscribe]);

  const clearNewProjects = () => setNewProjects([]);

  return { newProjects, clearNewProjects };
}

