/**
 * Error Logger Panel
 * 
 * Development component to display error logs in a panel
 * Only visible in development mode
 */

import { useState, useEffect } from 'react';
import { errorLogger, ErrorLogEntry } from '../lib/utils/comprehensiveErrorLogger';

export default function ErrorLoggerPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<ErrorLogEntry[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    // Load initial logs
    const loadLogs = () => {
      setLogs(errorLogger.getRecentErrors(50));
      setStats(errorLogger.getStats());
    };

    loadLogs();

    // Listen for new errors
    const unsubscribe = errorLogger.addListener(() => {
      loadLogs();
    });

    // Refresh every 2 seconds
    const interval = setInterval(loadLogs, 2000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const recentErrors = logs.slice(0, 10);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
        title="Error Logger"
      >
        <span className="text-sm font-bold">⚠️</span>
        {stats && stats.total > 0 && (
          <span className="bg-white text-red-600 rounded-full px-2 py-0.5 text-xs font-bold">
            {stats.total}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-96 max-h-96 bg-white rounded-lg shadow-2xl border-2 border-red-500 z-50 flex flex-col">
          {/* Header */}
          <div className="bg-red-600 text-white p-3 flex justify-between items-center rounded-t-lg">
            <h3 className="font-bold text-sm">Error Logger</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  errorLogger.clearLogs();
                  setLogs([]);
                  setStats(errorLogger.getStats());
                }}
                className="text-xs px-2 py-1 bg-red-700 hover:bg-red-800 rounded"
                title="Clear logs"
              >
                Clear
              </button>
              <button
                onClick={() => errorLogger.downloadLogs()}
                className="text-xs px-2 py-1 bg-red-700 hover:bg-red-800 rounded"
                title="Export logs"
              >
                Export
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs px-2 py-1 bg-red-700 hover:bg-red-800 rounded"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="p-2 bg-gray-50 border-b text-xs">
              <div className="flex justify-between mb-1">
                <span>Total:</span>
                <span className="font-bold">{stats.total}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="font-semibold">By Type:</div>
                  {Object.entries(stats.byType).map(([type, count]: [string, any]) => (
                    <div key={type} className="pl-2">
                      {type}: {count}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="font-semibold">By Severity:</div>
                  {Object.entries(stats.bySeverity).map(([severity, count]: [string, any]) => (
                    <div key={severity} className="pl-2">
                      {severity}: {count}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error List */}
          <div className="overflow-y-auto flex-1">
            {recentErrors.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No errors logged yet
              </div>
            ) : (
              <div className="divide-y">
                {recentErrors.map((log) => (
                  <div
                    key={log.id}
                    className="p-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      console.group(`Error: ${log.error.name}`);
                      console.error('Full error log:', log);
                      console.groupEnd();
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          log.severity === 'critical'
                            ? 'bg-red-600 text-white'
                            : log.severity === 'high'
                            ? 'bg-orange-600 text-white'
                            : log.severity === 'medium'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-blue-500 text-white'
                        }`}
                      >
                        {log.severity[0].toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate">
                          {log.error.name}
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {log.error.message}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(log.timestamp).toLocaleTimeString()} • {log.type}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

