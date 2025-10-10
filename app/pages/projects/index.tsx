import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/Layout';
import ProjectDashboardLayout from '../../components/projects/ProjectDashboardLayout';
import ProjectBreadcrumbs from '../../components/projects/ProjectBreadcrumbs';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  targetAmount: number;
  currentAmount: number;
  fundingProgress: number;
  creator: {
    username: string;
    reputation: number;
  };
  funderCount: number;
  createdAt: string;
}

/**
 * Projects Dashboard Page
 * 
 * Features:
 * - Role-based navigation
 * - Breadcrumb navigation
 * - Project listing
 * - Filtering & search
 * - Responsive layout
 * - Fast loading (<2s)
 */
export default function ProjectsPage() {
  const { user, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    loadProjects();
  }, [statusFilter, categoryFilter]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(statusFilter && { status: statusFilter }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(search && { search }),
      });

      const response = await fetch(`/api/projects?${params}`);
      const data = await response.json();

      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <ProjectDashboardLayout>
        <ProjectBreadcrumbs />

        <div className="projects-page">
          <div className="page-header">
            <h1>Browse Projects</h1>
            <p>Discover renewable energy projects to support</p>
          </div>

          {/* Filters */}
          <div className="filters">
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && loadProjects()}
              className="search-input"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="FUNDED">Funded</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              <option value="Solar">Solar</option>
              <option value="Wind">Wind</option>
              <option value="Hydro">Hydro</option>
              <option value="Geothermal">Geothermal</option>
              <option value="Biomass">Biomass</option>
            </select>
            <button onClick={loadProjects} className="search-btn">
              Search
            </button>
          </div>

          {/* Projects Grid */}
          <div className="projects-grid">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="no-projects">
                <div className="no-projects-icon">📭</div>
                <h3>No projects found</h3>
                <p>Try adjusting your filters or search terms</p>
              </div>
            ) : (
              projects.map((project) => (
                <div key={project.id} className="project-card-placeholder">
                  <h4>{project.title}</h4>
                  <p>{project.category}</p>
                  <div className="funding-progress">
                    {project.fundingProgress.toFixed(0)}% Funded
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <style jsx>{`
          .projects-page {
            max-width: 1200px;
          }

          .page-header {
            margin-bottom: 2rem;
          }

          .page-header h1 {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
          }

          .page-header p {
            color: #6c757d;
          }

          .filters {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            flex-wrap: wrap;
          }

          .search-input {
            flex: 1;
            min-width: 200px;
            padding: 0.75rem;
            border: 2px solid #e9ecef;
            border-radius: 8px;
          }

          .search-input:focus {
            outline: none;
            border-color: #0d6efd;
          }

          .filter-select {
            padding: 0.75rem;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            cursor: pointer;
          }

          .search-btn {
            padding: 0.75rem 1.5rem;
            background: #0d6efd;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
          }

          .search-btn:hover {
            background: #0b5ed7;
          }

          .projects-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
          }

          .loading-state,
          .no-projects {
            grid-column: 1 / -1;
            text-align: center;
            padding: 4rem 2rem;
          }

          .spinner {
            width: 48px;
            height: 48px;
            border: 4px solid #e9ecef;
            border-top-color: #0d6efd;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 1rem;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .no-projects-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }

          .no-projects h3 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
          }

          .no-projects p {
            color: #6c757d;
          }

          .project-card-placeholder {
            background: white;
            border: 2px solid #e9ecef;
            border-radius: 12px;
            padding: 1.5rem;
          }

          .project-card-placeholder h4 {
            font-size: 1.1rem;
            margin-bottom: 0.5rem;
          }

          .funding-progress {
            margin-top: 1rem;
            color: #0d6efd;
            font-weight: 600;
          }

          @media (max-width: 768px) {
            .projects-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </ProjectDashboardLayout>
    </Layout>
  );
}




