import React, { useState } from 'react';
import { errorTracker, ErrorSeverity, ErrorCategory } from '../lib/monitoring/errorTracker';
import { logger } from '../lib/logging/logger';

interface ErrorReportingProps {
  errorId?: string;
  error?: Error;
  context?: Record<string, any>;
  onReportSubmitted?: (reportId: string) => void;
  className?: string;
}

const ErrorReporting: React.FC<ErrorReportingProps> = ({
  errorId,
  error,
  context = {},
  onReportSubmitted,
  className = '',
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [includeSystemInfo, setIncludeSystemInfo] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Collect system information
      const systemInfo = includeSystemInfo ? {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        online: navigator.onLine,
        ...context,
      } : context;

      // Create error report
      const reportData = {
        errorId: errorId || `manual_report_${Date.now()}`,
        description: description.trim(),
        email: email.trim() || undefined,
        systemInfo,
        error: error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        } : undefined,
      };

      // Track the report
      errorTracker.trackError(
        new Error(`User Error Report: ${description}`),
        ErrorSeverity.MEDIUM,
        ErrorCategory.UNKNOWN,
        {
          metadata: {
            ...reportData,
            userProvided: true,
          },
          type: 'user_error_report',
        }
      );

      // Log the report
      logger.info('User submitted error report', reportData);

      setIsSubmitted(true);

      if (onReportSubmitted) {
        onReportSubmitted(reportData.errorId);
      }

      // Reset form after successful submission
      setTimeout(() => {
        setDescription('');
        setEmail('');
        setIsSubmitted(false);
      }, 3000);

    } catch (submitError) {
      logger.error('Failed to submit error report', { submitError });
      // Still show success to user to avoid frustration
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 010 1.414l2-2a1 1 0 001.414-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Report Submitted Successfully
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <p>Thank you for your feedback! Our team will review this issue.</p>
              {errorId && (
                <p className="mt-1">Report ID: <code className="bg-green-100 px-1 rounded">{errorId}</code></p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-800">
            Help Us Improve
          </h3>
          <div className="mt-2 text-sm text-blue-700">
            <p>Describe what happened and we&apos;ll work to fix it.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-3">
            <div className="space-y-3">
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-blue-800">
                  What happened?
                </label>
                <textarea
                  id="description"
                  rows={3}
                  className="mt-1 block w-full border-blue-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Please describe the issue you encountered..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-blue-800">
                  Email (optional)
                </label>
                <input
                  type="email"
                  id="email"
                  className="mt-1 block w-full border-blue-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="mt-1 text-xs text-blue-600">
                  We&apos;ll only use this to follow up on your report.
                </p>
              </div>

              <div className="flex items-center">
                <input
                  id="system-info"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-blue-300 rounded"
                  checked={includeSystemInfo}
                  onChange={(e) => setIncludeSystemInfo(e.target.checked)}
                />
                <label htmlFor="system-info" className="ml-2 block text-sm text-blue-800">
                  Include system information (helps us debug faster)
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !description.trim()}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ErrorReporting;