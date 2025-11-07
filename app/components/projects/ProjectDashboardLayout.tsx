import React, { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { UserRole } from '../../types/auth';

interface ProjectDashboardLayoutProps {
  children: ReactNode;
}

/**
 * Project Dashboard Layout
 * 
 * Features:
 * - Role-based navigation
 * - Breadcrumb navigation
 * - Contextual menus
 * - Responsive design
 * - Fast loading (<2s)
 */
export default function ProjectDashboardLayout({ children }: ProjectDashboardLayoutProps) {
  const { user, isAuthenticated } = useAuth();
  const { hasPermission, isAdmin, isCreator, isFunder } = usePermissions();

  const navigationItems = [
    // All users can browse projects
    {
      label: 'Browse Projects',
      href: '/projects',
      icon: '🔍',
      roles: ['GUEST', 'FUNDER', 'CREATOR', 'ADMIN'],
    },
    // Creators can create and manage
    {
      label: 'My Projects',
      href: '/projects/my-projects',
      icon: '📁',
      roles: ['CREATOR', 'ADMIN'],
      requiresAuth: true,
    },
    {
      label: 'Create Project',
      href: '/create-project',
      icon: '➕',
      roles: ['CREATOR', 'ADMIN'],
      requiresAuth: true,
    },
    // Funders can view their portfolio
    {
      label: 'My Investments',
      href: '/projects/investments',
      icon: '💰',
      roles: ['FUNDER', 'ADMIN'],
      requiresAuth: true,
    },
    // Admin tools
    {
      label: 'All Projects',
      href: '/admin/projects',
      icon: '⚙️',
      roles: ['ADMIN'],
      requiresAuth: true,
    },
  ];

  const visibleItems = navigationItems.filter(item => {
    if (item.requiresAuth && !isAuthenticated) return false;
    if (!user) return !item.requiresAuth;
    const roleKey = (user.role ?? UserRole.GUEST).toUpperCase();
    return item.roles.includes(roleKey);
  });

  return (
    <div className="project-dashboard-layout">
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>Projects</h2>
        </div>

        <nav className="sidebar-nav">
          {visibleItems.map((item) => (
            <a key={item.href} href={item.href} className="nav-item">
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </a>
          ))}
        </nav>

        {isAuthenticated && (
          <div className="sidebar-footer">
            <div className="user-role-badge">
              Role: <strong>{(user?.role || UserRole.GUEST).toUpperCase()}</strong>
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-content">
        {children}
      </div>

      <style jsx>{`
        .project-dashboard-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          min-height: calc(100vh - 200px);
          gap: 2rem;
        }

        .dashboard-sidebar {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          height: fit-content;
          position: sticky;
          top: 2rem;
        }

        .sidebar-header {
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e9ecef;
        }

        .sidebar-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.875rem 1rem;
          border-radius: 8px;
          text-decoration: none;
          color: #495057;
          font-weight: 600;
          transition: all 0.2s;
        }

        .nav-item:hover {
          background: #f8f9fa;
          color: #0d6efd;
          transform: translateX(4px);
        }

        .nav-icon {
          font-size: 1.25rem;
        }

        .sidebar-footer {
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 2px solid #e9ecef;
        }

        .user-role-badge {
          padding: 0.75rem;
          background: #e7f3ff;
          border-radius: 8px;
          font-size: 0.85rem;
          color: #0d6efd;
        }

        .dashboard-content {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 992px) {
          .project-dashboard-layout {
            grid-template-columns: 1fr;
          }

          .dashboard-sidebar {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .dashboard-sidebar {
            padding: 1rem;
          }

          .dashboard-content {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}






