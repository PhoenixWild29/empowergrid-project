import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * WO-175: UI State Management and Navigation System
 * 
 * Global admin context for managing authentication and shared state
 */

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
}

interface AdminContextValue {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: AdminUser | null) => void;
  clearError: () => void;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Mock login - in production, call actual auth API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      setUser(data.user);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsLoading(false);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AdminContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    error,
    login,
    logout,
    setUser,
    clearError,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

