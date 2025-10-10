import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface AdminLayoutProps {
  children: ReactNode;
}

/**
 * WO-175: UI State Management and Navigation System
 * 
 * Consistent admin layout with navigation for all admin pages
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();

  const isActive = (path: string) => {
    return router.pathname === path || router.pathname.startsWith(path + '/');
  };

  const navigationItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
    { name: 'Users', path: '/admin/users', icon: '👥' },
    { name: 'Projects', path: '/admin/projects', icon: '📁' },
    { name: 'Transactions', path: '/admin/transactions', icon: '💳' },
    { name: 'Database', path: '/admin/database', icon: '🗄️' },
    { name: 'Security', path: '/admin/security', icon: '🔒' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white shadow-lg fixed h-screen overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">EmpowerGRID</h2>
          <p className="text-sm text-gray-600 mt-1">Admin Panel</p>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Info Section */}
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-sm font-medium">A</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">admin@empowergrid.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64 flex-1">
        {children}
      </div>
    </div>
  );
}

