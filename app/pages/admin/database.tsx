import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface ConnectionDetails {
  host: string;
  port: string;
  database: string;
  user: string;
  ssl: boolean;
  status: 'connected' | 'disconnected';
}

interface PoolStatus {
  maxConnections: number;
  activeConnections: number;
  availableConnections: number;
  status: string;
}

interface ConnectionInfo {
  connectionDetails: ConnectionDetails;
  poolStatus: PoolStatus;
  timestamp: string;
}

interface TestResult {
  success: boolean;
  testResult: 'success' | 'failed';
  message: string;
  details?: {
    responseTime: string;
    database?: string;
    user?: string;
    version?: string;
  };
  error?: string;
}

/**
 * WO-171: Connection Management Panel for PostgreSQL Administration
 * 
 * Administrative interface for viewing and managing PostgreSQL connections
 */
export default function DatabaseConnectionPanel() {
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  useEffect(() => {
    fetchConnectionInfo();
  }, []);

  const fetchConnectionInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/database/connection');
      const data = await response.json();

      if (response.ok) {
        setConnectionInfo(data);
      } else {
        setError(data.message || 'Failed to fetch connection info');
        if (data.connectionDetails) {
          setConnectionInfo(data);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching connection info:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch connection info');
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      
      const response = await fetch('/api/database/connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testConnection: true }),
      });

      const data = await response.json();
      setTestResult(data);
      setTesting(false);
    } catch (err) {
      console.error('Error testing connection:', err);
      setTestResult({
        success: false,
        testResult: 'failed',
        message: err instanceof Error ? err.message : 'Connection test failed',
      });
      setTesting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'healthy':
        return 'text-green-600';
      case 'disconnected':
      case 'error':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'healthy':
        return '✓';
      case 'disconnected':
      case 'error':
        return '✗';
      default:
        return '⚠';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">PostgreSQL Connection Management</h1>
          <p className="text-sm text-gray-600 mt-1">View and test database connection settings</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
          </div>
        )}

        {/* Error State */}
        {error && !connectionInfo && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchConnectionInfo}
              className="mt-2 text-red-600 hover:text-red-800 font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Connection Details */}
        {connectionInfo && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Connection Information Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Connection Details</h2>
              
              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Status</span>
                  <span className={`font-semibold flex items-center gap-2 ${getStatusColor(connectionInfo.connectionDetails.status)}`}>
                    <span>{getStatusIcon(connectionInfo.connectionDetails.status)}</span>
                    {connectionInfo.connectionDetails.status.charAt(0).toUpperCase() + connectionInfo.connectionDetails.status.slice(1)}
                  </span>
                </div>

                {/* Host */}
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Host</span>
                  <span className="font-mono text-gray-900">{connectionInfo.connectionDetails.host}</span>
                </div>

                {/* Port */}
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Port</span>
                  <span className="font-mono text-gray-900">{connectionInfo.connectionDetails.port}</span>
                </div>

                {/* Database */}
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Database</span>
                  <span className="font-mono text-gray-900">{connectionInfo.connectionDetails.database}</span>
                </div>

                {/* User */}
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">User</span>
                  <span className="font-mono text-gray-900">{connectionInfo.connectionDetails.user}</span>
                </div>

                {/* SSL */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">SSL/TLS Encryption</span>
                  <span className={`font-semibold ${connectionInfo.connectionDetails.ssl ? 'text-green-600' : 'text-gray-500'}`}>
                    {connectionInfo.connectionDetails.ssl ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Connection Pool Status Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Connection Pool Status</h2>
              
              <div className="space-y-4">
                {/* Pool Status */}
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Pool Status</span>
                  <span className={`font-semibold ${getStatusColor(connectionInfo.poolStatus.status)}`}>
                    {connectionInfo.poolStatus.status.charAt(0).toUpperCase() + connectionInfo.poolStatus.status.slice(1)}
                  </span>
                </div>

                {/* Active Connections */}
                <div className="py-2 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Active Connections</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {connectionInfo.poolStatus.activeConnections}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        (connectionInfo.poolStatus.activeConnections / connectionInfo.poolStatus.maxConnections) > 0.8
                          ? 'bg-red-500'
                          : (connectionInfo.poolStatus.activeConnections / connectionInfo.poolStatus.maxConnections) > 0.6
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${(connectionInfo.poolStatus.activeConnections / connectionInfo.poolStatus.maxConnections) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Max Connections */}
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Max Connections</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {connectionInfo.poolStatus.maxConnections}
                  </span>
                </div>

                {/* Available Connections */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Available Connections</span>
                  <span className="text-lg font-semibold text-green-600">
                    {connectionInfo.poolStatus.availableConnections}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Connection Test Section */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Connection Test</h2>
              <p className="text-sm text-gray-600 mt-1">Test the database connection to verify connectivity</p>
            </div>
            <button
              onClick={testConnection}
              disabled={testing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-start">
                <span className={`text-2xl mr-3 ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {testResult.success ? '✓' : '✗'}
                </span>
                <div className="flex-1">
                  <h3 className={`font-semibold ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {testResult.message}
                  </h3>
                  {testResult.details && (
                    <div className="mt-3 space-y-1 text-sm">
                      <p className="text-gray-700">
                        <span className="font-medium">Response Time:</span> {testResult.details.responseTime}
                      </p>
                      {testResult.details.database && (
                        <p className="text-gray-700">
                          <span className="font-medium">Database:</span> {testResult.details.database}
                        </p>
                      )}
                      {testResult.details.user && (
                        <p className="text-gray-700">
                          <span className="font-medium">User:</span> {testResult.details.user}
                        </p>
                      )}
                      {testResult.details.version && (
                        <p className="text-gray-700">
                          <span className="font-medium">Version:</span> {testResult.details.version}
                        </p>
                      )}
                    </div>
                  )}
                  {testResult.error && (
                    <p className="mt-2 text-sm text-red-700">
                      Error: {testResult.error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Connection settings are read-only for security. To modify database connection parameters,
            update the <code className="bg-blue-100 px-1 py-0.5 rounded">DATABASE_URL</code> environment variable and restart the application.
          </p>
        </div>
      </main>
    </div>
  );
}

