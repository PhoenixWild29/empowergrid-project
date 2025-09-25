'use client';

import React, { useState, useEffect } from 'react';
import { errorTracker, ErrorSeverity, ErrorCategory } from '../lib/monitoring/errorTracker';
import { performanceMonitor } from '../lib/monitoring/performance';
import { memoryMonitor } from '../lib/monitoring/performance';

interface MonitoringDashboardProps {
  isAdmin?: boolean;
}

export default function MonitoringDashboard({ isAdmin = false }: MonitoringDashboardProps) {
  const [errorStats, setErrorStats] = useState(errorTracker.getErrorStats());
  const [performanceMetrics, setPerformanceMetrics] = useState(performanceMonitor.getAllMetrics());
  const [memoryUsage, setMemoryUsage] = useState(memoryMonitor.getMemoryUsage());
  const [selectedTab, setSelectedTab] = useState<'overview' | 'errors' | 'performance'>('overview');

  useEffect(() => {
    // Update stats every 30 seconds
    const interval = setInterval(() => {
      setErrorStats(errorTracker.getErrorStats());
      setPerformanceMetrics(performanceMonitor.getAllMetrics());
      setMemoryUsage(memoryMonitor.getMemoryUsage());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!isAdmin) {
    return null;
  }

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">System Monitoring</h2>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {(['overview', 'errors', 'performance'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                selectedTab === tab
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Error Stats */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">Total Errors</p>
                <p className="text-2xl font-semibold text-red-900">{errorStats.total}</p>
                <p className="text-xs text-red-600">{errorStats.unresolved} unresolved</p>
              </div>
            </div>
          </div>

          {/* Memory Usage */}
          {memoryUsage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">Memory Usage</p>
                  <p className="text-lg font-semibold text-blue-900">{formatBytes(memoryUsage.heapUsed)}</p>
                  <p className="text-xs text-blue-600">of {formatBytes(memoryUsage.heapTotal)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">Active Metrics</p>
                <p className="text-2xl font-semibold text-green-900">{Object.keys(performanceMetrics).length}</p>
                <p className="text-xs text-green-600">performance metrics</p>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800">System Status</p>
                <p className="text-lg font-semibold text-yellow-900">
                  {errorStats.unresolved > 10 ? 'Degraded' : errorStats.unresolved > 5 ? 'Warning' : 'Healthy'}
                </p>
                <p className="text-xs text-yellow-600">based on error count</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Errors Tab */}
      {selectedTab === 'errors' && (
        <div className="space-y-6">
          {/* Error Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(errorStats.bySeverity).map(([severity, count]) => (
              <div key={severity} className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600 capitalize">{severity}</p>
                <p className="text-2xl font-semibold text-gray-900">{count}</p>
              </div>
            ))}
          </div>

          {/* Error Categories */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Errors by Category</h3>
            <div className="space-y-2">
              {Object.entries(errorStats.byCategory).map(([category, count]) => (
                count > 0 && (
                  <div key={category} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {category.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {selectedTab === 'performance' && (
        <div className="space-y-6">
          {/* Performance Metrics */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(performanceMetrics).map(([name, stats]) => (
                stats && (
                  <div key={name} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">{name}</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>Count: {stats.count}</div>
                      <div>Avg: {formatDuration(stats.average)}</div>
                      <div>Min: {formatDuration(stats.min)}</div>
                      <div>Max: {formatDuration(stats.max)}</div>
                      <div>P95: {formatDuration(stats.p95)}</div>
                      <div>P99: {formatDuration(stats.p99)}</div>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Memory Details */}
          {memoryUsage && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Memory Usage Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-600">Heap Used</p>
                  <p className="text-lg font-semibold text-gray-900">{formatBytes(memoryUsage.heapUsed)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-600">Heap Total</p>
                  <p className="text-lg font-semibold text-gray-900">{formatBytes(memoryUsage.heapTotal)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-600">External</p>
                  <p className="text-lg font-semibold text-gray-900">{formatBytes(memoryUsage.external)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-600">RSS</p>
                  <p className="text-lg font-semibold text-gray-900">{formatBytes(memoryUsage.rss)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}