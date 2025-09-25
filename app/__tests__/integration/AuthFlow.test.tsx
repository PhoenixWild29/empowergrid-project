import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PublicKey } from '@solana/web3.js';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { UserRole, Permission } from '../../types/auth';
import WalletConnect from '../../components/WalletConnect';
import ProtectedRoute from '../../components/auth/ProtectedRoute';

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

// Mock window.solana
Object.defineProperty(window, 'solana', {
  value: mockPhantomWallet,
  writable: true,
});

// Test component that shows auth state
function AuthStatus() {
  const { isAuthenticated, user, hasPermission } = useAuth();

  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      {user && (
        <div data-testid="user-info">
          <span data-testid="username">{user.username}</span>
          <span data-testid="role">{user.role}</span>
          <span data-testid="can-create">{hasPermission(Permission.CREATE_PROJECT) ? 'yes' : 'no'}</span>
        </div>
      )}
    </div>
  );
}

// Protected content component
function ProtectedContent() {
  return <div data-testid="protected-content">Secret Content</div>;
}

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.push.mockClear();

    // Reset wallet mock
    mockPhantomWallet.connect.mockResolvedValue({
      publicKey: new PublicKey('test-wallet-address'),
    });
    mockPhantomWallet.disconnect.mockResolvedValue(undefined);
  });

  describe('Wallet Connection Flow', () => {
    test('should authenticate user when wallet connects', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <AuthStatus />
          <WalletConnect />
        </AuthProvider>
      );

      // Initially not authenticated
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');

      // Click connect wallet
      const connectButton = screen.getByText('Connect Wallet');
      await user.click(connectButton);

      // Should trigger wallet connection
      expect(mockPhantomWallet.connect).toHaveBeenCalled();

      // Should authenticate user
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Should show user info
      expect(screen.getByTestId('username')).toBeInTheDocument();
      expect(screen.getByTestId('role')).toHaveTextContent(UserRole.FUNDER);
    });

    test('should logout user when wallet disconnects', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <AuthStatus />
          <WalletConnect />
        </AuthProvider>
      );

      // Connect wallet first
      const connectButton = screen.getByText('Connect Wallet');
      await user.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Disconnect wallet
      const disconnectButton = screen.getByText('Disconnect');
      await user.click(disconnectButton);

      // Should logout user
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      });

      expect(mockPhantomWallet.disconnect).toHaveBeenCalled();
    });
  });

  describe('Protected Routes', () => {
    test('should redirect unauthenticated users', async () => {
      render(
        <AuthProvider>
          <ProtectedRoute>
            <ProtectedContent />
          </ProtectedRoute>
        </AuthProvider>
      );

      // Should redirect to login
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });

      // Should not show protected content
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    test('should allow authenticated users to access protected content', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <AuthStatus />
          <ProtectedRoute>
            <ProtectedContent />
          </ProtectedRoute>
        </AuthProvider>
      );

      // Authenticate user first
      const connectButton = screen.getByText('Connect Wallet');
      await user.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Should show protected content
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    test('should enforce role-based access control', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <AuthStatus />
          <ProtectedRoute requiredRole={UserRole.CREATOR}>
            <ProtectedContent />
          </ProtectedRoute>
        </AuthProvider>
      );

      // Authenticate as funder (default role)
      const connectButton = screen.getByText('Connect Wallet');
      await user.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Should redirect to unauthorized (funder cannot access creator-only content)
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/unauthorized');
      });
    });
  });

  describe('Permission System', () => {
    test('should grant permissions based on user role', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <AuthStatus />
        </AuthProvider>
      );

      // Authenticate user
      const connectButton = screen.getByText('Connect Wallet');
      await user.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Funder should not be able to create projects
      expect(screen.getByTestId('can-create')).toHaveTextContent('no');
    });

    test('should allow admin to access everything', async () => {
      // Mock admin user
      const mockAdminUser = {
        id: 'admin-user',
        walletAddress: new PublicKey('admin-wallet'),
        username: 'AdminUser',
        role: UserRole.ADMIN,
        reputation: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        verified: true,
        stats: {
          projectsCreated: 10,
          projectsFunded: 20,
          totalFunded: 50000,
          successfulProjects: 15,
        },
      };

      jest.spyOn(require('../../contexts/AuthContext'), 'mockLogin')
        .mockResolvedValue({
          user: mockAdminUser,
          token: 'admin-token',
          expiresAt: new Date(Date.now() + 3600000),
        });

      const user = userEvent.setup();

      render(
        <AuthProvider>
          <AuthStatus />
          <ProtectedRoute requiredRole={UserRole.CREATOR}>
            <ProtectedContent />
          </ProtectedRoute>
        </AuthProvider>
      );

      // Authenticate as admin
      const connectButton = screen.getByText('Connect Wallet');
      await user.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      // Admin should be able to access creator-only content
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('Session Persistence', () => {
    test('should restore session on page reload', async () => {
      // Mock existing session in localStorage
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
        username: 'TestUser',
        role: UserRole.FUNDER,
        reputation: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
        verified: false,
        stats: {
          projectsCreated: 1,
          projectsFunded: 2,
          totalFunded: 500,
          successfulProjects: 1,
        },
      };

      // Mock localStorage
      const localStorageMock = {
        getItem: jest.fn((key) => {
          if (key === 'empowergrid_session') return JSON.stringify(mockSession);
          if (key === 'empowergrid_user') return JSON.stringify(mockUser);
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

      // Mock fetchUserProfile
      jest.spyOn(require('../../contexts/AuthContext'), 'fetchUserProfile')
        .mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <AuthStatus />
        </AuthProvider>
      );

      // Should automatically restore session
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      expect(screen.getByTestId('username')).toHaveTextContent('TestUser');
    });
  });

  describe('Error Handling', () => {
    test('should handle wallet connection errors', async () => {
      const user = userEvent.setup();

      // Mock wallet connection failure
      mockPhantomWallet.connect.mockRejectedValue(new Error('Wallet connection failed'));

      render(
        <AuthProvider>
          <AuthStatus />
          <WalletConnect />
        </AuthProvider>
      );

      const connectButton = screen.getByText('Connect Wallet');
      await user.click(connectButton);

      // Should remain unauthenticated
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      });
    });

    test('should handle expired sessions', async () => {
      // Mock expired session
      const expiredSession = {
        userId: 'test-user',
        walletAddress: 'test-wallet',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
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
        <AuthProvider>
          <AuthStatus />
        </AuthProvider>
      );

      // Should clear expired session and remain unauthenticated
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      });

      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });
  });
});