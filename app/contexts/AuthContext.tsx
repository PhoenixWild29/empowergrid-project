import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
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
import { databaseService } from '../lib/services/databaseService';

// Auth reducer actions
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: UserProfile; walletAddress: PublicKey } }
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

    const sessionData: SessionData = JSON.parse(session);

    // Check if session is expired
    if (new Date(sessionData.expiresAt) < new Date()) {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    }

    return sessionData;
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
  const { handleError } = useErrorHandler();

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      const session = getSession();
      if (!session) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      try {
        // Validate session with backend (mock for now)
        const isValid = await validateSession(session);

        if (isValid) {
          const user = await fetchUserProfile(session.userId);
          const walletAddress = new PublicKey(session.walletAddress);

          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user, walletAddress },
          });
        } else {
          clearSession();
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        handleError(error, 'Failed to restore session');
        clearSession();
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkExistingSession();
  }, []); // Remove handleError dependency to prevent infinite loop

  // Authentication actions
  const login = async (walletAddress: PublicKey): Promise<void> => {
    dispatch({ type: 'AUTH_START' });

    try {
      // Generate challenge message for signing
      const challengeMessage = `Sign this message to authenticate with EmpowerGRID: ${Date.now()}`;

      // In a real app, you would:
      // 1. Send challenge to wallet for signing
      // 2. Verify signature on backend
      // 3. Return JWT token and user profile

      // Mock authentication flow
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
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error instanceof Error ? error.message : 'Login failed' });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // In a real app, you might want to call a logout endpoint
      clearSession();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      handleError(error, 'Logout failed');
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<void> => {
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
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
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
    // Ensure user exists in database
    const dbUser = await databaseService.ensureUserExists(walletAddress.toString());

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

async function mockUpdateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  try {
    // Update user profile in database
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