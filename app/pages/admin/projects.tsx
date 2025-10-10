import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  targetAmount: number;
  currentAmount: number;
  duration: number;
  creator: {
    id: string;
    username: string;
    email: string | null;
  };
  _count: {
    fundings: number;
    milestones: number;
  };
}

/**
 * WO-172: Project Management Interface with Full CRUD Functionality
 * 
 * Comprehensive interface for managing projects with pagination, search, and filtering
 */
export default function ProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchProjects();
  }, [currentPage, searchQuery, statusFilter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });

      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/admin/projects?${params}`);
      
      if (!response.ok) throw new Error('Failed to fetch projects');

      const data = await response.json();
      setProjects(data.projects || []);
      setPagination(data.pagination);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      ACTIVE: 'bg-blue-100 text-blue-800',
      FUNDED: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-purple-100 text-purple-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.DRAFT;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {/* Search and Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="FUNDED">Funded</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button onClick={fetchProjects} className="mt-2 text-red-600 hover:text-red-800 font-medium">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 gap-6">
              {projects.map((project) => (
                <div key={project.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{project.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(project.status)}`}>
                          {project.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Creator: {project.creator.username}</span>
                        <span>•</span>
                        <span>{project._count.fundings} funders</span>
                        <span>•</span>
                        <span>{project._count.milestones} milestones</span>
                      </div>
                    </div>
                    <Link
                      href={`/admin/projects/${project.id}`}
                      className="ml-4 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                  
                  {/* Funding Progress */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Funding Progress</span>
                      <span className="font-medium text-gray-900">
                        ${project.currentAmount.toLocaleString()} / ${project.targetAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min((project.currentAmount / project.targetAmount) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-gray-500">
                    Duration: {project.duration} days
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex justify-center items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

