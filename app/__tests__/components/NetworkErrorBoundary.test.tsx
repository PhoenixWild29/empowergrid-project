import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NetworkErrorBoundary from '../../components/NetworkErrorBoundary';

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

// Component that throws a network error
const NetworkErrorComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Failed to fetch');
  }
  return <div>Data loaded successfully</div>;
};

// Component that throws a non-network error
const OtherErrorComponent = () => {
  throw new Error('Some other error');
};

describe('NetworkErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
    });
  });

  it('should render children when no error occurs', () => {
    render(
      <NetworkErrorBoundary>
        <div>Test content</div>
      </NetworkErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should catch and display network error fallback', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NetworkErrorBoundary>
        <NetworkErrorComponent />
      </NetworkErrorBoundary>
    );

    expect(screen.getByText('Network Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    expect(screen.queryByText('Please check your internet connection and try again.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should show offline status when not connected', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock offline status
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
    });

    render(
      <NetworkErrorBoundary>
        <NetworkErrorComponent />
      </NetworkErrorBoundary>
    );

    expect(screen.getByText('No Internet Connection')).toBeInTheDocument();
    expect(screen.getByText('Please check your internet connection and try again.')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should handle online/offline events', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NetworkErrorBoundary>
        <NetworkErrorComponent />
      </NetworkErrorBoundary>
    );

    // Initially online (shows network error with online message)
    expect(screen.getByText('Network Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();

    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
    });
    window.dispatchEvent(new Event('offline'));

    await waitFor(() => {
      expect(screen.getByText('No Internet Connection')).toBeInTheDocument();
      expect(screen.getByText('Please check your internet connection and try again.')).toBeInTheDocument();
    });

    // Simulate coming back online
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
    });
    window.dispatchEvent(new Event('online'));

    await waitFor(() => {
      expect(screen.getByText('Network Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('should retry when try again button is clicked', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let shouldThrow = true;

    const TestComponent = () => {
      const [throwError, setThrowError] = React.useState(shouldThrow);

      return (
        <NetworkErrorBoundary>
          <NetworkErrorComponent shouldThrow={throwError} />
          <button onClick={() => setThrowError(false)}>Fix Error</button>
        </NetworkErrorBoundary>
      );
    };

    render(<TestComponent />);

    expect(screen.getByText('Network Error')).toBeInTheDocument();

    // Click try again button
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    // Should still show error since shouldThrow is still true
    await waitFor(() => {
      expect(screen.getByText('Network Error')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('should handle non-network errors by re-throwing', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // NetworkErrorBoundary should not catch non-network errors
    expect(() => {
      render(
        <NetworkErrorBoundary>
          <OtherErrorComponent />
        </NetworkErrorBoundary>
      );
    }).toThrow('Some other error');

    consoleSpy.mockRestore();
  });

  it('should detect network errors correctly', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Test various network error messages
    const networkErrors = [
      'Failed to fetch',
      'Network request failed',
      'fetch failed',
      'NetworkError',
      'TypeError: fetch failed',
    ];

    networkErrors.forEach((errorMessage) => {
      const TestComponent = () => {
        throw new Error(errorMessage);
      };

      const { rerender, unmount } = render(
        <NetworkErrorBoundary>
          <div>No error</div>
        </NetworkErrorBoundary>
      );

      rerender(
        <NetworkErrorBoundary>
          <TestComponent />
        </NetworkErrorBoundary>
      );

      expect(screen.getByText('Network Error')).toBeInTheDocument();
      
      // Clean up between iterations
      unmount();
    });

    consoleSpy.mockRestore();
  });

  it('should show different messages for online vs offline states', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Test offline state
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
    });

    render(
      <NetworkErrorBoundary>
        <NetworkErrorComponent />
      </NetworkErrorBoundary>
    );

    expect(screen.getByText('Please check your internet connection and try again.')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});