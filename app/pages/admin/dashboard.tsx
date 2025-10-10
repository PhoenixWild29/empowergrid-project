import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PostgreSQLStatusWidget from '../../components/database/PostgreSQLStatusWidget';

interface SystemMetrics {
  totalUsers: number;
  totalProjects: number;
  totalTransactions: number;
  totalVolume: number;
  activeProjects: number;
  completedProjects: number;
  recentActivity: Array<{
    type: 'user' | 'project' | 'transaction';
    message: string;
    timestamp: string;
  }>;
}

/**
 * WO-163: Dashboard Component with System Overview
 * 
 * Central admin dashboard providing at-a-glance system status
 * with quick access navigation to management interfaces
 */
export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      
      // Fetch metrics from multiple endpoints
      const [usersRes, projectsRes, transactionsRes] = await Promise.all([
        fetch('/api/admin/users?limit=1'),
        fetch('/api/admin/projects?limit=1'),
        fetch('/api/admin/transactions?limit=1'),
      ]);

      if (!usersRes.ok || !projectsRes.ok || !transactionsRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const [usersData, projectsData, transactionsData] = await Promise.all([
        usersRes.json(),
        projectsRes.json(),
        transactionsRes.json(),
      ]);

      // Calculate metrics
      const totalVolume = transactionsData.transactions?.reduce(
        (sum: number, tx: any) => sum + (tx.amount || 0),
        0
      ) || 0;

      setMetrics({
        totalUsers: usersData.pagination?.total || 0,
        totalProjects: projectsData.pagination?.total || 0,
        totalTransactions: transactionsData.pagination?.total || 0,
        totalVolume,
        activeProjects: projectsData.projects?.filter((p: any) => p.status === 'ACTIVE').length || 0,
        completedProjects: projectsData.projects?.filter((p: any) => p.status === 'COMPLETED').length || 0,
        recentActivity: [
          // Mock recent activity - in production, fetch from a dedicated endpoint
          { type: 'user', message: 'New user registered', timestamp: new Date().toISOString() },
          { type: 'project', message: 'Project created', timestamp: new Date().toISOString() },
          { type: 'transaction', message: 'New funding received', timestamp: new Date().toISOString() },
        ],
      });

      setLastUpdate(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <span className="text-red-600 text-2xl">⚠</span>
          </div>
          <h2 className="text-xl font-semibold text-center text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-center text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* System Status Overview */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Users */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{metrics?.totalUsers || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-2xl">👥</span>
                </div>
              </div>
            </div>

            {/* Total Projects */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Projects</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{metrics?.totalProjects || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {metrics?.activeProjects || 0} active • {metrics?.completedProjects || 0} completed
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-2xl">📁</span>
                </div>
              </div>
            </div>

            {/* Total Transactions */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Transactions</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{metrics?.totalTransactions || 0}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-2xl">💳</span>
                </div>
              </div>
            </div>

            {/* Total Volume */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Volume</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    ${((metrics?.totalVolume || 0) / 1_000_000).toFixed(2)}M
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-2xl">💰</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Access Navigation */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User Management */}
            <Link
              href="/admin/users"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-blue-600 text-xl">👥</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
              </div>
              <p className="text-gray-600 text-sm">
                View, create, edit, and manage user accounts
              </p>
            </Link>

            {/* Project Management */}
            <Link
              href="/admin/projects"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-green-600 text-xl">📁</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Project Management</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Oversee and manage all projects in the system
              </p>
            </Link>

            {/* Transaction Management */}
            <Link
              href="/admin/transactions"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-purple-600 text-xl">💳</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Transaction Management</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Monitor and analyze all financial transactions
              </p>
            </Link>
          </div>
        </section>

        {/* Database Status Widget - WO-166 */}
        <section className="mb-8">
          <PostgreSQLStatusWidget />
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <div className="bg-white rounded-lg shadow">
            <ul className="divide-y divide-gray-200">
              {metrics?.recentActivity.map((activity, index) => (
                <li key={index} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          activity.type === 'user'
                            ? 'bg-blue-100 text-blue-600'
                            : activity.type === 'project'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-purple-100 text-purple-600'
                        }`}
                      >
                        {activity.type === 'user' ? '👤' : activity.type === 'project' ? '📁' : '💳'}
                      </div>
                      <span className="text-gray-800">{activity.message}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

