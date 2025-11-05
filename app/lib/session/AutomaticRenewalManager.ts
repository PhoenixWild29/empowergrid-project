/**
 * Automatic Renewal Manager
 * 
 * Intelligently coordinates automatic session renewal with user activity
 */

type RenewalStatus = 'idle' | 'monitoring' | 'renewing' | 'prompting' | 'failed';

interface RenewalPreferences {
  autoRenewalEnabled: boolean;
  reminderMinutes: number; // Minutes before expiration to show reminder
  lastUpdated: Date;
}

interface RenewalState {
  status: RenewalStatus;
  lastRenewalAttempt: Date | null;
  renewalCount: number;
  failureCount: number;
}

export class AutomaticRenewalManager {
  private static instance: AutomaticRenewalManager;
  private state: RenewalState;
  private preferences: RenewalPreferences;
  private checkInterval: NodeJS.Timeout | null = null;
  private activityTimeout: NodeJS.Timeout | null = null;
  private lastActivityTime: Date;
  private onRenewalRequired?: (timeRemaining: number) => void;
  private onRenewalSuccess?: () => void;
  private onRenewalFailure?: (error: Error) => void;

  private constructor() {
    this.state = {
      status: 'idle',
      lastRenewalAttempt: null,
      renewalCount: 0,
      failureCount: 0,
    };

    this.preferences = this.loadPreferences();
    this.lastActivityTime = new Date();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AutomaticRenewalManager {
    if (!AutomaticRenewalManager.instance) {
      AutomaticRenewalManager.instance = new AutomaticRenewalManager();
    }
    return AutomaticRenewalManager.instance;
  }

  /**
   * Start monitoring session
   */
  start(callbacks?: {
    onRenewalRequired?: (timeRemaining: number) => void;
    onRenewalSuccess?: () => void;
    onRenewalFailure?: (error: Error) => void;
  }): void {
    if (callbacks) {
      this.onRenewalRequired = callbacks.onRenewalRequired;
      this.onRenewalSuccess = callbacks.onRenewalSuccess;
      this.onRenewalFailure = callbacks.onRenewalFailure;
    }

    this.state.status = 'monitoring';
    this.startMonitoring();
    this.startActivityTracking();
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.state.status = 'idle';
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
      this.activityTimeout = null;
    }
  }

  /**
   * Start session monitoring
   */
  private startMonitoring(): void {
    // Check session every 10 seconds
    this.checkInterval = setInterval(() => {
      this.checkSession();
    }, 10000);

    // Initial check
    this.checkSession();
  }

  /**
   * Check session status
   */
  private async checkSession(): Promise<void> {
    if (this.state.status !== 'monitoring') return;

    try {
      const sessionData = localStorage.getItem('empowergrid_session');
      if (!sessionData) return;

      const session = JSON.parse(sessionData);
      const expiresAt = new Date(session.expiresAt);
      const now = new Date();
      const timeRemaining = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);

      // Calculate reminder threshold (default 3 minutes before expiration)
      const reminderThreshold = this.preferences.reminderMinutes * 60;

      if (timeRemaining <= 0) {
        // Session expired
        this.handleSessionExpired();
      } else if (timeRemaining <= reminderThreshold) {
        // Near expiration
        await this.handleNearExpiration(timeRemaining);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  }

  /**
   * Handle near expiration
   */
  private async handleNearExpiration(timeRemaining: number): Promise<void> {
    // Check if user is active
    const timeSinceActivity = Date.now() - this.lastActivityTime.getTime();
    const isUserActive = timeSinceActivity < 5 * 60 * 1000; // Active within last 5 minutes

    if (this.preferences.autoRenewalEnabled && isUserActive) {
      // Auto-renew if enabled and user is active
      await this.renewSession();
    } else {
      // Show renewal prompt
      this.state.status = 'prompting';
      if (this.onRenewalRequired) {
        this.onRenewalRequired(timeRemaining);
      }
    }
  }

  /**
   * Handle session expired
   */
  private handleSessionExpired(): void {
    this.stop();
    // Redirect to login or show expired message
    console.warn('Session expired');
  }

  /**
   * Renew session
   */
  async renewSession(): Promise<boolean> {
    if (this.state.status === 'renewing') {
      // Already renewing
      return false;
    }

    this.state.status = 'renewing';
    this.state.lastRenewalAttempt = new Date();

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Renewal failed');
      }

      const data = await response.json();

      // Update session
      if (data.session) {
        localStorage.setItem('empowergrid_session', JSON.stringify(data.session));
      }

      // Update state
      this.state.status = 'monitoring';
      this.state.renewalCount++;
      this.state.failureCount = 0;

      if (this.onRenewalSuccess) {
        this.onRenewalSuccess();
      }

      return true;
    } catch (error) {
      this.state.status = 'failed';
      this.state.failureCount++;

      if (this.onRenewalFailure) {
        this.onRenewalFailure(error as Error);
      }

      // Return to monitoring after failure
      setTimeout(() => {
        if (this.state.status === 'failed') {
          this.state.status = 'monitoring';
        }
      }, 5000);

      return false;
    }
  }

  /**
   * Start activity tracking
   */
  private startActivityTracking(): void {
    if (typeof window === 'undefined') return;

    // Track user activity
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      this.lastActivityTime = new Date();
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
  }

  /**
   * Load preferences
   */
  private loadPreferences(): RenewalPreferences {
    if (typeof window === 'undefined') {
      return {
        autoRenewalEnabled: false,
        reminderMinutes: 3,
        lastUpdated: new Date(),
      };
    }

    try {
      const stored = localStorage.getItem('empowergrid_renewal_preferences');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }

    return {
      autoRenewalEnabled: false,
      reminderMinutes: 3,
      lastUpdated: new Date(),
    };
  }

  /**
   * Update preferences
   */
  updatePreferences(updates: Partial<RenewalPreferences>): void {
    this.preferences = {
      ...this.preferences,
      ...updates,
      lastUpdated: new Date(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('empowergrid_renewal_preferences', JSON.stringify(this.preferences));
    }
  }

  /**
   * Get current state
   */
  getState(): RenewalState {
    return { ...this.state };
  }

  /**
   * Get preferences
   */
  getPreferences(): RenewalPreferences {
    return { ...this.preferences };
  }

  /**
   * Get last activity time
   */
  getLastActivityTime(): Date {
    return this.lastActivityTime;
  }

  /**
   * Manual renewal trigger
   */
  async triggerRenewal(): Promise<boolean> {
    return this.renewSession();
  }
}

// Export singleton instance
export const renewalManager = AutomaticRenewalManager.getInstance();






