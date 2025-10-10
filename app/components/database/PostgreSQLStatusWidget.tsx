import React, { useState, useEffect } from 'react';

interface DatabaseMetrics {
  responseTime: string;
  databaseSize: string;
  databaseSizeValue: number;
  databaseSizeUnit: string;
  activeConnections: number;
  totalConnections: number;
  maxConnections: number;
  version: string;
}

interface DatabaseStatus {
  status: 'connected' | 'disconnected' | 'error';
  connectionStatus: 'healthy' | 'warning' | 'error';
  metrics?: DatabaseMetrics;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * WO-166: PostgreSQL Status Dashboard Widget
 * 
 * Real-time monitoring widget for PostgreSQL database health
 */
export default function PostgreSQLStatusWidget() {
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchDatabaseStatus();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDatabaseStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDatabaseStatus = async () => {
    try {
      setError(null);
      const response = await fetch('/api/database/status');
      const data = await response.json();

      if (response.ok) {
        setDbStatus(data);
        setLastUpdate(new Date());
      } else {
        setError(data.message || 'Failed to fetch database status');
        setDbStatus(data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching database status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch database status');
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!dbStatus) return 'bg-gray-400';
    
    switch (dbStatus.status) {
      case 'connected':
        return 'bg-green-500';
      case 'disconnected':
        return 'bg-red-500';
      case 'error':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    if (!dbStatus) return 'Unknown';
    
    switch (dbStatus.status) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">PostgreSQL Status</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">PostgreSQL Status</h3>
        <button
          onClick={fetchDatabaseStatus}
          className="text-blue-600 hover:text-blue-800 text-sm"
          title="Refresh"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Connection Status */}
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}></div>
          <span className="text-sm font-medium text-gray-700">
            Status: <span className={`font-semibold ${dbStatus?.status === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
              {getStatusText()}
            </span>
          </span>
        </div>
        {dbStatus?.metrics?.version && (
          <p className="text-xs text-gray-500 mt-2">
            {dbStatus.metrics.version}
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
          <button
            onClick={fetchDatabaseStatus}
            className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Metrics */}
      {dbStatus?.metrics && (
        <div className="space-y-4">
          {/* Database Size */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Database Size</span>
              <span className="text-lg font-semibold text-gray-900">
                {dbStatus.metrics.databaseSize}
              </span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{
                  width: `${Math.min((dbStatus.metrics.databaseSizeValue / 10) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Active Connections */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Active Sessions</span>
              <span className="text-lg font-semibold text-gray-900">
                {dbStatus.metrics.activeConnections} / {dbStatus.metrics.maxConnections}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  (dbStatus.metrics.activeConnections / dbStatus.metrics.maxConnections) > 0.8
                    ? 'bg-red-500'
                    : (dbStatus.metrics.activeConnections / dbStatus.metrics.maxConnections) > 0.6
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{
                  width: `${(dbStatus.metrics.activeConnections / dbStatus.metrics.maxConnections) * 100}%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total connections: {dbStatus.metrics.totalConnections}
            </p>
          </div>

          {/* Response Time */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Response Time</span>
              <span className="text-sm font-medium text-gray-900">
                {dbStatus.metrics.responseTime}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Last Update */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

