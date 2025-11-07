/**
 * Test Error Page
 * 
 * This page intentionally throws errors to test the error logger
 * Access at /debug/test-errors
 */

import { useState } from 'react';
import { errorLogger } from '../../lib/utils/comprehensiveErrorLogger';

export default function TestErrorsPage() {
  const [logs, setLogs] = useState<any[]>([]);

  const testJavaScriptError = () => {
    console.log('Testing JavaScript error...');
    // This will be caught by window.error listener
    throw new Error('Test JavaScript Error - This should be caught by error logger');
  };

  const testPromiseRejection = () => {
    console.log('Testing promise rejection...');
    // This will be caught by unhandledrejection listener
    Promise.reject(new Error('Test Promise Rejection - This should be caught by error logger'));
  };

  const testConsoleError = () => {
    console.log('Testing console.error...');
    // This will be caught by console.error wrapper
    console.error('Test Console Error - This should be caught by error logger');
  };

  const testReactError = () => {
    console.log('Testing React error...');
    // This will be caught by ErrorBoundary
    throw new Error('Test React Error - This should be caught by ErrorBoundary');
  };

  const testFetchError = async () => {
    console.log('Testing fetch error...');
    try {
      // This will be caught by fetch wrapper
      await fetch('https://invalid-url-that-does-not-exist-12345.com/api/test');
    } catch (error) {
      console.log('Fetch error caught (expected):', error);
    }
  };

  const viewLogs = () => {
    const allLogs = errorLogger.getLogs({ limit: 50 });
    setLogs(allLogs);
    console.log('Current error logs:', allLogs);
  };

  const showStats = () => {
    const stats = errorLogger.getStats();
    console.log('Error logger stats:', stats);
    alert(`Total errors: ${stats.total}\nBy type: ${JSON.stringify(stats.byType)}\nBy severity: ${JSON.stringify(stats.bySeverity)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Error Logger Test Page</h1>
          <p className="text-gray-600 mb-6">
            Click the buttons below to test different types of error capture. Check the console and error logger to see if errors are being captured.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={testJavaScriptError}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Test JavaScript Error
            </button>
            <button
              onClick={testPromiseRejection}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Test Promise Rejection
            </button>
            <button
              onClick={testConsoleError}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Test Console Error
            </button>
            <button
              onClick={testFetchError}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Test Fetch Error
            </button>
            <button
              onClick={viewLogs}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              View All Logs
            </button>
            <button
              onClick={showStats}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Show Stats
            </button>
          </div>

          {logs.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Captured Logs ({logs.length})</h2>
              <div className="bg-gray-100 rounded p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs">{JSON.stringify(logs, null, 2)}</pre>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h3 className="font-semibold text-yellow-900 mb-2">Note:</h3>
            <p className="text-sm text-yellow-800">
              After clicking the test buttons, check:
            </p>
            <ul className="list-disc list-inside text-sm text-yellow-800 mt-2 space-y-1">
              <li>Browser console (F12) for error messages</li>
              <li>Run <code className="bg-yellow-100 px-1 rounded">showErrors()</code> in console</li>
              <li>Visit <code className="bg-yellow-100 px-1 rounded">/debug/errors</code> to see all errors</li>
              <li>Check the error panel button (bottom-right corner)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

