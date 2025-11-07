/**
 * Debug Page - View Error Logs
 * 
 * Access at /debug/errors to see all captured errors
 */

import { useState, useEffect } from 'react';
import { errorLogger, ErrorLogEntry } from '../../lib/utils/comprehensiveErrorLogger';

export default function DebugErrorsPage() {
  const [logs, setLogs] = useState<ErrorLogEntry[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedLog, setSelectedLog] = useState<ErrorLogEntry | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const loadLogs = () => {
      if (typeof window !== 'undefined') {
        setLogs(errorLogger.getLogs({ limit: 100 }));
        setStats(errorLogger.getStats());
      }
    };

    loadLogs();

    // Listen for new errors
    const unsubscribe = errorLogger.addListener(() => {
      loadLogs();
    });

    // Auto-refresh every 2 seconds if enabled
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(loadLogs, 2000);
    }

    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  if (typeof window === 'undefined') {
    return <div>Loading...</div>;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-600 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'react':
        return 'bg-purple-500 text-white';
      case 'javascript':
        return 'bg-red-500 text-white';
      case 'promise':
        return 'bg-pink-500 text-white';
      case 'network':
        return 'bg-indigo-500 text-white';
      case 'console':
        return 'bg-gray-500 text-white';
      case 'nextjs':
        return 'bg-black text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Error Logger Debug Page</h1>
              <p className="text-gray-600 mt-2">
                View all captured errors from the comprehensive error logger
              </p>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Auto-refresh</span>
              </label>
              <button
                onClick={() => {
                  errorLogger.clearLogs();
                  setLogs([]);
                  setStats(errorLogger.getStats());
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Clear Logs
              </button>
              <button
                onClick={() => errorLogger.downloadLogs()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Export JSON
              </button>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-100 p-4 rounded">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Errors</div>
              </div>
              <div className="bg-gray-100 p-4 rounded">
                <div className="text-sm text-gray-600 mb-2">By Type</div>
                {Object.entries(stats.byType).map(([type, count]: [string, any]) => (
                  <div key={type} className="text-xs">
                    <span className={`inline-block px-2 py-1 rounded mr-2 ${getTypeColor(type)}`}>
                      {type}
                    </span>
                    {count}
                  </div>
                ))}
              </div>
              <div className="bg-gray-100 p-4 rounded">
                <div className="text-sm text-gray-600 mb-2">By Severity</div>
                {Object.entries(stats.bySeverity).map(([severity, count]: [string, any]) => (
                  <div key={severity} className="text-xs">
                    <span className={`inline-block px-2 py-1 rounded mr-2 ${getSeverityColor(severity)}`}>
                      {severity}
                    </span>
                    {count}
                  </div>
                ))}
              </div>
              <div className="bg-gray-100 p-4 rounded">
                <div className="text-sm text-gray-600">Recent Errors</div>
                <div className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.recent.length}
                </div>
              </div>
            </div>
          )}

          {/* Error List */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Error Logs ({logs.length})</h2>
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No errors logged yet. Errors will appear here when they occur.
                  </div>
                ) : (
                  <div className="divide-y">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 ${
                          selectedLog?.id === log.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded ${getSeverityColor(log.severity)}`}
                          >
                            {log.severity[0].toUpperCase()}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${getTypeColor(log.type)}`}
                          >
                            {log.type}
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="font-semibold text-sm">{log.error.name}</div>
                          <div className="text-xs text-gray-600 truncate mt-1">
                            {log.error.message}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Error Details */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Error Details</h2>
              {selectedLog ? (
                <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-700">Error ID</div>
                      <div className="text-xs font-mono text-gray-600">{selectedLog.id}</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700">Timestamp</div>
                      <div className="text-xs text-gray-600">
                        {new Date(selectedLog.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700">Type</div>
                      <div className="text-xs">
                        <span className={`px-2 py-1 rounded ${getTypeColor(selectedLog.type)}`}>
                          {selectedLog.type}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700">Severity</div>
                      <div className="text-xs">
                        <span
                          className={`px-2 py-1 rounded ${getSeverityColor(selectedLog.severity)}`}
                        >
                          {selectedLog.severity}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700">Error Name</div>
                      <div className="text-xs font-mono text-gray-600">{selectedLog.error.name}</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700">Error Message</div>
                      <div className="text-xs text-gray-600">{selectedLog.error.message}</div>
                    </div>
                    {selectedLog.error.stack && (
                      <div>
                        <div className="text-sm font-semibold text-gray-700">Stack Trace</div>
                        <pre className="text-xs bg-gray-800 text-green-400 p-2 rounded mt-1 overflow-auto">
                          {selectedLog.error.stack}
                        </pre>
                      </div>
                    )}
                    {selectedLog.context.componentStack && (
                      <div>
                        <div className="text-sm font-semibold text-gray-700">Component Stack</div>
                        <pre className="text-xs bg-gray-800 text-green-400 p-2 rounded mt-1 overflow-auto">
                          {selectedLog.context.componentStack}
                        </pre>
                      </div>
                    )}
                    {Object.keys(selectedLog.context).length > 0 && (
                      <div>
                        <div className="text-sm font-semibold text-gray-700">Context</div>
                        <pre className="text-xs bg-gray-200 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(selectedLog.context, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                      <div>
                        <div className="text-sm font-semibold text-gray-700">Metadata</div>
                        <pre className="text-xs bg-gray-200 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(selectedLog.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-8 text-center text-gray-500 bg-gray-50">
                  Select an error from the list to view details
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

