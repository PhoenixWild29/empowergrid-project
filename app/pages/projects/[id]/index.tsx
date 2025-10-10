/**
 * Project Details Page
 * 
 * WO-68: Project Details Dashboard with Tabbed Navigation
 * Main entry point for detailed project view
 * 
 * Features:
 * - Comprehensive project overview
 * - Tabbed navigation (Overview, Technical, Financial, Updates)
 * - Breadcrumb navigation
 * - Loading and error states
 * - Responsive design
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { SimilarProjects } from '../../../components/recommendations';

// Placeholder for tabs - will be implemented in WO-73, WO-79
interface ProjectData {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  location: string;
  targetAmount: number;
  currentAmount: number;
  fundingProgress: number;
  energyCapacity: number | null;
  creator: any;
  milestones: any[];
  fundings: any[];
  [key: string]: any;
}

export default function ProjectDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'technical' | 'financial' | 'updates'>('overview');

  useEffect(() => {
    if (!id) return;

    async function fetchProject() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/projects/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Project not found');
            return;
          }
          throw new Error('Failed to fetch project');
        }

        const data = await response.json();
        
        if (data.success) {
          setProject(data.project);
        } else {
          throw new Error(data.message || 'Failed to load project');
        }
      } catch (err) {
        console.error('[WO-68] Fetch project error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProject();
  }, [id]);

  // WO-68: Breadcrumb navigation
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Projects', href: '/projects/discover' },
    { label: project?.title || 'Project Details', href: `/projects/${id}` },
  ];

  // WO-68: Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  // WO-68: Error state
  if (error || !project) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <div className="text-6xl text-red-300 mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {error || 'Project not found'}
            </h2>
            <p className="text-gray-600 mb-6">
              The project you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link
              href="/projects/discover"
              className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Browse Projects
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* WO-68: Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.href}>
              {index > 0 && <span>/</span>}
              {index === breadcrumbs.length - 1 ? (
                <span className="text-gray-900 font-medium">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-gray-900">
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* WO-68: Project Header/Overview */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  project.status === 'FUNDED' ? 'bg-blue-100 text-blue-800' :
                  project.status === 'COMPLETED' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {project.status}
                </span>
              </div>
              <p className="text-gray-600 mb-4">{project.description}</p>
              
              {/* Key Metrics Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    ${project.currentAmount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Raised</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {project.fundingProgress.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Funded</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {project.funderCount}
                  </div>
                  <div className="text-sm text-gray-600">Funders</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {project.energyCapacity || 'N/A'} kW
                  </div>
                  <div className="text-sm text-gray-600">Capacity</div>
                </div>
              </div>

              {/* Funding Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Funding Progress</span>
                  <span>${project.targetAmount.toLocaleString()} goal</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(project.fundingProgress, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Creator Info */}
            <div className="ml-8 text-right">
              <div className="text-sm text-gray-600 mb-2">Created by</div>
              <Link
                href={`/profiles/${project.creator.id}`}
                className="flex items-center gap-2 hover:opacity-80"
              >
                {project.creator.avatar && (
                  <img
                    src={project.creator.avatar}
                    alt={project.creator.username}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div className="text-left">
                  <div className="font-semibold text-gray-900">
                    {project.creator.username}
                    {project.creator.verified && (
                      <span className="ml-1 text-blue-500" title="Verified">✓</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {project.creator.reputation} reputation
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* WO-68: Tabbed Navigation */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Tab Headers */}
          <div className="border-b border-gray-200">
            <div className="flex">
              {[
                { key: 'overview', label: 'Overview', icon: '📊' },
                { key: 'technical', label: 'Technical Specs', icon: '⚙️' },
                { key: 'financial', label: 'Financial Analysis', icon: '💰' },
                { key: 'updates', label: 'Updates & Activity', icon: '📝' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`
                    flex-1 px-6 py-4 text-sm font-medium transition-colors
                    ${activeTab === tab.key
                      ? 'border-b-2 border-green-600 text-green-600 bg-green-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <ProjectOverviewTab project={project} />
            )}
            {activeTab === 'technical' && (
              <TechnicalSpecsTab project={project} />
            )}
            {activeTab === 'financial' && (
              <FinancialAnalysisTab project={project} />
            )}
            {activeTab === 'updates' && (
              <UpdatesTab project={project} />
            )}
          </div>
        </div>

        {/* WO-97: Similar Projects */}
        <div className="mt-8">
          <SimilarProjects projectId={project.id} limit={4} />
        </div>
      </div>
    </Layout>
  );
}

/** Tab Components (Placeholders - Enhanced in WO-73, WO-79) */

function ProjectOverviewTab({ project }: { project: ProjectData }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <InfoItem label="Category" value={project.category} />
          <InfoItem label="Location" value={project.location} />
          <InfoItem label="Duration" value={`${project.duration} days`} />
          <InfoItem label="Milestones" value={`${project.completedMilestones}/${project.milestoneCount}`} />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Funders</h3>
        <div className="space-y-2">
          {project.fundings.slice(0, 5).map((funding: any) => (
            <div key={funding.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <img
                  src={funding.funder.avatar || '/placeholder-avatar.png'}
                  alt={funding.funder.username}
                  className="w-8 h-8 rounded-full"
                />
                <span className="font-medium">{funding.funder.username}</span>
              </div>
              <div className="text-sm text-gray-600">
                ${funding.amount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TechnicalSpecsTab({ project }: { project: ProjectData }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Specifications</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <InfoItem label="Energy Capacity" value={project.energyCapacity ? `${project.energyCapacity} kW` : 'N/A'} />
          <InfoItem label="Total Energy Produced" value={`${project.totalEnergyProduced} kWh`} />
          <InfoItem label="Verified Energy" value={`${project.verifiedEnergyProduced} kWh`} />
          <InfoItem label="Technology Type" value={project.category} />
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          🚧 Full technical specifications panel coming in WO-73
        </p>
      </div>
    </div>
  );
}

function FinancialAnalysisTab({ project }: { project: ProjectData }) {
  // WO-79: Will be fully implemented with financial metrics
  const roiEstimate = ((project.energyCapacity || 0) * 0.15).toFixed(1);
  const paybackPeriod = (project.targetAmount / ((project.energyCapacity || 1) * 365 * 0.5)).toFixed(1);
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Metrics</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <InfoItem label="Total Investment" value={`$${project.targetAmount.toLocaleString()}`} />
          <InfoItem label="Average Contribution" value={`$${project.averageFundingAmount.toLocaleString()}`} />
          <InfoItem label="Funding Velocity" value={`${project.fundingVelocity.toFixed(2)}/day`} />
          <InfoItem label="Est. ROI" value={`${roiEstimate}% annually`} />
          <InfoItem label="Est. Payback Period" value={`${paybackPeriod} years`} />
          <InfoItem label="Unique Funders" value={`${project.uniqueFunders}`} />
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          🚧 Full financial analysis panel with NPV, IRR, LCOE coming in WO-79
        </p>
      </div>
    </div>
  );
}

function UpdatesTab({ project }: { project: ProjectData }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Project Updates ({project.totalUpdates})
        </h3>
        {project.updates.length > 0 ? (
          <div className="space-y-4">
            {project.updates.map((update: any) => (
              <div key={update.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <h4 className="font-semibold text-gray-900">{update.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{update.content}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(update.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No updates yet</p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Comments ({project.totalComments})
        </h3>
        {project.comments.length > 0 ? (
          <div className="space-y-3">
            {project.comments.slice(0, 5).map((comment: any) => (
              <div key={comment.id} className="p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-sm">{comment.author.username}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{comment.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No comments yet</p>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="font-semibold text-gray-900">{value}</div>
    </div>
  );
}

