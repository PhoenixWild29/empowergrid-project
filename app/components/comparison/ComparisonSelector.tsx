/**
 * ComparisonSelector Component
 * 
 * WO-82: Project Comparison Tool
 * Button to add/remove projects from comparison
 * 
 * Features:
 * - Visual selection indicator
 * - Add to comparison (up to 5)
 * - Remove from comparison
 * - Disabled state when limit reached
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { useProjectComparison, ComparisonProject } from '../../hooks/useProjectComparison';

interface ComparisonSelectorProps {
  project: ComparisonProject;
  className?: string;
}

export default function ComparisonSelector({ project, className = '' }: ComparisonSelectorProps) {
  const { addProject, removeProject, isSelected, canAddMore, selectionCount } = useProjectComparison();
  const selected = isSelected(project.id);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if inside a link
    e.stopPropagation();

    if (selected) {
      removeProject(project.id);
    } else {
      if (!canAddMore) {
        alert('Maximum 5 projects can be compared at once. Please remove a project first.');
        return;
      }
      const added = addProject(project);
      if (!added) {
        alert('Failed to add project to comparison');
      }
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={!selected && !canAddMore}
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
        ${selected 
          ? 'bg-green-600 text-white hover:bg-green-700' 
          : canAddMore
            ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }
        ${className}
      `}
      title={
        selected 
          ? 'Remove from comparison' 
          : canAddMore 
            ? 'Add to comparison' 
            : 'Maximum 5 projects reached'
      }
    >
      {selected ? (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>In Comparison</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Compare</span>
        </>
      )}
    </button>
  );
}

/**
 * Floating Comparison Bar
 * Shows current comparison selection count and link to comparison page
 */
export function ComparisonBar() {
  const { selectionCount, maxProjects, selectedProjects, clearAll } = useProjectComparison();

  if (selectionCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[300px]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">
            Project Comparison
          </h3>
          <button
            onClick={() => {
              if (confirm('Clear all selected projects?')) {
                clearAll();
              }
            }}
            className="text-gray-400 hover:text-gray-600"
            title="Clear all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Projects selected:</span>
            <span className="font-semibold">{selectionCount}/{maxProjects}</span>
          </div>
          <div className="space-y-1">
            {selectedProjects.map(project => (
              <div key={project.id} className="text-xs text-gray-700 truncate">
                • {project.title}
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/projects/compare"
          className="block w-full text-center bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
        >
          Compare Now
        </Link>
      </div>
    </div>
  );
}

