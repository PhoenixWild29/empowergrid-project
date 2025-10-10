/**
 * Project Comparison Page
 * 
 * WO-82: Project Comparison Tool
 * Main page for side-by-side project comparison
 * 
 * Features:
 * - Display comparison table and charts
 * - Fetch project details
 * - Export/share comparison
 * - Manage selected projects
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import ComparisonTable from '../../components/comparison/ComparisonTable';
import ComparisonCharts from '../../components/comparison/ComparisonCharts';
import {
  useProjectComparison,
  ComparisonProject,
} from '../../hooks/useProjectComparison';

export default function ProjectComparisonPage() {
  const router = useRouter();
  const { selectedProjects, removeProject, clearAll, selectionCount } = useProjectComparison();
  const [detailedProjects, setDetailedProjects] = useState<ComparisonProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCharts, setShowCharts] = useState(true);

  // Fetch detailed project information
  useEffect(() => {
    async function fetchProjectDetails() {
      if (selectedProjects.length === 0) {
        setDetailedProjects([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/projects/compare', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectIds: selectedProjects.map(p => p.id),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch project details');
        }

        const data = await response.json();
        
        if (data.success) {
          // Merge with existing data to preserve any additional fields
          const mergedProjects = selectedProjects.map(sp => {
            const detailed = data.projects.find((dp: any) => dp.id === sp.id);
            return detailed ? { ...sp, ...detailed } : sp;
          });
          setDetailedProjects(mergedProjects);
        } else {
          throw new Error(data.message || 'Failed to load projects');
        }
      } catch (err) {
        console.error('[WO-82] Error fetching project details:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        // Use selectedProjects as fallback
        setDetailedProjects(selectedProjects);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjectDetails();
  }, [selectedProjects]);

  const handleExportPDF = async () => {
    alert('PDF export functionality will be implemented with a PDF generation library');
    // TODO: Implement PDF export with jsPDF or similar
  };

  const handleShareLink = () => {
    const projectIds = selectedProjects.map(p => p.id).join(',');
    const shareUrl = `${window.location.origin}/projects/compare?ids=${projectIds}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Comparison link copied to clipboard!');
    }).catch((err) => {
      console.error('Failed to copy link:', err);
      alert('Failed to copy link');
    });
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all selected projects?')) {
      clearAll();
      router.push('/projects/discover');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Project Comparison
              </h1>
              <p className="text-gray-600 mt-2">
                Compare up to 5 renewable energy projects side-by-side
              </p>
            </div>
            <Link
              href="/projects/discover"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              + Add Projects
            </Link>
          </div>

          {/* Selection Summary */}
          {selectionCount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-700">
                    <strong>{selectionCount}</strong> of <strong>5</strong> projects selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCharts(!showCharts)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {showCharts ? 'Hide Charts' : 'Show Charts'}
                    </button>
                    <button
                      onClick={handleShareLink}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Share Link
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Export PDF
                    </button>
                    <button
                      onClick={handleClearAll}
                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && selectionCount > 0 && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading project details...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Comparison Content */}
        {!isLoading && (
          <>
            {/* Comparison Table */}
            <div className="mb-8">
              <ComparisonTable
                projects={detailedProjects}
                onRemoveProject={removeProject}
              />
            </div>

            {/* Comparison Charts */}
            {showCharts && selectionCount > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Visual Comparison
                </h2>
                <ComparisonCharts projects={detailedProjects} />
              </div>
            )}

            {/* Instructions */}
            {selectionCount === 0 && (
              <div className="mt-8 bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  How to Compare Projects
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Browse projects in the <Link href="/projects/discover" className="text-blue-600 hover:underline">discovery page</Link></li>
                  <li>Click the &quot;Add to Compare&quot; button on projects you want to compare</li>
                  <li>Select up to 5 projects</li>
                  <li>Return to this page to view the side-by-side comparison</li>
                  <li>Use the charts and metrics to make informed investment decisions</li>
                </ol>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

