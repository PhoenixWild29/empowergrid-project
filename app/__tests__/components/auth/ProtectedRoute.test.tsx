import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import { AuthProvider, fetchUserProfile, validateSession } from '../../../contexts/AuthContext';
import { UserRole, Permission } from '../../../types/auth';

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

// Mock PublicKey
const { PublicKey } = require('@solana/web3.js');

jest.mock('@solana/web3.js', () => ({
  PublicKey: jest.fn().mockImplementation((value) => ({
    toString: () => value || 'mock-public-key',
    equals: jest.fn(),
    toBase58: () => value || 'mock-public-key',
    toJSON: () => value || 'mock-public-key',
    toBytes: () => new Uint8Array(),
  })),
}));

// Mock AuthContext functions
jest.mock('../../../contexts/AuthContext', () => {
  const actual = jest.requireActual('../../../contexts/AuthContext');
  return {
    ...actual,
    fetchUserProfile: jest.fn(),
    validateSession: jest.fn(),
  };
});

// Test component
function TestContent() {
  return <div data-testid="protected-content">Protected Content</div>;
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Unauthenticated Users', () => {
    test('should redirect to login when user is not authenticated', async () => {
      render(
        <AuthProvider>
          <ProtectedRoute>
            <TestContent />
          </ProtectedRoute>
        </AuthProvider>
      );

      // Should redirect after loading (useEffect runs synchronously)
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });

      // Should not render protected content
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    test('should redirect to custom path when specified', async () => {
      render(
        <AuthProvider>
          <ProtectedRoute fallbackPath="/custom-login">
            <TestContent />
          </ProtectedRoute>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/custom-login');
      });
    });
  });

  describe('Authenticated Users', () => {
    test('should render content when user is authenticated', async () => {
      // Mock authenticated state by setting up localStorage
      const mockSession = {
        userId: 'test-user',
        walletAddress: 'test-wallet',
        token: 'test-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        createdAt: new Date().toISOString(),
      };

      const mockUser = {
        id: 'test-user',
        walletAddress: { toString: () => 'test-wallet' },
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

      // Mock localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn((key) => {
            if (key === 'empowergrid_session') return JSON.stringify(mockSession);
            if (key === 'empowergrid_user') return JSON.stringify(mockUser);
            return null;
          }),
          setItem: jest.fn(),
          removeItem: jest.fn(),
          clear: jest.fn(),
        },
        writable: true,
      });

      // Mock the fetchUserProfile function
      (fetchUserProfile as jest.MockedFunction<typeof fetchUserProfile>)
        .mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <ProtectedRoute>
            <TestContent />
          </ProtectedRoute>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('Role-Based Protection', () => {
    test('should allow access when user has required role', async () => {
      // Mock authenticated state by setting up localStorage
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
      };

      // Mock localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn((key) => {
            if (key === 'empowergrid_session') return JSON.stringify(mockSession);
            if (key === 'empowergrid_user') return JSON.stringify(mockUser);
            return null;
          }),
          setItem: jest.fn(),
          removeItem: jest.fn(),
          clear: jest.fn(),
        },
        writable: true,
      });

      (fetchUserProfile as unknown as jest.Mock).mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <ProtectedRoute requiredRole={UserRole.CREATOR}>
            <TestContent />
          </ProtectedRoute>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    test('should deny access when user lacks required role', async () => {
      // Mock authenticated state by setting up localStorage
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

      // Mock localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn((key) => {
            if (key === 'empowergrid_session') return JSON.stringify(mockSession);
            if (key === 'empowergrid_user') return JSON.stringify(mockUser);
            return null;
          }),
          setItem: jest.fn(),
          removeItem: jest.fn(),
          clear: jest.fn(),
        },
        writable: true,
      });

      (validateSession as unknown as jest.Mock).mockResolvedValue(true);
      (fetchUserProfile as unknown as jest.Mock).mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <ProtectedRoute requiredRole={UserRole.CREATOR}>
            <TestContent />
          </ProtectedRoute>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/unauthorized');
      });

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    test('should allow admin access regardless of required role', async () => {
      // Mock authenticated state by setting up localStorage
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
        role: UserRole.ADMIN,
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

      // Mock localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn((key) => {
            if (key === 'empowergrid_session') return JSON.stringify(mockSession);
            if (key === 'empowergrid_user') return JSON.stringify(mockUser);
            return null;
          }),
          setItem: jest.fn(),
          removeItem: jest.fn(),
          clear: jest.fn(),
        },
        writable: true,
      });

      (fetchUserProfile as unknown as jest.Mock).mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <ProtectedRoute requiredRole={UserRole.CREATOR}>
            <TestContent />
          </ProtectedRoute>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });
  });

  describe('Permission-Based Protection', () => {
    test('should allow access when user has required permission', async () => {
      // Mock authenticated state by setting up localStorage
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
      };

      // Mock localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn((key) => {
            if (key === 'empowergrid_session') return JSON.stringify(mockSession);
            if (key === 'empowergrid_user') return JSON.stringify(mockUser);
            return null;
          }),
          setItem: jest.fn(),
          removeItem: jest.fn(),
          clear: jest.fn(),
        },
        writable: true,
      });

      (fetchUserProfile as unknown as jest.Mock).mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <ProtectedRoute requiredPermission={Permission.CREATE_PROJECT}>
            <TestContent />
          </ProtectedRoute>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    test('should deny access when user lacks required permission', async () => {
      // Mock authenticated state by setting up localStorage
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

      // Mock localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn((key) => {
            if (key === 'empowergrid_session') return JSON.stringify(mockSession);
            if (key === 'empowergrid_user') return JSON.stringify(mockUser);
            return null;
          }),
          setItem: jest.fn(),
          removeItem: jest.fn(),
          clear: jest.fn(),
        },
        writable: true,
      });

      (fetchUserProfile as unknown as jest.Mock).mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <ProtectedRoute requiredPermission={Permission.CREATE_PROJECT}>
            <TestContent />
          </ProtectedRoute>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/unauthorized');
      });
    });
  });

  describe('Redirect If Authenticated', () => {
    test('should redirect authenticated users away from login pages', async () => {
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

      (fetchUserProfile as unknown as jest.Mock).mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <ProtectedRoute redirectIfAuthenticated>
            <TestContent />
          </ProtectedRoute>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/');
      });
    });
  });
});