/**
 * Session Utility Functions
 * 
 * Helper functions for session management
 */

/**
 * Format time in seconds to MM:SS
 */
export function formatSessionTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format time in seconds to human-readable string
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Expired';
  
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  } else if (mins > 0) {
    return `${mins}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Calculate time remaining until expiration
 */
export function calculateTimeRemaining(expiresAt: Date): number {
  const now = new Date();
  const remaining = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
  return Math.max(0, remaining);
}

/**
 * Check if session is expiring soon
 */
export function isSessionExpiringSoon(expiresAt: Date, thresholdMinutes: number = 5): boolean {
  const remaining = calculateTimeRemaining(expiresAt);
  return remaining <= thresholdMinutes * 60 && remaining > 0;
}

/**
 * Check if session is expired
 */
export function isSessionExpired(expiresAt: Date): boolean {
  return new Date() >= expiresAt;
}

/**
 * Get session from localStorage
 */
export function getStoredSession(): {
  token: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
} | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const sessionData = localStorage.getItem('empowergrid_session');
    if (!sessionData) return null;
    return JSON.parse(sessionData);
  } catch {
    return null;
  }
}

/**
 * Store session in localStorage
 */
export function storeSession(session: {
  token: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('empowergrid_session', JSON.stringify(session));
}

/**
 * Clear session from localStorage
 */
export function clearStoredSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('empowergrid_session');
  localStorage.removeItem('empowergrid_auth_token');
}

/**
 * Get auto-renewal preference
 */
export function getAutoRenewalPreference(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('empowergrid_auto_renew') === 'true';
}

/**
 * Set auto-renewal preference
 */
export function setAutoRenewalPreference(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('empowergrid_auto_renew', enabled ? 'true' : 'false');
}

/**
 * Format last activity time
 */
export function formatLastActivity(lastActivity: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - lastActivity.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 60) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else {
    return lastActivity.toLocaleDateString();
  }
}






