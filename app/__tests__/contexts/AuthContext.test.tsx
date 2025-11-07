import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PublicKey } from '@solana/web3.js';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { UserRole, Permission } from '../../types/auth';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock PublicKey
jest.mock('@solana/web3.js', () => ({
  PublicKey: jest.fn().mockImplementation(value => ({
    toString: () => value || 'mock-public-key',
    equals: jest.fn(other => other?.toString() === value),
  })),
}));

// Mock database service
jest.mock('../../lib/services/databaseService', () => ({
  databaseService: {
    ensureUserExists: jest.fn(),
    getUserProfile: jest.fn(),
    updateUserProfile: jest.fn(),
  },
}));

// Mock error handler
jest.mock('../../hooks/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: jest.fn(),
  }),
}));

// Mock global fetch
global.fetch = jest.fn();

// Test component that uses auth context
function TestComponent() {
  const { isAuthenticated, user, login, logout, hasPermission } = useAuth();

  return (
    <div>
      <div data-testid='auth-status'>
        {isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid='user-role'>{user?.role || 'no-user'}</div>
      <div data-testid='can-create-project'>
        {hasPermission(Permission.CREATE_PROJECT)
          ? 'can-create'
          : 'cannot-create'}
      </div>
      <button
        data-testid='login-btn'
        onClick={() => login(new PublicKey('test-wallet'))}
      >
        Login
      </button>
      <button data-testid='logout-btn' onClick={logout}>
        Logout
      </button>
    </div>
  );
}

// Simple component that directly calls useAuth
function TestUseAuthComponent() {
  useAuth(); // This should throw
  return <div>Test</div>;
}

describe('AuthContext', () => {
  const mockDatabaseService =
    require('../../lib/services/databaseService').databaseService;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});

    // Setup default mocks
    mockDatabaseService.ensureUserExists.mockResolvedValue({
      id: 'test-user-id',
      walletAddress: 'test-wallet',
    });

    mockDatabaseService.getUserProfile.mockResolvedValue({
      id: 'test-user-id',
      walletAddress: new PublicKey('test-wallet'),
      role: UserRole.CREATOR,
      reputation: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      verified: false,
      stats: {
        projectsCreated: 0,
        projectsFunded: 0,
        totalFunded: 0,
        successfulProjects: 0,
      },
    });
  });

  describe('useAuth hook', () => {
    test('should throw error when used outside provider', () => {
      // Mock console.error to avoid noise
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Directly test the useAuth hook by rendering a component that calls it
      expect(() => {
        render(<TestUseAuthComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Initial State', () => {
    test('should start with unauthenticated state', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'not-authenticated'
      );
      expect(screen.getByTestId('user-role')).toHaveTextContent('no-user');
    });
  });

  describe('Authentication Actions', () => {
    test('should handle login successfully', async () => {
      const user = userEvent.setup();

      // Mock fetch to return a challenge (but signMessage is not provided, so it uses mockLogin)
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          nonce: 'test-nonce',
          message: 'test-message',
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        }),
      });

      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );
      });

      const loginButton = screen.getByTestId('login-btn');

      await act(async () => {
        await user.click(loginButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent(
          'authenticated'
        );
      }, { timeout: 3000 });

      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(mockDatabaseService.ensureUserExists).toHaveBeenCalledWith(
        'test-wallet'
      );
      expect(mockDatabaseService.getUserProfile).toHaveBeenCalledWith(
        'test-user-id'
      );
    });

    test('should handle logout', async () => {
      const user = userEvent.setup();

      // Mock fetch to return a challenge (but signMessage is not provided, so it uses mockLogin)
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          nonce: 'test-nonce',
          message: 'test-message',
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        }),
      });

      // First login
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );
      });

      const loginButton = screen.getByTestId('login-btn');

      await act(async () => {
        await user.click(loginButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent(
          'authenticated'
        );
      }, { timeout: 3000 });

      // Then logout
      const logoutButton = screen.getByTestId('logout-btn');

      await act(async () => {
        await user.click(logoutButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent(
          'not-authenticated'
        );
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledTimes(2); // session and user
    });
  });

  describe('Permission Checking', () => {
    test('should check permissions correctly', async () => {
      const user = userEvent.setup();

      // Mock fetch to return a challenge (but signMessage is not provided, so it uses mockLogin)
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          nonce: 'test-nonce',
          message: 'test-message',
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        }),
      });

      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );
      });

      // Initially cannot create projects
      expect(screen.getByTestId('can-create-project')).toHaveTextContent(
        'cannot-create'
      );

      // Login as creator
      const loginButton = screen.getByTestId('login-btn');

      await act(async () => {
        await user.click(loginButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent(
          'authenticated'
        );
      }, { timeout: 3000 });

      // Should now be able to create projects
      expect(screen.getByTestId('can-create-project')).toHaveTextContent(
        'can-create'
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle login errors gracefully', async () => {
      // Mock the database service to reject
      mockDatabaseService.ensureUserExists.mockRejectedValue(
        new Error('Database error')
      );

      const user = userEvent.setup();

      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );
      });

      const loginButton = screen.getByTestId('login-btn');

      // The login function throws an error asynchronously
      // We need to wait for the error to occur and ensure it's handled
      const loginPromise = act(async () => {
        await user.click(loginButton);
      });

      // Wait for the login promise to reject
      await expect(loginPromise).rejects.toThrow('Database error');

      // Wait for the error state to be reflected in the UI
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent(
          'not-authenticated'
        );
      });

      // Verify user stays unauthenticated and no role is set
      expect(screen.getByTestId('user-role')).toHaveTextContent('no-user');
    });
  });
});
