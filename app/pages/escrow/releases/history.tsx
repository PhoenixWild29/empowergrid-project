/**
 * Release History Analytics Dashboard
 * 
 * WO-132: Historical release data visualization and analytics
 * 
 * Features:
 * - Comprehensive release history table
 * - Release pattern visualization
 * - Success rate breakdowns
 * - Performance metrics
 * - Filtering and sorting
 * - Optimization recommendations
 * - Performance benchmarking
 * - Export to CSV/PDF
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function ReleaseHistoryAnalyticsDashboard() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all',
  });

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/escrow/releases/analytics?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.analytics);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    const params = new URLSearchParams({ format });
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    window.open(`/api/escrow/releases/compliance-report?${params}`, '_blank');
  };

  if (loading) {
    return <div className="p-8">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="p-8">Failed to load analytics</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Release History Analytics
          </h1>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Export CSV
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Export PDF
            </button>
          </div>
        </div>

        {/* WO-132: Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="all">All</option>
                <option value="successful">Successful</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* WO-132: Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <SummaryCard
            title="Total Releases"
            value={analytics.summary.totalReleases}
            color="blue"
          />
          <SummaryCard
            title="Success Rate"
            value={`${analytics.summary.successRate}%`}
            color="green"
          />
          <SummaryCard
            title="Automation Score"
            value={analytics.performance.automationScore}
            color="purple"
          />
          <SummaryCard
            title="Avg Release Time"
            value={`${Math.round(analytics.performance.avgReleaseTime / 1000)}s`}
            color="orange"
          />
        </div>

        {/* WO-132: Success Rate Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Success Rate Breakdown</h2>
          <div className="space-y-3">
            <BreakdownBar
              label="Successful"
              value={analytics.summary.successful}
              total={analytics.summary.totalReleases}
              color="green"
            />
            <BreakdownBar
              label="Failed"
              value={analytics.summary.failed}
              total={analytics.summary.totalReleases}
              color="red"
            />
            <BreakdownBar
              label="Pending"
              value={analytics.summary.pending}
              total={analytics.summary.totalReleases}
              color="yellow"
            />
          </div>
        </div>

        {/* WO-132: Performance Metrics */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricItem
              label="System Uptime"
              value={`${analytics.performance.reliabilityStats.uptime}%`}
            />
            <MetricItem
              label="Error Rate"
              value={`${Math.round(analytics.performance.reliabilityStats.errorRate * 10) / 10}%`}
            />
            <MetricItem
              label="Avg Confirmation Time"
              value={`${analytics.performance.reliabilityStats.avgConfirmationTime}s`}
            />
            <MetricItem
              label="Timing Accuracy"
              value={`${analytics.performance.avgTimingAccuracy}%`}
            />
          </div>
        </div>

        {/* WO-132: Optimization Recommendations */}
        {analytics.recommendations && analytics.recommendations.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Optimization Recommendations</h2>
            <div className="space-y-3">
              {analytics.recommendations.map((rec: any, idx: number) => (
                <RecommendationCard key={idx} recommendation={rec} />
              ))}
            </div>
          </div>
        )}

        {/* WO-132: Trend Analysis */}
        {analytics.trends && analytics.trends.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Release Trends</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Date</th>
                    <th className="text-right py-2">Total</th>
                    <th className="text-right py-2">Successful</th>
                    <th className="text-right py-2">Failed</th>
                    <th className="text-right py-2">Success Rate</th>
                    <th className="text-right py-2">Avg Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.trends.map((trend: any, idx: number) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-2">{trend.date}</td>
                      <td className="text-right">{trend.total}</td>
                      <td className="text-right text-green-600">{trend.successful}</td>
                      <td className="text-right text-red-600">{trend.failed}</td>
                      <td className="text-right">{Math.round(trend.successRate)}%</td>
                      <td className="text-right">${Math.round(trend.avgAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper components

function SummaryCard({ title, value, color }: { title: string; value: string | number; color: string }) {
  const bgColors = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    purple: 'bg-purple-100',
    orange: 'bg-orange-100',
  };

  return (
    <div className={`${bgColors[color as keyof typeof bgColors]} rounded-lg p-6`}>
      <p className="text-sm text-gray-600 mb-2">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function BreakdownBar({ label, value, total, color }: any) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  const bgColors = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{value} ({Math.round(percentage)}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${bgColors[color as keyof typeof bgColors]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-700">{label}:</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function RecommendationCard({ recommendation }: { recommendation: any }) {
  const priorityColors = {
    HIGH: 'border-red-500 bg-red-50',
    MEDIUM: 'border-yellow-500 bg-yellow-50',
    LOW: 'border-blue-500 bg-blue-50',
  };

  return (
    <div className={`border-l-4 ${priorityColors[recommendation.priority as keyof typeof priorityColors]} p-4 rounded`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold">{recommendation.category}</h4>
        <span className="text-xs px-2 py-1 bg-white rounded">{recommendation.priority}</span>
      </div>
      <p className="text-sm text-gray-700 mb-2">{recommendation.suggestion}</p>
      <p className="text-xs text-gray-500">Expected Impact: {recommendation.expectedImpact}</p>
    </div>
  );
}



