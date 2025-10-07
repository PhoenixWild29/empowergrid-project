import React, { Component, ReactNode } from 'react';
import { ErrorInfo } from 'react';
import { reactErrorBoundaryTracker } from '../lib/monitoring/errorTracker';
import { logger } from '../lib/logging/logger';

interface NetworkErrorBoundaryState {
  hasNetworkError: boolean;
  isOnline: boolean;
  error?: Error;
  retryCount: number;
}

interface NetworkErrorBoundaryProps {
  children: ReactNode;
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: () => void;
  onNetworkStatusChange?: (isOnline: boolean) => void;
}

const NetworkErrorFallback: React.FC<{
  error: Error;
  retry: () => void;
  isOnline: boolean;
  retryCount: number;
  maxRetries: number;
}> = ({ error, retry, isOnline, retryCount, maxRetries }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6 my-4">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        {!isOnline ? (
          <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0 0L5.636 18.364m12.728-12.728L18.364 5.636zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
          </svg>
        ) : (
          <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )}
      </div>
      <div className="ml-3 flex-1">
        <h3 className="text-sm font-medium text-red-800">
          {!isOnline ? 'No Internet Connection' : 'Network Error'}
        </h3>
        <div className="mt-2 text-sm text-red-700">
          <p>
            {!isOnline
              ? 'Please check your internet connection and try again.'
              : error.message || 'Unable to connect to the server. Please try again.'
            }
          </p>
        </div>
        <div className="mt-3 flex space-x-3">
          {retryCount < maxRetries && (
            <button
              onClick={retry}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              Try Again ({retryCount}/{maxRetries})
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            Refresh Page
          </button>
        </div>
        {retryCount >= maxRetries && (
          <div className="mt-2 text-sm text-red-600">
            Maximum retry attempts reached. Please refresh the page or try again later.
          </div>
        )}
      </div>
    </div>
  </div>
);

class NetworkErrorBoundary extends Component<
  NetworkErrorBoundaryProps,
  NetworkErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: NetworkErrorBoundaryProps) {
    super(props);
    this.state = {
      hasNetworkError: false,
      isOnline: navigator.onLine,
      retryCount: 0,
    };
  }

  componentDidMount() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleOnline = () => {
    this.setState({ isOnline: true });
    if (this.props.onNetworkStatusChange) {
      this.props.onNetworkStatusChange(true);
    }
  };

  handleOffline = () => {
    this.setState({ isOnline: false });
    if (this.props.onNetworkStatusChange) {
      this.props.onNetworkStatusChange(false);
    }
  };

  static getDerivedStateFromError(error: Error): NetworkErrorBoundaryState {
    // Check if it's a network-related error
    const isNetworkError = NetworkErrorBoundary.isNetworkError(error);

    return {
      hasNetworkError: isNetworkError,
      isOnline: navigator.onLine,
      error,
      retryCount: 0,
    };
  }

  static isNetworkError(error: Error): boolean {
    const message = error.message.toLowerCase();
    const networkKeywords = [
      'network',
      'fetch',
      'connection',
      'timeout',
      'offline',
      'server',
      'api',
      'http',
      'failed to fetch',
      'load balancer',
      'cors',
      'net::',
    ];

    return networkKeywords.some(keyword => message.includes(keyword));
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const isNetworkError = NetworkErrorBoundary.isNetworkError(error);

    if (isNetworkError) {
      const errorId = `network_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      reactErrorBoundaryTracker.trackComponentError(
        error,
        { componentStack: errorInfo.componentStack || '' },
        'NetworkErrorBoundary',
        undefined
      );

      logger.error('Network Error Boundary caught a network error', {
        errorId,
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        isOnline: this.state.isOnline,
        retryCount: this.state.retryCount,
      });

      this.setState({
        hasNetworkError: true,
        error,
      });
    }
  }

  handleRetry = () => {
    const { maxRetries = 3, retryDelay = 2000, onRetry } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      return;
    }

    this.setState(prevState => ({
      hasNetworkError: false,
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
    const { hasNetworkError, error, isOnline, retryCount } = this.state;
    const { children, maxRetries = 3 } = this.props;

    if (hasNetworkError && error) {
      return (
        <NetworkErrorFallback
          error={error}
          retry={this.handleRetry}
          isOnline={isOnline}
          retryCount={retryCount}
          maxRetries={maxRetries}
        />
      );
    }

    return children;
  }
}

export default NetworkErrorBoundary;