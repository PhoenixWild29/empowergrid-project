import React, { Component, ReactNode } from 'react';
import { ErrorInfo } from 'react';
import { reactErrorBoundaryTracker } from '../lib/monitoring/errorTracker';
import { logger } from '../lib/logging/logger';

interface AsyncErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: () => void;
  fallback?: React.ComponentType<{
    error: Error;
    retry: () => void;
    retryCount: number;
    maxRetries: number;
  }>;
}

const DefaultAsyncFallback: React.FC<{
  error: Error;
  retry: () => void;
  retryCount: number;
  maxRetries: number;
}> = ({ error, retry, retryCount, maxRetries }) => (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-4">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="ml-3 flex-1">
        <h3 className="text-sm font-medium text-yellow-800">
          Something went wrong loading this content
        </h3>
        <div className="mt-2 text-sm text-yellow-700">
          <p>{error.message}</p>
        </div>
        {retryCount < maxRetries && (
          <div className="mt-3">
            <button
              onClick={retry}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              Try Again ({retryCount}/{maxRetries})
            </button>
          </div>
        )}
        {retryCount >= maxRetries && (
          <div className="mt-2 text-sm text-yellow-600">
            Maximum retry attempts reached. Please refresh the page.
          </div>
        )}
      </div>
    </div>
  </div>
);

class AsyncErrorBoundary extends Component<
  AsyncErrorBoundaryProps,
  AsyncErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: AsyncErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AsyncErrorBoundaryState> {
    return {
      hasError: true,
      error,
      // Don't reset retryCount here - preserve it for retry limit logic
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = `async_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    reactErrorBoundaryTracker.trackComponentError(
      error,
      { componentStack: errorInfo.componentStack || '' },
      'AsyncErrorBoundary',
      undefined
    );

    logger.error('Async Error Boundary caught an error', {
      errorId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
    });

    this.setState({
      error,
      hasError: true,
    });
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleRetry = () => {
    const { maxRetries = 3, retryDelay = 1000, onRetry } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      retryCount: prevState.retryCount + 1,
    }));

    // Call optional retry callback
    if (onRetry) {
      if (retryDelay > 0) {
        this.retryTimeoutId = setTimeout(() => {
          onRetry();
        }, retryDelay);
      } else {
        onRetry();
      }
    }
  };

  render() {
    const { hasError, error, retryCount } = this.state;
    const { children, maxRetries = 3, fallback: Fallback = DefaultAsyncFallback } = this.props;

    if (hasError && error) {
      return React.createElement(Fallback, {
        error,
        retry: this.handleRetry,
        retryCount,
        maxRetries,
      });
    }

    return children;
  }
}

export default AsyncErrorBoundary;