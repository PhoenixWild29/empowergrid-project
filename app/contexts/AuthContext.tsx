import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from 'react';
import { PublicKey } from '@solana/web3.js';
import {
  AuthContextType,
  AuthState,
  UserProfile,
  UserRole,
  Permission,
  SessionData,
  hasPermission,
  LoginResponse,
} from '../types/auth';
import { useErrorHandler } from '../hooks/useErrorHandler';
// Import databaseService - it's safe as it only uses Prisma on server-side API routes
// The service won't be called during SSR rendering, only in client-side effects
import { databaseService, isDatabaseAvailable } from '../lib/services/databaseService';

// Auth reducer actions
type AuthAction =
  | { type: 'AUTH_START' }
  | {
      type: 'AUTH_SUCCESS';
      payload: { user: UserProfile; walletAddress: PublicKey };
    }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_PROFILE'; payload: UserProfile }
  | { type: 'SET_LOADING'; payload: boolean };

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload.user,
        walletAddress: action.payload.walletAddress,
        error: null,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        walletAddress: null,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        isAuthenticated: false,
        isLoading: false,
        user: null,
        walletAddress: null,
        error: null,
      };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        user: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
}

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true, // Start with loading to check for existing session
  user: null,
  walletAddress: null,
  error: null,
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session storage keys
const SESSION_KEY = 'empowergrid_session';
const USER_KEY = 'empowergrid_user';

// Session management utilities
const saveSession = (sessionData: SessionData) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  }
};

const getSession = (): SessionData | null => {
  if (typeof window === 'undefined') return null;

  try {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) return null;

    const sessionData: any = JSON.parse(session);

    // Convert expiresAt from string to Date if needed
    const expiresAt = typeof sessionData.expiresAt === 'string' 
      ? new Date(sessionData.expiresAt)
      : sessionData.expiresAt;

    // Check if session is expired
    if (expiresAt < new Date()) {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    }

    return {
      ...sessionData,
      expiresAt,
      createdAt: sessionData.createdAt ? (typeof sessionData.createdAt === 'string' ? new Date(sessionData.createdAt) : sessionData.createdAt) : new Date(),
    };
  } catch (error) {
    console.error('Failed to parse session:', error);
    return null;
  }
};

const clearSession = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

// Auth provider component
interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  // Disable toasts in error handler to prevent circular dependencies during initialization
  const { handleError: handleErrorFromHook } = useErrorHandler({ showToast: false });
  
  // Wrap error handler to catch any errors
  const handleError = (error: unknown, message?: string) => {
    try {
      handleErrorFromHook(error, message);
    } catch (err) {
      // Fallback to console if error handler itself fails
      console.error(message || 'Error:', error);
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      const session = getSession();
      if (!session) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      try {
        // Validate session with backend using the new session endpoint
        const sessionResponse = await fetch('/api/auth/session', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.token}`,
          },
        });

        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          
          if (sessionData.success && sessionData.user) {
            // Session is valid, restore user state
            const walletAddress = new PublicKey(sessionData.user.walletAddress);
            
            // Update session expiry if different
            const sessionExpiresAt = typeof session.expiresAt === 'string' 
              ? session.expiresAt 
              : session.expiresAt.toISOString();
            if (sessionData.session.expiresAt !== sessionExpiresAt) {
              const updatedSession = {
                ...session,
                expiresAt: new Date(sessionData.session.expiresAt),
              };
              saveSession(updatedSession);
            }

            dispatch({
              type: 'AUTH_SUCCESS',
              payload: {
                user: {
                  ...sessionData.user,
                  walletAddress,
                  createdAt: new Date(sessionData.user.createdAt),
                  updatedAt: new Date(),
                },
                walletAddress,
              },
            });
            
            console.log('Session restored successfully', {
              userId: sessionData.user.id,
              expiresIn: sessionData.token.expiresIn,
            });
          } else {
            // Session validation failed
            clearSession();
            dispatch({ type: 'SET_LOADING', payload: false });
          }
        } else {
          // Session is invalid or expired
          console.warn('Session validation failed:', sessionResponse.status);
          clearSession();
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        clearSession();
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkExistingSession();
  }, []); // Remove handleError dependency to prevent infinite loop

  // Authentication actions
  const login = async (walletAddress: PublicKey, signMessage?: (message: string) => Promise<Uint8Array>): Promise<void> => {
    dispatch({ type: 'AUTH_START' });

    try {
      // Step 1: Request authentication challenge from API
      const challengeResponse = await fetch('/api/auth/challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: walletAddress.toString(),
        }),
      });

      if (!challengeResponse.ok) {
        const errorData = await challengeResponse.json();
        throw new Error(errorData.message || 'Failed to generate challenge');
      }

      const challengeData = await challengeResponse.json();

      console.log('Challenge generated:', {
        nonce: challengeData.nonce.substring(0, 16) + '...',
        expiresAt: challengeData.expiresAt,
      });

      // Step 2: Sign the challenge message with wallet
      let signature: string;
      
      if (signMessage) {
        // Real wallet signature
        try {
          const messageBytes = new TextEncoder().encode(challengeData.message);
          const signatureBytes = await signMessage(challengeData.message);
          
          // Convert signature to base58
          const bs58 = await import('bs58');
          signature = bs58.default.encode(signatureBytes);
          
          console.log('Message signed with wallet');
        } catch (signError) {
          console.error('Wallet signature failed:', signError);
          throw new Error('Failed to sign message with wallet. Please try again.');
        }
      } else {
        // Mock mode: Fall back to mock authentication for development
        console.warn('No wallet signMessage function provided, using mock authentication');
        const loginResponse = await mockLogin(walletAddress);

        // Save session
        const sessionData: SessionData = {
          userId: loginResponse.user.id,
          walletAddress: walletAddress.toString(),
          token: loginResponse.token,
          expiresAt: loginResponse.expiresAt,
          createdAt: new Date(),
        };

        saveSession(sessionData);

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: loginResponse.user, walletAddress },
        });
        return;
      }

      // Step 3: Send signature to login endpoint for verification
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: walletAddress.toString(),
          signature,
          message: challengeData.message,
          nonce: challengeData.nonce,
        }),
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json();
        throw new Error(errorData.message || 'Authentication failed');
      }

      const loginData = await loginResponse.json();

      console.log('Login successful:', {
        userId: loginData.user.id,
        username: loginData.user.username,
      });

      // Step 4: Save session with JWT token
      const sessionData: SessionData = {
        userId: loginData.user.id,
        walletAddress: walletAddress.toString(),
        token: loginData.accessToken,
        refreshToken: loginData.refreshToken,
        expiresAt: new Date(loginData.expiresAt),
        createdAt: new Date(),
      };

      saveSession(sessionData);

      // Step 5: Update auth state
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { 
          user: {
            ...loginData.user,
            walletAddress,
          }, 
          walletAddress 
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      dispatch({
        type: 'AUTH_ERROR',
        payload: error instanceof Error ? error.message : 'Login failed',
      });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const session = getSession();
      
      // Call logout API if we have a token
      if (session?.token) {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.token}`,
            },
          });
        } catch (apiError) {
          // Continue with local logout even if API call fails
          console.error('Logout API call failed:', apiError);
        }
      }
      
      // Clear local session
      clearSession();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      handleError(error, 'Logout failed');
    }
  };

  const updateProfile = async (
    updates: Partial<UserProfile>
  ): Promise<void> => {
    if (!state.user) throw new Error('No user logged in');

    try {
      // Mock profile update
      const updatedUser = await mockUpdateProfile(state.user.id, updates);

      // Update local storage
      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      }

      dispatch({ type: 'UPDATE_PROFILE', payload: updatedUser });
    } catch (error) {
      handleError(error, 'Failed to update profile');
      throw error;
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (!state.user) return;

    try {
      const updatedUser = await fetchUserProfile(state.user.id);
      dispatch({ type: 'UPDATE_PROFILE', payload: updatedUser });
    } catch (error) {
      handleError(error, 'Failed to refresh profile');
    }
  };

  const hasPermissionCheck = (permission: Permission): boolean => {
    if (!state.user) return false;
    return hasPermission(state.user.role, permission);
  };

  const switchRole = async (newRole: UserRole): Promise<void> => {
    if (!state.user) throw new Error('No user logged in');

    // In a real app, this would require admin approval or specific conditions
    if (state.user.role === UserRole.ADMIN || newRole === UserRole.FUNDER) {
      await updateProfile({ role: newRole });
    } else {
      throw new Error('Role change not allowed');
    }
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    updateProfile,
    refreshProfile,
    hasPermission: hasPermissionCheck,
    switchRole,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Mock functions (replace with real API calls)
async function mockLogin(walletAddress: PublicKey): Promise<LoginResponse> {
  try {
    // Check if database is available
    if (!isDatabaseAvailable() || !databaseService) {
      // Return mock user if database is not available
      return {
        user: {
          id: 'mock-user-id',
          walletAddress,
          username: `user_${walletAddress.toString().slice(0, 8)}`,
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
        },
        token: `mock_jwt_${Date.now()}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };
    }

    // Ensure user exists in database
    // Note: This is only called client-side in mockLogin, which is only used in development
    const dbUser = await databaseService.ensureUserExists(
      walletAddress.toString()
    );

    // Get complete user profile with stats
    const userProfile = await databaseService.getUserProfile(dbUser.id);

    if (!userProfile) {
      throw new Error('Failed to load user profile');
    }

    return {
      user: userProfile,
      token: `mock_jwt_${Date.now()}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  } catch (error) {
    console.error('Error in mockLogin:', error);
    throw error;
  }
}

async function mockUpdateProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> {
  try {
    // Check if database is available
    if (!isDatabaseAvailable() || !databaseService) {
      // If database is not available, return a mock updated profile
      return {
        id: userId,
        walletAddress: new PublicKey('11111111111111111111111111111111'),
        username: updates.username || 'user',
        role: updates.role || UserRole.FUNDER,
        reputation: updates.reputation || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        verified: updates.verified || false,
        stats: {
          projectsCreated: 0,
          projectsFunded: 0,
          totalFunded: 0,
          successfulProjects: 0,
        },
        ...updates,
      } as UserProfile;
    }

    // Update user profile in database
    // Note: This is only called client-side in mockUpdateProfile
    await databaseService.updateUserProfile(userId, updates);

    // Get updated profile
    const updatedProfile = await databaseService.getUserProfile(userId);

    if (!updatedProfile) {
      throw new Error('Failed to load updated user profile');
    }

    return updatedProfile;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

async function fetchUserProfile(userId: string): Promise<UserProfile> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // Mock user fetch (in real app, this would come from API)
  const storedUser = localStorage.getItem(USER_KEY);
  if (storedUser) {
    return JSON.parse(storedUser);
  }

  throw new Error('User not found');
}

async function validateSession(session: SessionData): Promise<boolean> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));

  // Mock validation (in real app, this would validate token with backend)
  return new Date(session.expiresAt) > new Date();
}

export { fetchUserProfile, mockLogin, mockUpdateProfile, validateSession };
