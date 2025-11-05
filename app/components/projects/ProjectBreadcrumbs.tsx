import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface Breadcrumb {
  label: string;
  href: string;
}

/**
 * Project Breadcrumbs Component
 * 
 * Dynamic breadcrumb navigation based on current route
 */
export default function ProjectBreadcrumbs() {
  const router = useRouter();
  const { pathname } = router;

  const getBreadcrumbs = (): Breadcrumb[] => {
    const breadcrumbs: Breadcrumb[] = [
      { label: 'Home', href: '/' },
    ];

    // Parse pathname to generate breadcrumbs
    if (pathname.startsWith('/projects')) {
      breadcrumbs.push({ label: 'Projects', href: '/projects' });

      if (pathname.includes('/my-projects')) {
        breadcrumbs.push({ label: 'My Projects', href: '/projects/my-projects' });
      } else if (pathname.includes('/investments')) {
        breadcrumbs.push({ label: 'My Investments', href: '/projects/investments' });
      } else if (pathname.match(/\/projects\/[^/]+$/)) {
        breadcrumbs.push({ label: 'Project Details', href: pathname });
      }
    } else if (pathname.startsWith('/create-project')) {
      breadcrumbs.push({ label: 'Projects', href: '/projects' });
      breadcrumbs.push({ label: 'Create Project', href: '/create-project' });
    } else if (pathname.startsWith('/admin/projects')) {
      breadcrumbs.push({ label: 'Admin', href: '/admin' });
      breadcrumbs.push({ label: 'Projects', href: '/admin/projects' });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.href} className="breadcrumb-item">
            {index < breadcrumbs.length - 1 ? (
              <>
                <Link href={crumb.href} className="breadcrumb-link">
                  {crumb.label}
                </Link>
                <span className="breadcrumb-separator">/</span>
              </>
            ) : (
              <span className="breadcrumb-current" aria-current="page">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>

      <style jsx>{`
        .breadcrumbs {
          margin-bottom: 1.5rem;
        }

        .breadcrumb-list {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          list-style: none;
          padding: 0;
          margin: 0;
          flex-wrap: wrap;
        }

        .breadcrumb-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .breadcrumb-link {
          color: #0d6efd;
          text-decoration: none;
          transition: color 0.2s;
        }

        .breadcrumb-link:hover {
          color: #0b5ed7;
          text-decoration: underline;
        }

        .breadcrumb-separator {
          color: #6c757d;
        }

        .breadcrumb-current {
          color: #6c757d;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .breadcrumb-list {
            font-size: 0.85rem;
          }
        }
      `}</style>
    </nav>
  );
}






