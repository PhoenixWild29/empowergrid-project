/**
 * useSessionRenewal Hook
 * 
 * Manages session renewal logic and dialog display
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface SessionRenewalState {
  showDialog: boolean;
  timeRemaining: number;
  lastActivity: Date | null;
}

/**
 * Custom hook for session renewal management
 */
export function useSessionRenewal() {
  const { isAuthenticated, login } = useAuth();
  const [state, setState] = useState<SessionRenewalState>({
    showDialog: false,
    timeRemaining: 0,
    lastActivity: null,
  });

  /**
   * Check if automatic renewal is enabled
   */
  const isAutoRenewalEnabled = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('empowergrid_auto_renew') === 'true';
  }, []);

  /**
   * Monitor session and show dialog when near expiration
   */
  useEffect(() => {
    if (!isAuthenticated) {
      setState({
        showDialog: false,
        timeRemaining: 0,
        lastActivity: null,
      });
      return;
    }

    const checkSession = () => {
      const sessionData = localStorage.getItem('empowergrid_session');
      if (!sessionData) return;

      try {
        const session = JSON.parse(sessionData);
        const expiresAt = new Date(session.expiresAt);
        const now = new Date();
        const remaining = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);

        // Show dialog when < 3 minutes remaining
        if (remaining <= 180 && remaining > 0) {
          // Auto-renew if enabled
          if (isAutoRenewalEnabled() && !state.showDialog) {
            renewSession();
            return;
          }

          setState({
            showDialog: true,
            timeRemaining: remaining,
            lastActivity: new Date(session.updatedAt),
          });
        } else {
          setState(prev => ({
            ...prev,
            showDialog: false,
          }));
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, isAutoRenewalEnabled, state.showDialog]);

  /**
   * Renew the session
   */
  const renewSession = useCallback(async (): Promise<void> => {
    try {
      // Call refresh token endpoint
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to renew session');
      }

      const data = await response.json();

      // Update session in localStorage
      if (data.session) {
        localStorage.setItem('empowergrid_session', JSON.stringify(data.session));
      }

      setState({
        showDialog: false,
        timeRemaining: 0,
        lastActivity: new Date(),
      });
    } catch (error) {
      console.error('Session renewal failed:', error);
      throw error;
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      localStorage.removeItem('empowergrid_session');
      localStorage.removeItem('empowergrid_auth_token');

      // Reload to clear state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      // Force reload anyway
      window.location.href = '/';
    }
  }, []);

  /**
   * Close the dialog
   */
  const closeDialog = useCallback(() => {
    setState(prev => ({
      ...prev,
      showDialog: false,
    }));
  }, []);

  /**
   * Set auto-renewal preference
   */
  const setAutoRenewal = useCallback((enabled: boolean) => {
    localStorage.setItem('empowergrid_auto_renew', enabled ? 'true' : 'false');
  }, []);

  return {
    showDialog: state.showDialog,
    timeRemaining: state.timeRemaining,
    lastActivity: state.lastActivity,
    renewSession,
    logout,
    closeDialog,
    isAutoRenewalEnabled: isAutoRenewalEnabled(),
    setAutoRenewal,
  };
}




