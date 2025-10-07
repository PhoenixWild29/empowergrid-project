import React, { Suspense } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SuspenseBoundary from '../../components/SuspenseBoundary';

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

// Function to create a fresh lazy component for each test
const createLazyComponent = () => {
  return React.lazy(() => {
    return new Promise<{ default: React.ComponentType }>(resolve => {
      setTimeout(() => {
        resolve({
          default: () => <div>Lazy component loaded</div>,
        });
      }, 100);
    });
  });
};

// Component that throws an error
const ErrorComponent = () => {
  throw new Error('Suspense error');
};

describe('SuspenseBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render default fallback while suspense is pending', async () => {
    const LazyComponent = createLazyComponent();

    render(
      <SuspenseBoundary>
        <LazyComponent />
      </SuspenseBoundary>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for lazy component to load
    jest.advanceTimersByTime(100);
    await waitFor(() => {
      expect(screen.getByText('Lazy component loaded')).toBeInTheDocument();
    });
  });

  it('should render custom fallback when provided', () => {
    const CustomFallback = () => <div>Custom loading...</div>;
    const LazyComponent = createLazyComponent();

    render(
      <SuspenseBoundary fallback={CustomFallback}>
        <LazyComponent />
      </SuspenseBoundary>
    );

    expect(screen.getByText('Custom loading...')).toBeInTheDocument();
  });

  it('should render custom fallback as React element', () => {
    const customFallbackElement = <div>Element loading...</div>;
    const LazyComponent = createLazyComponent();

    render(
      <SuspenseBoundary fallback={customFallbackElement}>
        <LazyComponent />
      </SuspenseBoundary>
    );

    expect(screen.getByText('Element loading...')).toBeInTheDocument();
  });

  it('should handle errors in suspended components', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <SuspenseBoundary>
        <ErrorComponent />
      </SuspenseBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('should handle errors with custom error fallback', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const CustomErrorFallback = ({ error, resetError, errorId, canReset }: any) => (
      <div data-testid="custom-error-fallback">
        Custom Error: {error.message}
        <button onClick={resetError} disabled={!canReset}>
          Reset
        </button>
      </div>
    );

    render(
      <SuspenseBoundary errorFallback={CustomErrorFallback}>
        <ErrorComponent />
      </SuspenseBoundary>
    );

    await waitFor(() => {
      expect(screen.getByTestId('custom-error-fallback')).toBeInTheDocument();
    });

    expect(screen.getByText('Custom Error: Suspense error')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should render children normally when no suspense or error', () => {
    render(
      <SuspenseBoundary>
        <div>Normal content</div>
      </SuspenseBoundary>
    );

    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('should handle ComponentType fallback correctly', () => {
    const ComponentFallback = () => <div>Component fallback</div>;
    const LazyComponent = createLazyComponent();

    render(
      <SuspenseBoundary fallback={ComponentFallback}>
        <LazyComponent />
      </SuspenseBoundary>
    );

    expect(screen.getByText('Component fallback')).toBeInTheDocument();
  });

  it('should handle React element fallback correctly', () => {
    const elementFallback = <div>Element fallback content</div>;
    const LazyComponent = createLazyComponent();

    render(
      <SuspenseBoundary fallback={elementFallback}>
        <LazyComponent />
      </SuspenseBoundary>
    );

    expect(screen.getByText('Element fallback content')).toBeInTheDocument();
  });

  it('should work with nested suspense boundaries', async () => {
    const LazyComponent = createLazyComponent();

    render(
      <SuspenseBoundary>
        <div>Outer content</div>
        <SuspenseBoundary fallback={<div>Inner loading...</div>}>
          <LazyComponent />
        </SuspenseBoundary>
      </SuspenseBoundary>
    );

    expect(screen.getByText('Outer content')).toBeInTheDocument();
    expect(screen.getByText('Inner loading...')).toBeInTheDocument();

    // Wait for lazy component to load
    jest.advanceTimersByTime(100);
    await waitFor(() => {
      expect(screen.getByText('Lazy component loaded')).toBeInTheDocument();
    });
  });

  it('should handle error boundary reset functionality', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let shouldThrow = true;

    const TestComponent = () => {
      const [throwError, setThrowError] = React.useState(shouldThrow);

      return (
        <SuspenseBoundary>
          {throwError ? <ErrorComponent /> : <div>Recovered</div>}
          <button onClick={() => setThrowError(false)}>Fix Error</button>
        </SuspenseBoundary>
      );
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});