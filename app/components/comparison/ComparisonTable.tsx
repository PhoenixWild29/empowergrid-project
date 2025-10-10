/**
 * ComparisonTable Component
 * 
 * WO-82: Project Comparison Tool
 * Side-by-side comparison of project metrics
 * 
 * Features:
 * - Display key metrics in table format
 * - Highlight best/worst values
 * - Investment scoring
 * - ROI projections
 * - Risk assessment
 */

'use client';

import React from 'react';
import Link from 'next/link';
import {
  ComparisonProject,
  calculateInvestmentScore,
  getScoreRating,
  getScoreColor,
  calculateROIProjection,
  calculateRiskScore,
  getRiskLevel,
  getRiskColor,
} from '../../hooks/useProjectComparison';

interface ComparisonTableProps {
  projects: ComparisonProject[];
  onRemoveProject: (projectId: string) => void;
}

export default function ComparisonTable({ projects, onRemoveProject }: ComparisonTableProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <div className="text-6xl text-gray-300 mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Projects Selected
        </h3>
        <p className="text-gray-600 mb-6">
          Select projects from the discovery page to compare them side-by-side
        </p>
        <Link
          href="/projects/discover"
          className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Browse Projects
        </Link>
      </div>
    );
  }

  // Calculate scores for all projects
  const projectScores = projects.map(p => ({
    project: p,
    investmentScore: calculateInvestmentScore(p),
    roiProjection: calculateROIProjection(p),
    riskScore: calculateRiskScore(p),
  }));

  // Find best values for highlighting
  const bestInvestmentScore = Math.max(...projectScores.map(ps => ps.investmentScore));
  const bestROI = Math.max(...projectScores.map(ps => ps.roiProjection));
  const lowestRisk = Math.min(...projectScores.map(ps => ps.riskScore));

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                Metric
              </th>
              {projects.map((project) => (
                <th
                  key={project.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate max-w-[150px]" title={project.title}>
                      {project.title}
                    </span>
                    <button
                      onClick={() => onRemoveProject(project.id)}
                      className="ml-2 text-red-500 hover:text-red-700"
                      title="Remove from comparison"
                    >
                      ×
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Investment Potential Score */}
            <tr className="bg-blue-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-blue-50 z-10">
                Investment Score
              </td>
              {projectScores.map(({ project, investmentScore }) => (
                <td key={project.id} className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className={`font-bold text-lg ${investmentScore === bestInvestmentScore ? 'text-green-600' : getScoreColor(investmentScore)}`}>
                    {investmentScore.toFixed(1)}/100
                  </div>
                  <div className="text-xs text-gray-500">
                    {getScoreRating(investmentScore)}
                  </div>
                </td>
              ))}
            </tr>

            {/* Status */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                Status
              </td>
              {projects.map((project) => (
                <td key={project.id} className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    project.status === 'FUNDED' ? 'bg-blue-100 text-blue-800' :
                    project.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                    project.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {project.status}
                  </span>
                </td>
              ))}
            </tr>

            {/* Funding Progress */}
            <tr className="bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-gray-50 z-10">
                Funding Progress
              </td>
              {projects.map((project) => (
                <td key={project.id} className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="font-semibold">{project.fundingProgress.toFixed(1)}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${Math.min(project.fundingProgress, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ${project.currentAmount.toLocaleString()} / ${project.targetAmount.toLocaleString()}
                  </div>
                </td>
              ))}
            </tr>

            {/* Energy Capacity */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                Energy Capacity
              </td>
              {projects.map((project) => (
                <td key={project.id} className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="font-semibold">
                    {project.energyCapacity ? `${project.energyCapacity} kW` : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {project.energyCapacity && project.energyCapacity >= 1000
                      ? `(${(project.energyCapacity / 1000).toFixed(2)} MW)`
                      : ''}
                  </div>
                </td>
              ))}
            </tr>

            {/* ROI Projection */}
            <tr className="bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-gray-50 z-10">
                ROI Projection
              </td>
              {projectScores.map(({ project, roiProjection }) => (
                <td key={project.id} className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className={`font-semibold ${roiProjection === bestROI ? 'text-green-600' : ''}`}>
                    {roiProjection.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">Estimated annual</div>
                </td>
              ))}
            </tr>

            {/* Risk Assessment */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                Risk Assessment
              </td>
              {projectScores.map(({ project, riskScore }) => (
                <td key={project.id} className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className={`font-semibold ${riskScore === lowestRisk ? 'text-green-600' : getRiskColor(riskScore)}`}>
                    {getRiskLevel(riskScore)}
                  </div>
                  <div className="text-xs text-gray-500">{riskScore}/100</div>
                </td>
              ))}
            </tr>

            {/* Timeline */}
            <tr className="bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-gray-50 z-10">
                Project Duration
              </td>
              {projects.map((project) => (
                <td key={project.id} className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="font-semibold">{project.duration} days</div>
                  <div className="text-xs text-gray-500">
                    {(project.duration / 30).toFixed(1)} months
                  </div>
                </td>
              ))}
            </tr>

            {/* Location */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                Location
              </td>
              {projects.map((project) => (
                <td key={project.id} className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="font-semibold truncate max-w-[150px]" title={project.location}>
                    {project.location}
                  </div>
                </td>
              ))}
            </tr>

            {/* Category */}
            <tr className="bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-gray-50 z-10">
                Category
              </td>
              {projects.map((project) => (
                <td key={project.id} className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {project.category}
                  </span>
                </td>
              ))}
            </tr>

            {/* Creator Reputation */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                Creator Reputation
              </td>
              {projects.map((project) => (
                <td key={project.id} className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center">
                    <span className="font-semibold">{project.creator.reputation}</span>
                    {project.creator.verified && (
                      <span className="ml-1 text-blue-500" title="Verified">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{project.creator.username}</div>
                </td>
              ))}
            </tr>

            {/* Community Support */}
            <tr className="bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-gray-50 z-10">
                Community Support
              </td>
              {projects.map((project) => (
                <td key={project.id} className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="font-semibold">{project.funderCount} funders</div>
                  <div className="text-xs text-gray-500">
                    {project.milestoneCount} milestones
                  </div>
                </td>
              ))}
            </tr>

            {/* Created Date */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                Created
              </td>
              {projects.map((project) => (
                <td key={project.id} className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="font-semibold">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.floor((Date.now() - new Date(project.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
                  </div>
                </td>
              ))}
            </tr>

            {/* Actions */}
            <tr className="bg-blue-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-blue-50 z-10">
                Actions
              </td>
              {projects.map((project) => (
                <td key={project.id} className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium text-center py-1 px-3 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                    >
                      View Details
                    </Link>
                    <Link
                      href={`/projects/${project.id}/fund`}
                      className="text-white bg-green-600 hover:bg-green-700 font-medium text-center py-1 px-3 rounded transition-colors"
                    >
                      Invest Now
                    </Link>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Scoring Methodology */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <details className="text-sm text-gray-600">
          <summary className="cursor-pointer font-medium text-gray-900 hover:text-gray-700">
            Investment Score Methodology
          </summary>
          <div className="mt-2 space-y-1 text-xs">
            <p>• <strong>Funding Progress (30%):</strong> Higher funding indicates community validation</p>
            <p>• <strong>Energy Capacity (25%):</strong> Larger capacity projects with greater impact</p>
            <p>• <strong>Creator Reputation (20%):</strong> Track record of successful projects</p>
            <p>• <strong>Project Maturity (15%):</strong> Time since creation indicates stability</p>
            <p>• <strong>Community Support (10%):</strong> Number of backers and engagement</p>
          </div>
        </details>
      </div>
    </div>
  );
}

