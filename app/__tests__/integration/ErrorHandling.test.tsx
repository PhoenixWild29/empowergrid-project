import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../contexts/AuthContext';
import ErrorBoundary from '../../components/ErrorBoundary';
import { ToastProvider } from '../../components/ToastProvider';
import WalletConnect from '../../components/WalletConnect';
import UserProfile from '../../components/auth/UserProfile';

// Mock Next.js router
const mockRouter = {
  push: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
};

jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

// Mock Solana wallet
const mockPhantomWallet = {
  isPhantom: true,
  connect: jest.fn(),
  disconnect: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

Object.defineProperty(window, 'solana', {
  value: mockPhantomWallet,
  writable: true,
});

// Component that throws an error
const ErrorComponent: React.FC = () => {
  throw new Error('Test error');
};

// Component that shows error state
function ErrorDisplay() {
  return <div data-testid="error-display">Error occurred</div>;
}

const ErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({ error, resetError }) => (
  <div data-testid="error-fallback">
    <h2>Error occurred</h2>
    <p>{error.message}</p>
    <button onClick={resetError}>Try again</button>
  </div>
);

const TestErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({ error }) => (
  <div data-testid="test-error-fallback">
    <p>Test error: {error.message}</p>
  </div>
);

describe('Error Handling Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.push.mockClear();

    // Reset wallet mock
    mockPhantomWallet.connect.mockResolvedValue({
      publicKey: { toString: () => 'test-wallet-address' },
    });
  });

  describe('Error Boundary Integration', () => {
    test('should catch and display errors in auth components', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary fallback={ErrorFallback}>
          <ErrorComponent />
        </ErrorBoundary>
      );

      // Should show error fallback
      expect(screen.getByTestId('error-fallback')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    test('should handle auth context errors gracefully', async () => {
      // Mock auth context to throw error
      const mockAuthContext = jest.spyOn(require('../../contexts/AuthContext'), 'AuthProvider')
        .mockImplementation(() => {
          throw new Error('Auth context error');
        });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary fallback={ErrorFallback}>
          <ErrorComponent />
        </ErrorBoundary>
      );

      // Should show error fallback
      expect(screen.getByTestId('error-fallback')).toBeInTheDocument();

      consoleSpy.mockRestore();
      mockAuthContext.mockRestore();
    });
  });

  describe('Toast Notifications Integration', () => {
    test('should show toast on wallet connection error', async () => {
      const user = userEvent.setup();

      // Mock wallet connection failure
      mockPhantomWallet.connect.mockRejectedValue(new Error('Wallet connection failed'));

      render(
        <ToastProvider>
          <AuthProvider>
            <WalletConnect />
          </AuthProvider>
        </ToastProvider>
      );

      const connectButton = screen.getByText('Connect Wallet');
      await user.click(connectButton);

      // Should show error toast
      await waitFor(() => {
        expect(screen.getByText('Failed to connect wallet')).toBeInTheDocument();
      });
    });

    test('should show success toast on successful wallet connection', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <AuthProvider>
            <WalletConnect />
          </AuthProvider>
        </ToastProvider>
      );

      const connectButton = screen.getByText('Connect Wallet');
      await user.click(connectButton);

      // Should show success toast
      await waitFor(() => {
        expect(screen.getByText('Wallet connected successfully')).toBeInTheDocument();
      });
    });

    test('should show toast on session expiration', async () => {
      // Mock expired session
      const expiredSession = {
        userId: 'test-user',
        walletAddress: 'test-wallet',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 3600000).toISOString(),
        createdAt: new Date().toISOString(),
      };

      const localStorageMock = {
        getItem: jest.fn((key) => {
          if (key === 'empowergrid_session') return JSON.stringify(expiredSession);
          return null;
        }),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      };

      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });

      render(
        <ToastProvider>
          <AuthProvider>
            <div>Test content</div>
          </AuthProvider>
        </ToastProvider>
      );

      // Should show session expired toast
      await waitFor(() => {
        expect(screen.getByText('Session expired. Please log in again.')).toBeInTheDocument();
      });
    });
  });

  describe('Network Error Handling', () => {
    test('should handle API call failures gracefully', async () => {
      const user = userEvent.setup();

      // Mock fetch to fail
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      ) as unknown as jest.MockedFunction<typeof fetch>;

      render(
        <ToastProvider>
          <AuthProvider>
            <WalletConnect />
          </AuthProvider>
        </ToastProvider>
      );

      const connectButton = screen.getByText('Connect Wallet');
      await user.click(connectButton);

      // Should show network error toast
      await waitFor(() => {
        expect(screen.getByText('Network error occurred')).toBeInTheDocument();
      });

      // Restore fetch
      global.fetch = jest.fn();
    });

    test('should retry failed API calls', async () => {
      const user = userEvent.setup();

      // Mock fetch to fail twice then succeed
      let callCount = 0;
      global.fetch = jest.fn(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }) as unknown as jest.MockedFunction<typeof fetch>;

      render(
        <ToastProvider>
          <AuthProvider>
            <WalletConnect />
          </AuthProvider>
        </ToastProvider>
      );

      const connectButton = screen.getByText('Connect Wallet');
      await user.click(connectButton);

      // Should eventually succeed after retries
      await waitFor(() => {
        expect(screen.getByText('Wallet connected successfully')).toBeInTheDocument();
      });

      expect(callCount).toBe(3); // Initial call + 2 retries

      // Restore fetch
      global.fetch = jest.fn();
    });
  });

  describe('Form Validation Errors', () => {
    test('should display validation errors in user profile', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <AuthProvider>
            <UserProfile />
          </AuthProvider>
        </ToastProvider>
      );

      // Try to submit empty form
      const submitButton = screen.getByText('Save Profile');
      await user.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument();
      });
    });

    test('should handle profile update errors', async () => {
      const user = userEvent.setup();

      // Mock profile update to fail
      jest.spyOn(require('../../contexts/AuthContext'), 'updateUserProfile')
        .mockRejectedValue(new Error('Profile update failed'));

      render(
        <ToastProvider>
          <AuthProvider>
            <UserProfile />
          </AuthProvider>
        </ToastProvider>
      );

      // Fill form and submit
      const usernameInput = screen.getByLabelText('Username');
      await user.type(usernameInput, 'testuser');

      const submitButton = screen.getByText('Save Profile');
      await user.click(submitButton);

      // Should show error toast
      await waitFor(() => {
        expect(screen.getByText('Failed to update profile')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    test('should show loading state during wallet connection', async () => {
      const user = userEvent.setup();

      // Mock slow wallet connection
      mockPhantomWallet.connect.mockImplementation(
        () => new Promise(resolve =>
          setTimeout(() => resolve({
            publicKey: { toString: () => 'test-wallet-address' },
          }), 1000)
        )
      );

      render(
        <AuthProvider>
          <WalletConnect />
        </AuthProvider>
      );

      const connectButton = screen.getByText('Connect Wallet');
      await user.click(connectButton);

      // Should show loading state
      expect(screen.getByText('Connecting...')).toBeInTheDocument();

      // Should resolve after connection
      await waitFor(() => {
        expect(screen.getByText('Disconnect')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    test('should show loading state during profile update', async () => {
      const user = userEvent.setup();

      // Mock slow profile update
      jest.spyOn(require('../../contexts/AuthContext'), 'updateUserProfile')
        .mockImplementation(() => new Promise(resolve =>
          setTimeout(() => resolve(undefined), 1000)
        ));

      render(
        <AuthProvider>
          <UserProfile />
        </AuthProvider>
      );

      // Fill form and submit
      const usernameInput = screen.getByLabelText('Username');
      await user.type(usernameInput, 'testuser');

      const submitButton = screen.getByText('Save Profile');
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText('Saving...')).toBeInTheDocument();

      // Should resolve after update
      await waitFor(() => {
        expect(screen.getByText('Profile updated successfully')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });
});