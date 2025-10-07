import React, { Component, ErrorInfo, ReactNode } from 'react';
import { reactErrorBoundaryTracker } from '../lib/monitoring/errorTracker';
import { logger } from '../lib/logging/logger';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void; errorId: string; canReset: boolean }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showErrorReport?: boolean;
  maxResets?: number;
}

const DefaultErrorFallback: React.FC<{
  error: Error;
  resetError: () => void;
  errorId: string;
  canReset: boolean;
}> = ({ error, resetError, errorId, canReset }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
      <div className="text-center">
        <div className="text-6xl text-red-500 mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Something went wrong
        </h1>
        <p className="text-gray-600 mb-6">
          We encountered an unexpected error. Our team has been notified and is working to fix this issue.
        </p>

        <div className="space-y-3">
          {canReset && (
            <button
              onClick={resetError}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Try Again
            </button>
          )}

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
          >
            Refresh Page
          </button>

          <button
            onClick={() => {
              const subject = encodeURIComponent(`Error Report: ${errorId}`);
              const body = encodeURIComponent(
                `Error ID: ${errorId}\n\nError: ${error.message}\n\nPlease describe what you were doing when this error occurred:\n\n`
              );
              window.open(`mailto:support@empowergrid.com?subject=${subject}&body=${body}`);
            }}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Report Issue
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Error Details (Development Only)
            </summary>
            <div className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
              <div className="mb-2">
                <strong>Error ID:</strong> {errorId}
              </div>
              <div className="mb-2">
                <strong>Message:</strong> {error.toString()}
              </div>
              {error.stack && (
                <div>
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap mt-1">{error.stack}</pre>
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  </div>
);

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private resetCount: number = 0;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { errorId } = this.state;

    // Track the error with our monitoring system
    reactErrorBoundaryTracker.trackComponentError(
      error,
      { componentStack: errorInfo.componentStack || '' },
      'ErrorBoundary',
      undefined // userId would come from auth context
    );

    // Log additional context
    logger.error('React Error Boundary caught an error', {
      errorId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetErrorBoundary = () => {
    const { maxResets = 3 } = this.props;
    this.resetCount += 1;

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const error = this.state.error!;
        const { maxResets = 3 } = this.props;
        const canReset = this.resetCount < maxResets;

        return React.createElement(this.props.fallback, {
          error,
          resetError: this.resetErrorBoundary,
          errorId: this.state.errorId || 'unknown',
          canReset,
        });
      }

      return (
        <DefaultErrorFallback
          error={this.state.error!}
          resetError={this.resetErrorBoundary}
          errorId={this.state.errorId || 'unknown'}
          canReset={this.resetCount < (this.props.maxResets || 3)}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
