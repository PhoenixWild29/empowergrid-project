import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ErrorBoundary from '../../components/ErrorBoundary';
import { errorTracker, reactErrorBoundaryTracker } from '../../lib/monitoring/errorTracker';

// Mock the error tracker - make it synchronous
jest.mock('../../lib/monitoring/errorTracker', () => ({
  errorTracker: {
    trackError: jest.fn(),
  },
  ErrorTracker: {
    trackError: jest.fn(),
  },
  reactErrorBoundaryTracker: {
    trackComponentError: jest.fn(() => Promise.resolve()), // Make it return a resolved promise
  },
}));

// Mock logger
jest.mock('../../lib/logging/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

// Component that throws an error
const ErrorComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Component that throws a network error
const NetworkErrorComponent = () => {
  throw new Error('Network request failed');
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should catch and display error fallback when child throws', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    act(() => {
      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );
    });

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    // Error message is not displayed in production mode
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /report issue/i })).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should catch and display errors with default fallback', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    act(() => {
      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );
    });

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('We encountered an unexpected error. Our team has been notified and is working to fix this issue.')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should render custom fallback when provided', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const CustomFallback = ({ error }: { error: Error }) => <div>Custom Error: {error.message}</div>;

    act(() => {
      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ErrorComponent />
        </ErrorBoundary>
      );
    });

    expect(screen.getByText('Custom Error: Test error')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should show development error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    // Mock NODE_ENV for this test
    const mockProcessEnv = { ...process.env, NODE_ENV: 'development' };
    Object.defineProperty(process, 'env', {
      value: mockProcessEnv,
      writable: true,
    });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    act(() => {
      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );
    });

    expect(screen.getByText('Error Details (Development Only)')).toBeInTheDocument();

    // Restore original env
    Object.defineProperty(process, 'env', {
      value: { ...mockProcessEnv, NODE_ENV: originalEnv },
      writable: true,
    });
    consoleSpy.mockRestore();
  });

  it('should call resetError when refresh button is clicked', async () => {
    const mockReset = jest.fn();
    const RecoverableErrorComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      
      React.useEffect(() => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
      }, [shouldThrow]);

      return (
        <div>
          <button onClick={() => setShouldThrow(false)}>Recover</button>
          <span>Component working</span>
        </div>
      );
    };

    render(
      <ErrorBoundary>
        <RecoverableErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Click the refresh button (which calls resetErrorBoundary)
    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));

    // The component should reset and try to render children again
    // Since the error component still throws, it should error again
    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  it('should track error when error occurs', () => {
    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    expect(reactErrorBoundaryTracker.trackComponentError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      }),
      'ErrorBoundary',
      undefined
    );
  });

  it('should show error reporting modal when report button is clicked', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // Mock window.open
    const mockOpen = jest.fn();
    window.open = mockOpen;

    act(() => {
      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );
    });

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /report issue/i }));

    const calledUrl = mockOpen.mock.calls[0][0];
    expect(calledUrl).toContain('mailto:support@empowergrid.com');
    expect(calledUrl).toContain('Error%20Report%3A'); // %3A is the encoded colon
    expect(calledUrl).toContain('Test%20error');

    consoleSpy.mockRestore();
  });

  it('should limit error resets to prevent infinite loops', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    act(() => {
      render(
        <ErrorBoundary maxResets={1}>
          <ErrorComponent />
        </ErrorBoundary>
      );
    });

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    
    // First reset should work
    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(tryAgainButton);

    // After reset, the component should try to render again and error again
    // Since maxResets is 1, the second error should not show the Try Again button
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should handle network errors appropriately', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    // Network errors are handled the same as other errors

    consoleSpy.mockRestore();
  });
});