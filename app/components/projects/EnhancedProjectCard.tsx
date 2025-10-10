import React from 'react';
import Link from 'next/link';

interface ProjectCardProps {
  project: {
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
    energyCapacity?: number;
    createdAt: string;
  };
  layout?: 'grid' | 'list';
  loading?: boolean;
  onClick?: () => void;
  showBookmark?: boolean;
  isBookmarked?: boolean;
  onBookmarkToggle?: () => void;
}

/**
 * Enhanced Project Card Component
 * 
 * Features:
 * - Grid and list layouts
 * - Status indicators with color coding
 * - Funding progress bars
 * - Clickable navigation to details
 * - Loading states
 * - Responsive design
 * - Graceful handling of missing data
 */
export default function EnhancedProjectCard({ 
  project, 
  layout = 'grid', 
  loading = false,
  onClick,
  showBookmark = false,
  isBookmarked = false,
  onBookmarkToggle,
}: ProjectCardProps) {
  if (loading) {
    return (
      <div className={`project-card loading ${layout}`}>
        <div className="skeleton skeleton-title"></div>
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-progress"></div>

        <style jsx>{`
          .project-card.loading {
            background: white;
            border: 2px solid #e9ecef;
            border-radius: 12px;
            padding: 1.5rem;
          }

          .skeleton {
            background: #e9ecef;
            border-radius: 4px;
            animation: pulse 1.5s ease-in-out infinite;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }

          .skeleton-title {
            height: 24px;
            width: 70%;
            margin-bottom: 1rem;
          }

          .skeleton-text {
            height: 16px;
            width: 100%;
            margin-bottom: 0.5rem;
          }

          .skeleton-progress {
            height: 8px;
            width: 100%;
            margin-top: 1rem;
          }
        `}</style>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; bg: string; label: string }> = {
      DRAFT: { color: '#6c757d', bg: '#e9ecef', label: 'Draft' },
      ACTIVE: { color: '#0d6efd', bg: '#cfe2ff', label: 'Active' },
      FUNDED: { color: '#198754', bg: '#d1e7dd', label: 'Funded' },
      IN_PROGRESS: { color: '#fd7e14', bg: '#ffe5d9', label: 'In Progress' },
      COMPLETED: { color: '#198754', bg: '#d1e7dd', label: 'Completed' },
      CANCELLED: { color: '#dc3545', bg: '#f8d7da', label: 'Cancelled' },
    };
    return configs[status] || configs.DRAFT;
  };

  const statusConfig = getStatusConfig(project.status);

  const cardContent = (
    <div className={`project-card-inner ${layout}`}>
      <div className="card-header">
        <div className="status-badge" style={{ background: statusConfig.bg, color: statusConfig.color }}>
          {statusConfig.label}
        </div>
        <div className="header-right">
          <div className="category-badge">{project.category}</div>
          {showBookmark && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onBookmarkToggle?.();
              }}
              className="bookmark-btn"
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark project'}
            >
              <svg
                className="w-5 h-5"
                fill={isBookmarked ? 'currentColor' : 'none'}
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <h3 className="project-title">{project.title}</h3>
      <p className="project-description">
        {project.description.substring(0, layout === 'grid' ? 120 : 200)}
        {project.description.length > (layout === 'grid' ? 120 : 200) && '...'}
      </p>

      {/* Funding Progress */}
      <div className="funding-section">
        <div className="funding-header">
          <span className="funding-label">Funding Progress</span>
          <span className="funding-percentage">{project.fundingProgress.toFixed(0)}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ 
              width: `${Math.min(project.fundingProgress, 100)}%`,
              background: project.fundingProgress >= 100 ? '#198754' : '#0d6efd',
            }}
          ></div>
        </div>
        <div className="funding-details">
          <span>{project.currentAmount.toFixed(2)} SOL</span>
          <span>of {project.targetAmount.toFixed(2)} SOL</span>
        </div>
      </div>

      {/* Project Metrics */}
      <div className="project-metrics">
        {project.energyCapacity && (
          <div className="metric">
            <span className="metric-icon">⚡</span>
            <span className="metric-value">{project.energyCapacity} kW</span>
          </div>
        )}
        <div className="metric">
          <span className="metric-icon">👥</span>
          <span className="metric-value">{project.funderCount} funders</span>
        </div>
      </div>

      {/* Creator Info */}
      <div className="creator-info">
        <span className="creator-label">By</span>
        <span className="creator-name">{project.creator.username}</span>
        <span className="creator-reputation">⭐ {project.creator.reputation}</span>
      </div>

      </div>
  );

  if (onClick) {
    return (
      <div onClick={onClick} className="project-card cursor-pointer">
        {cardContent}
        <style jsx>{`
          .project-card {
            display: block;
            background: white;
            border: 2px solid #e9ecef;
            border-radius: 12px;
            padding: 1.5rem;
            text-decoration: none;
            color: inherit;
            transition: all 0.2s;
          }

          .project-card:hover {
            border-color: #0d6efd;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
          }

          .header-right {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .bookmark-btn {
            background: none;
            border: none;
            padding: 0.5rem;
            cursor: pointer;
            color: #fbbf24;
            transition: all 0.2s;
          }

          .bookmark-btn:hover {
            transform: scale(1.1);
          }
        `}</style>
      </div>
    );
  }

  return (
    <Link href={`/projects/${project.id}`} className="project-card">
      {cardContent}
      <style jsx>{`
        .project-card {
          display: block;
          background: white;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          padding: 1.5rem;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s;
          cursor: pointer;
        }

        .project-card:hover {
          border-color: #0d6efd;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .project-card.list {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .status-badge,
        .category-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .bookmark-btn {
          background: none;
          border: none;
          padding: 0.5rem;
          cursor: pointer;
          color: #fbbf24;
          transition: all 0.2s;
        }

        .bookmark-btn:hover {
          transform: scale(1.1);
        }

        .category-badge {
          background: #f8f9fa;
          color: #495057;
        }

        .project-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          line-height: 1.3;
        }

        .project-description {
          color: #6c757d;
          font-size: 0.9rem;
          line-height: 1.5;
          margin-bottom: 1rem;
        }

        .funding-section {
          margin-bottom: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .funding-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .funding-label {
          font-size: 0.85rem;
          color: #6c757d;
          font-weight: 600;
        }

        .funding-percentage {
          font-weight: 700;
          color: #0d6efd;
        }

        .progress-bar {
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .funding-details {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: #495057;
        }

        .project-metrics {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .metric {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: #f8f9fa;
          border-radius: 6px;
          font-size: 0.85rem;
        }

        .metric-icon {
          font-size: 1.1rem;
        }

        .creator-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid #e9ecef;
          font-size: 0.85rem;
        }

        .creator-label {
          color: #6c757d;
        }

        .creator-name {
          font-weight: 600;
        }

        .creator-reputation {
          margin-left: auto;
          color: #ffc107;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .project-card.list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Link>
  );
}

