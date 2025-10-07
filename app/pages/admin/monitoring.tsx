import React, { useState, useEffect } from 'react';
import { MonitoringDashboard } from '../../components/monitoring/MonitoringDashboard';
import { usePerformanceMonitoring } from '../../lib/hooks/usePerformance';
import { alertManager } from '../../lib/monitoring/alerts';
import { logger } from '../../lib/logging/logger';

interface MonitoringPageProps {}

const MonitoringPage: React.FC<MonitoringPageProps> = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const { renderCount } = usePerformanceMonitoring('AdminMonitoringPage');

  useEffect(() => {
    // Simple authorization check - in production, use proper auth
    const checkAuth = async () => {
      try {
        // Check if user has admin role (simplified)
        const isAdmin = localStorage.getItem('userRole') === 'admin';
        setIsAuthorized(isAdmin);

        if (!isAdmin) {
          logger.warn('Unauthorized access attempt to monitoring dashboard');
        }
      } catch (error) {
        logger.error('Auth check failed', { error });
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Monitoring Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Real-time performance metrics, alerts, and system health monitoring
          </p>
        </div>

        <div className="space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-gray-500 truncate">System Status</dt>
                  <dd className="text-lg font-semibold text-gray-900">Healthy</dd>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">⚡</span>
                  </div>
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Alerts</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {alertManager.getAlertStats().unresolved}
                  </dd>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">📊</span>
                  </div>
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-gray-500 truncate">Uptime</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {Math.floor(process.uptime() / 3600)}h
                  </dd>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">🔄</span>
                  </div>
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-gray-500 truncate">Version</dt>
                  <dd className="text-lg font-semibold text-gray-900">v1.0.0</dd>
                </div>
              </div>
            </div>
          </div>

          {/* Main Monitoring Dashboard */}
          <MonitoringDashboard />

          {/* Additional Admin Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Administrative Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => window.open('/api/monitoring/health', '_blank')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Health Check
              </button>
              <button
                onClick={() => window.open('/api/monitoring/metrics', '_blank')}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                View Metrics
              </button>
              <button
                onClick={() => {
                  if (confirm('Run performance tests? This may take a few minutes.')) {
                    // Trigger performance test
                    fetch('/api/monitoring/performance-test', { method: 'POST' })
                      .then(() => alert('Performance test started'))
                      .catch(() => alert('Failed to start performance test'));
                  }
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                Run Performance Test
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringPage;