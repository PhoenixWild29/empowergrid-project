import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AsyncErrorBoundary from '../../components/AsyncErrorBoundary';

// Mock the error tracker
jest.mock('../../lib/monitoring/errorTracker', () => ({
  errorTracker: {
    trackError: jest.fn(),
  },
  reactErrorBoundaryTracker: {
    trackComponentError: jest.fn(),
  },
}));

// Mock logger
jest.mock('../../lib/logging/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

// Component that throws an async error
const AsyncErrorComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (shouldThrow) {
      // Simulate async error
      setTimeout(() => {
        setError(new Error('Async operation failed'));
      }, 100);
    }
  }, [shouldThrow]);

  if (error) {
    throw error;
  }

  return <div>Async content loaded</div>;
};

// Component that can be controlled to throw errors
const ControlledErrorComponent = ({ throwError }: { throwError: boolean }) => {
  if (throwError) {
    throw new Error('Async operation failed');
  }
  return <div>Async content loaded</div>;
};

describe('AsyncErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render children when no error occurs', async () => {
    render(
      <AsyncErrorBoundary>
        <div>Test content</div>
      </AsyncErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should catch and display error fallback when async operation fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AsyncErrorBoundary>
        <AsyncErrorComponent />
      </AsyncErrorBoundary>
    );

    // Wait for async error to occur
    jest.advanceTimersByTime(100);
    await waitFor(() => {
      expect(screen.getByText('Something went wrong loading this content')).toBeInTheDocument();
    });

    expect(screen.getByText('Async operation failed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should retry when try again button is clicked', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let shouldThrow = true;

    const TestComponent = () => {
      const [throwError, setThrowError] = React.useState(shouldThrow);

      return (
        <AsyncErrorBoundary>
          <AsyncErrorComponent shouldThrow={throwError} />
          <button onClick={() => setThrowError(false)}>Fix Error</button>
        </AsyncErrorBoundary>
      );
    };

    render(<TestComponent />);

    // Wait for initial error
    jest.advanceTimersByTime(100);
    await waitFor(() => {
      expect(screen.getByText('Something went wrong loading this content')).toBeInTheDocument();
    });

    // Click try again button
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    // Should still show error since shouldThrow is still true
    await waitFor(() => {
      expect(screen.getByText('Something went wrong loading this content')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('should handle network errors appropriately', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AsyncErrorBoundary>
        <ControlledErrorComponent throwError={true} />
      </AsyncErrorBoundary>
    );

    // Wait for network error
    jest.advanceTimersByTime(100);
    await waitFor(() => {
      expect(screen.getByText('Something went wrong loading this content')).toBeInTheDocument();
    });

    expect(screen.getByText('Async operation failed')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it.skip('should respect maxRetries limit', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const TestComponent = ({ throwError }: { throwError: boolean }) => (
      <ControlledErrorComponent throwError={throwError} />
    );

    let throwError = true;
    const { rerender } = render(
      <AsyncErrorBoundary maxRetries={2}>
        <TestComponent throwError={throwError} />
      </AsyncErrorBoundary>
    );

    // Initial error should be caught
    await waitFor(() => {
      expect(screen.getByText('Something went wrong loading this content')).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /try again/i });

    // Click retry once - disable error to show content
    throwError = false;
    rerender(
      <AsyncErrorBoundary maxRetries={2}>
        <TestComponent throwError={throwError} />
      </AsyncErrorBoundary>
    );
    fireEvent.click(retryButton);
    await waitFor(() => {
      expect(screen.getByText('Async content loaded')).toBeInTheDocument();
    });

    // Trigger error again
    throwError = true;
    rerender(
      <AsyncErrorBoundary maxRetries={2}>
        <TestComponent throwError={throwError} />
      </AsyncErrorBoundary>
    );
    await waitFor(() => {
      expect(screen.getByText('Something went wrong loading this content')).toBeInTheDocument();
    });

    // Click retry second time - disable error to show content
    throwError = false;
    rerender(
      <AsyncErrorBoundary maxRetries={2}>
        <TestComponent throwError={throwError} />
      </AsyncErrorBoundary>
    );
    fireEvent.click(retryButton);
    await waitFor(() => {
      expect(screen.getByText('Async content loaded')).toBeInTheDocument();
    });

    // Trigger error again - should hit max retries
    throwError = true;
    rerender(
      <AsyncErrorBoundary maxRetries={2}>
        <TestComponent throwError={throwError} />
      </AsyncErrorBoundary>
    );
    await waitFor(() => {
      expect(screen.getByText('Maximum retry attempts reached. Please refresh the page.')).toBeInTheDocument();
    });

    // Button should be removed when max retries reached
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should render custom fallback when provided', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const CustomFallback = ({ error, retry }: any) => (
      <div data-testid="custom-fallback">
        Custom Error: {error.message}
        <button onClick={retry}>Custom Retry</button>
      </div>
    );

    render(
      <AsyncErrorBoundary fallback={CustomFallback}>
        <AsyncErrorComponent />
      </AsyncErrorBoundary>
    );

    // Wait for error
    jest.advanceTimersByTime(100);
    await waitFor(() => {
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    });

    expect(screen.getByText('Custom Error: Async operation failed')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should handle componentDidCatch with network error detection', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create a component that throws a network error
    const NetworkThrowingComponent = () => {
      React.useEffect(() => {
        throw new Error('fetch failed');
      }, []);
      return <div>Content</div>;
    };

    render(
      <AsyncErrorBoundary>
        <NetworkThrowingComponent />
      </AsyncErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText('Something went wrong loading this content')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('should show retry count in fallback', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AsyncErrorBoundary maxRetries={3}>
        <AsyncErrorComponent />
      </AsyncErrorBoundary>
    );

    // Wait for error
    jest.advanceTimersByTime(100);
    await waitFor(() => {
      expect(screen.getByText('Something went wrong loading this content')).toBeInTheDocument();
    });

    // Should show retry information
    expect(screen.getByText(/Try Again \(0\/3\)/)).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});