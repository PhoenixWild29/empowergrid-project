import { render, screen, waitFor } from '@testing-library/react';
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
  PublicKey: jest.fn().mockImplementation((value) => ({
    toString: () => value || 'mock-public-key',
    equals: jest.fn((other) => other?.toString() === value),
  })),
}));

// Test component that uses auth context
function TestComponent() {
  const { isAuthenticated, user, login, logout, hasPermission } = useAuth();

  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="user-role">{user?.role || 'no-user'}</div>
      <div data-testid="can-create-project">
        {hasPermission(Permission.CREATE_PROJECT) ? 'can-create' : 'cannot-create'}
      </div>
      <button
        data-testid="login-btn"
        onClick={() => login(new PublicKey('test-wallet'))}
      >
        Login
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
  });

  describe('Initial State', () => {
    test('should start with unauthenticated state', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('user-role')).toHaveTextContent('no-user');
    });

    test('should check for existing session on mount', async () => {
      const mockSession = {
        userId: 'test-user',
        walletAddress: 'test-wallet',
        token: 'test-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        createdAt: new Date().toISOString(),
      };

      const mockUser = {
        id: 'test-user',
        walletAddress: new PublicKey('test-wallet'),
        role: UserRole.FUNDER,
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
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSession));

      // Mock the fetchUserProfile function
      jest.spyOn(require('../../contexts/AuthContext'), 'fetchUserProfile')
        .mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      expect(screen.getByTestId('user-role')).toHaveTextContent(UserRole.FUNDER);
    });
  });

  describe('Authentication Actions', () => {
    test('should handle login successfully', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = screen.getByTestId('login-btn');
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    test('should handle logout', async () => {
      const user = userEvent.setup();

      // First login
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = screen.getByTestId('login-btn');
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Then logout
      const logoutButton = screen.getByTestId('logout-btn');
      await user.click(logoutButton);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledTimes(2); // session and user
    });
  });

  describe('Permission Checking', () => {
    test('should check permissions correctly', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Initially cannot create projects
      expect(screen.getByTestId('can-create-project')).toHaveTextContent('cannot-create');

      // Login as creator
      const loginButton = screen.getByTestId('login-btn');
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Should now be able to create projects (mock user is creator)
      expect(screen.getByTestId('can-create-project')).toHaveTextContent('can-create');
    });
  });

  describe('Error Handling', () => {
    test('should handle login errors', async () => {
      // Mock login to throw error
      jest.spyOn(require('../../contexts/AuthContext'), 'mockLogin')
        .mockRejectedValue(new Error('Login failed'));

      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = screen.getByTestId('login-btn');
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      });
    });
  });

  describe('useAuth hook', () => {
    test('should throw error when used outside provider', () => {
      // Mock console.error to avoid noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<TestComponent />)).toThrow(
        'useAuth must be used within an AuthProvider'
      );

      consoleSpy.mockRestore();
    });
  });
});