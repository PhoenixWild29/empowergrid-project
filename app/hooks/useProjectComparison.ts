/**
 * useProjectComparison Hook
 * 
 * WO-82: Project Comparison Tool
 * Manages comparison state with localStorage persistence
 * 
 * Features:
 * - Select up to 5 projects for comparison
 * - Persist selections across sessions
 * - Add/remove projects
 * - Clear all comparisons
 * - Check if project is selected
 */

import { useState, useEffect, useCallback } from 'react';

const COMPARISON_STORAGE_KEY = 'empowergrid_comparison_projects';
const MAX_COMPARISON_PROJECTS = 5;

export interface ComparisonProject {
  id: string;
  title: string;
  status: string;
  targetAmount: number;
  currentAmount: number;
  energyCapacity: number | null;
  location: string;
  category: string;
  creatorId: string;
  duration: number; // Duration in days
  createdAt: string;
  fundingProgress: number;
  funderCount: number;
  milestoneCount: number;
  creator: {
    id: string;
    username: string;
    reputation: number;
    verified: boolean;
  };
}

export interface UseProjectComparisonReturn {
  selectedProjects: ComparisonProject[];
  addProject: (project: ComparisonProject) => boolean;
  removeProject: (projectId: string) => void;
  clearAll: () => void;
  isSelected: (projectId: string) => boolean;
  canAddMore: boolean;
  selectionCount: number;
  maxProjects: number;
}

/**
 * Hook for managing project comparison selections
 */
export function useProjectComparison(): UseProjectComparisonReturn {
  const [selectedProjects, setSelectedProjects] = useState<ComparisonProject[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(COMPARISON_STORAGE_KEY);
      if (stored) {
        const projects = JSON.parse(stored) as ComparisonProject[];
        setSelectedProjects(projects.slice(0, MAX_COMPARISON_PROJECTS));
      }
    } catch (error) {
      console.error('[WO-82] Failed to load comparison projects from localStorage:', error);
    }
    
    setIsInitialized(true);
  }, []);

  // Save to localStorage whenever selections change
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;

    try {
      localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(selectedProjects));
    } catch (error) {
      console.error('[WO-82] Failed to save comparison projects to localStorage:', error);
    }
  }, [selectedProjects, isInitialized]);

  /**
   * Add a project to comparison
   * Returns true if added successfully, false if already exists or limit reached
   */
  const addProject = useCallback((project: ComparisonProject): boolean => {
    if (selectedProjects.length >= MAX_COMPARISON_PROJECTS) {
      console.warn(`[WO-82] Cannot add project: Maximum ${MAX_COMPARISON_PROJECTS} projects allowed`);
      return false;
    }

    if (selectedProjects.some(p => p.id === project.id)) {
      console.warn('[WO-82] Project already in comparison list');
      return false;
    }

    setSelectedProjects(prev => [...prev, project]);
    return true;
  }, [selectedProjects]);

  /**
   * Remove a project from comparison
   */
  const removeProject = useCallback((projectId: string) => {
    setSelectedProjects(prev => prev.filter(p => p.id !== projectId));
  }, []);

  /**
   * Clear all selected projects
   */
  const clearAll = useCallback(() => {
    setSelectedProjects([]);
  }, []);

  /**
   * Check if a project is currently selected
   */
  const isSelected = useCallback((projectId: string): boolean => {
    return selectedProjects.some(p => p.id === projectId);
  }, [selectedProjects]);

  const canAddMore = selectedProjects.length < MAX_COMPARISON_PROJECTS;
  const selectionCount = selectedProjects.length;

  return {
    selectedProjects,
    addProject,
    removeProject,
    clearAll,
    isSelected,
    canAddMore,
    selectionCount,
    maxProjects: MAX_COMPARISON_PROJECTS,
  };
}

/**
 * Calculate investment potential score
 * 
 * WO-82: Scoring methodology
 * - Funding Progress: 30%
 * - Energy Capacity: 25%
 * - Creator Reputation: 20%
 * - Project Maturity: 15%
 * - Community Support: 10%
 * 
 * @returns Score from 0-100
 */
export function calculateInvestmentScore(project: ComparisonProject): number {
  // Funding Progress Score (0-30 points)
  // Higher funding progress = more community validation
  const fundingScore = Math.min(project.fundingProgress / 100, 1) * 30;

  // Energy Capacity Score (0-25 points)
  // Logarithmic scale: 1kW = 5pts, 100kW = 15pts, 1000kW = 20pts, 10000kW = 25pts
  const capacityScore = project.energyCapacity 
    ? Math.min(Math.log10(project.energyCapacity) * 8.33, 25)
    : 0;

  // Creator Reputation Score (0-20 points)
  // Reputation: 0-1000 range, normalize to 0-20
  const reputationScore = Math.min((project.creator.reputation / 1000) * 20, 20);

  // Project Maturity Score (0-15 points)
  // Days since creation: 0-365 days, normalize to 0-15
  const createdDate = new Date(project.createdAt);
  const daysSinceCreation = Math.floor(
    (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const maturityScore = Math.min((daysSinceCreation / 365) * 15, 15);

  // Community Support Score (0-10 points)
  // Funders: 1-100+ funders, logarithmic scale
  const supportScore = project.funderCount > 0
    ? Math.min(Math.log10(project.funderCount + 1) * 5, 10)
    : 0;

  // Total score (0-100)
  const totalScore = fundingScore + capacityScore + reputationScore + maturityScore + supportScore;

  return Math.round(totalScore * 10) / 10; // Round to 1 decimal
}

/**
 * Get score rating text
 */
export function getScoreRating(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Very Poor';
}

/**
 * Get score color class
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  if (score >= 20) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Calculate ROI projection (simple estimate)
 * Based on energy capacity and funding status
 */
export function calculateROIProjection(project: ComparisonProject): number {
  // Simple ROI formula: 
  // Base ROI = (Energy Capacity * 0.5) + (Funding Progress * 0.3) + (Creator Reputation * 0.02)
  const capacityFactor = (project.energyCapacity || 0) * 0.5;
  const fundingFactor = project.fundingProgress * 0.3;
  const reputationFactor = project.creator.reputation * 0.02;
  
  const projectedROI = (capacityFactor + fundingFactor + reputationFactor) / 100;
  
  // Cap at 100% ROI for realistic projections
  return Math.min(Math.round(projectedROI * 10) / 10, 100);
}

/**
 * Calculate risk assessment
 * Lower score = lower risk
 */
export function calculateRiskScore(project: ComparisonProject): number {
  let riskScore = 50; // Base risk

  // Lower risk if more funding
  riskScore -= (project.fundingProgress / 100) * 20;

  // Lower risk if creator has good reputation
  riskScore -= (project.creator.reputation / 1000) * 15;

  // Lower risk if more funders (community validation)
  riskScore -= Math.min(Math.log10(project.funderCount + 1) * 5, 10);

  // Higher risk if very new
  const createdDate = new Date(project.createdAt);
  const daysSinceCreation = Math.floor(
    (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceCreation < 7) {
    riskScore += 10;
  }

  // Clamp between 0-100
  return Math.max(0, Math.min(100, Math.round(riskScore)));
}

/**
 * Get risk level text
 */
export function getRiskLevel(riskScore: number): string {
  if (riskScore < 20) return 'Very Low';
  if (riskScore < 40) return 'Low';
  if (riskScore < 60) return 'Moderate';
  if (riskScore < 80) return 'High';
  return 'Very High';
}

/**
 * Get risk color class
 */
export function getRiskColor(riskScore: number): string {
  if (riskScore < 20) return 'text-green-600';
  if (riskScore < 40) return 'text-blue-600';
  if (riskScore < 60) return 'text-yellow-600';
  if (riskScore < 80) return 'text-orange-600';
  return 'text-red-600';
}

