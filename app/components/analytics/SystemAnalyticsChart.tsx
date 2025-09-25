import React from 'react';
import { SystemAnalytics } from '../../lib/services/analyticsService';

interface SystemAnalyticsChartProps {
  data: SystemAnalytics;
}

export const SystemAnalyticsChart: React.FC<SystemAnalyticsChartProps> = ({ data }) => {
  const formatBytes = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className="space-y-8">
      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-600 mb-2">System Uptime</h4>
          <p className="text-2xl font-bold text-blue-900">{formatTime(data.uptime)}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-green-600 mb-2">Avg Response Time</h4>
          <p className="text-2xl font-bold text-green-900">{data.responseTime.average.toFixed(0)}ms</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-600 mb-2">Error Rate</h4>
          <p className="text-2xl font-bold text-yellow-900">{data.errorRate.toFixed(2)}%</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-purple-600 mb-2">Total API Requests</h4>
          <p className="text-2xl font-bold text-purple-900">{formatNumber(data.apiRequests.total)}</p>
        </div>
      </div>

      {/* Response Time Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time Distribution</h3>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {data.responseTime.average.toFixed(0)}ms
              </div>
              <div className="text-sm text-gray-600">Average</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {data.responseTime.p95.toFixed(0)}ms
              </div>
              <div className="text-sm text-gray-600">95th Percentile</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {data.responseTime.p99.toFixed(0)}ms
              </div>
              <div className="text-sm text-gray-600">99th Percentile</div>
            </div>
          </div>
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 h-4 rounded-full"
                style={{ width: '100%' }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Fast</span>
              <span>Good</span>
              <span>Slow</span>
            </div>
          </div>
        </div>
      </div>

      {/* Memory Usage */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Memory Usage</h3>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {formatBytes(data.memoryUsage.heapUsed)}
              </div>
              <div className="text-sm text-gray-600">Heap Used</div>
              <div className="text-xs text-gray-500 mt-1">
                {((data.memoryUsage.heapUsed / data.memoryUsage.heapTotal) * 100).toFixed(1)}% of heap
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {formatBytes(data.memoryUsage.heapTotal)}
              </div>
              <div className="text-sm text-gray-600">Heap Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {formatBytes(data.memoryUsage.external)}
              </div>
              <div className="text-sm text-gray-600">External</div>
            </div>
          </div>
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full"
                style={{
                  width: `${Math.min((data.memoryUsage.heapUsed / data.memoryUsage.heapTotal) * 100, 100)}%`
                }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1 text-center">
              Heap usage: {((data.memoryUsage.heapUsed / data.memoryUsage.heapTotal) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* API Request Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API Requests by Endpoint</h3>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="space-y-3">
              {Object.entries(data.apiRequests.byEndpoint).map(([endpoint, count]) => {
                const total = data.apiRequests.total;
                const percentage = total > 0 ? (count / total) * 100 : 0;

                return (
                  <div key={endpoint} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 truncate flex-1 mr-2">
                      {endpoint}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {formatNumber(count)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API Requests by Method</h3>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="space-y-3">
              {Object.entries(data.apiRequests.byMethod).map(([method, count]) => {
                const total = data.apiRequests.total;
                const percentage = total > 0 ? (count / total) * 100 : 0;

                const methodColors: Record<string, string> = {
                  'GET': 'bg-green-500',
                  'POST': 'bg-blue-500',
                  'PUT': 'bg-yellow-500',
                  'DELETE': 'bg-red-500',
                };

                return (
                  <div key={method} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 w-12">
                      {method}
                    </span>
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`${methodColors[method] || 'bg-gray-500'} h-2 rounded-full`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {formatNumber(count)}
                      </span>
                      <span className="text-sm text-gray-500 w-10 text-right">
                        ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* System Health Indicators */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Database Connections</span>
              <div className={`w-3 h-3 rounded-full ${data.databaseConnections > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{data.databaseConnections}</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Error Rate</span>
              <div className={`w-3 h-3 rounded-full ${data.errorRate < 5 ? 'bg-green-500' : data.errorRate < 10 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{data.errorRate.toFixed(2)}%</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Response Time</span>
              <div className={`w-3 h-3 rounded-full ${data.responseTime.average < 500 ? 'bg-green-500' : data.responseTime.average < 1000 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{data.responseTime.average.toFixed(0)}ms</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Memory Usage</span>
              <div className={`w-3 h-3 rounded-full ${((data.memoryUsage.heapUsed / data.memoryUsage.heapTotal) * 100) < 80 ? 'bg-green-500' : ((data.memoryUsage.heapUsed / data.memoryUsage.heapTotal) * 100) < 90 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {((data.memoryUsage.heapUsed / data.memoryUsage.heapTotal) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};