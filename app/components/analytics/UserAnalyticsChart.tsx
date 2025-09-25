import React from 'react';
import { UserAnalytics } from '../../lib/services/analyticsService';

interface UserAnalyticsChartProps {
  data: UserAnalytics;
}

export const UserAnalyticsChart: React.FC<UserAnalyticsChartProps> = ({ data }) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      {/* User Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-600 mb-2">Total Users</h4>
          <p className="text-2xl font-bold text-blue-900">{formatNumber(data.totalUsers)}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-green-600 mb-2">Active Users</h4>
          <p className="text-2xl font-bold text-green-900">{formatNumber(data.activeUsers)}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-600 mb-2">Verified Users</h4>
          <p className="text-2xl font-bold text-yellow-900">{formatNumber(data.verifiedUsers)}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-purple-600 mb-2">New Today</h4>
          <p className="text-2xl font-bold text-purple-900">{formatNumber(data.newUsersToday)}</p>
        </div>
      </div>

      {/* User Growth Chart */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth (Last 90 Days)</h3>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="h-64 flex items-end space-x-2">
            {data.userGrowth.slice(-30).map((growth, index) => {
              const maxCumulative = Math.max(...data.userGrowth.map(g => g.cumulative));
              const height = maxCumulative > 0 ? (growth.cumulative / maxCumulative) * 100 : 0;

              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-green-500 rounded-t"
                    style={{ height: `${height}%` }}
                  ></div>
                  <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top">
                    {new Date(growth.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Cumulative user registrations</span>
              <span>This month: +{data.newUsersThisMonth}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Contributors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Funders</h3>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Funded
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Projects
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.topFunders.map((funder, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {funder.username}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatCurrency(funder.totalFunded)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {funder.projectsFunded}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Creators</h3>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creator
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Projects
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Success Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.topCreators.map((creator, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {creator.username}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {creator.projectsCreated}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {creator.successRate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reputation Distribution */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reputation Distribution</h3>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="space-y-4">
            {data.reputationDistribution.map((range, index) => {
              const total = data.reputationDistribution.reduce((sum, r) => sum + r.count, 0);
              const percentage = total > 0 ? (range.count / total) * 100 : 0;

              return (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 w-16">
                    {range.range}
                  </span>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-purple-500 h-3 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {range.count}
                  </span>
                  <span className="text-sm text-gray-500 w-12 text-right">
                    ({percentage.toFixed(1)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-indigo-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-indigo-600 mb-2">New Users This Week</h4>
          <p className="text-xl font-bold text-indigo-900">{formatNumber(data.newUsersThisWeek)}</p>
        </div>
        <div className="bg-pink-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-pink-600 mb-2">New Users This Month</h4>
          <p className="text-xl font-bold text-pink-900">{formatNumber(data.newUsersThisMonth)}</p>
        </div>
        <div className="bg-teal-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-teal-600 mb-2">User Retention Rate</h4>
          <p className="text-xl font-bold text-teal-900">
            {data.totalUsers > 0 ? ((data.activeUsers / data.totalUsers) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>
    </div>
  );
};