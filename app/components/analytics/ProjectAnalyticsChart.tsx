import React from 'react';
import { ProjectAnalytics } from '../../lib/services/analyticsService';

interface ProjectAnalyticsChartProps {
  data: ProjectAnalytics;
}

export const ProjectAnalyticsChart: React.FC<ProjectAnalyticsChartProps> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="space-y-8">
      {/* Project Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-600 mb-2">Total Projects</h4>
          <p className="text-2xl font-bold text-blue-900">{formatNumber(data.totalProjects)}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-green-600 mb-2">Active Projects</h4>
          <p className="text-2xl font-bold text-green-900">{formatNumber(data.activeProjects)}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-600 mb-2">Funded Projects</h4>
          <p className="text-2xl font-bold text-yellow-900">{formatNumber(data.fundedProjects)}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-purple-600 mb-2">Total Funding</h4>
          <p className="text-2xl font-bold text-purple-900">{formatCurrency(data.totalFunding)}</p>
        </div>
      </div>

      {/* Funding Trends Chart */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Funding Trends (Last 30 Days)</h3>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="h-64 flex items-end space-x-2">
            {data.fundingTrends.map((trend, index) => {
              const maxAmount = Math.max(...data.fundingTrends.map(t => t.amount));
              const height = maxAmount > 0 ? (trend.amount / maxAmount) * 100 : 0;

              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${height}%` }}
                  ></div>
                  <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top">
                    {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Daily funding amounts</span>
              <span>Average: {formatCurrency(data.averageFunding)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Funding by Category</h3>
          <div className="space-y-3">
            {Object.entries(data.fundingByCategory).map(([category, amount]) => {
              const total = Object.values(data.fundingByCategory).reduce((sum, val) => sum + val, 0);
              const percentage = total > 0 ? (amount / total) * 100 : 0;

              return (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{category}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-16 text-right">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Status Distribution</h3>
          <div className="space-y-3">
            {Object.entries(data.projectsByStatus).map(([status, count]) => {
              const total = Object.values(data.projectsByStatus).reduce((sum, val) => sum + val, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;

              return (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{status}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Categories Table */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories</h3>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Projects
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Funding
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.topCategories.map((category, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {category.category}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {category.projectCount}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatCurrency(category.totalFunding)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};