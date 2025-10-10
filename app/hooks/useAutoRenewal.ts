/**
 * useAutoRenewal Hook
 * 
 * Provides interface to Automatic Renewal Manager
 */

import { useState, useEffect } from 'react';
import { renewalManager } from '../lib/session/AutomaticRenewalManager';

export function useAutoRenewal() {
  const [renewalState, setRenewalState] = useState(renewalManager.getState());
  const [preferences, setPreferences] = useState(renewalManager.getPreferences());

  useEffect(() => {
    // Update state periodically
    const interval = setInterval(() => {
      setRenewalState(renewalManager.getState());
      setPreferences(renewalManager.getPreferences());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Enable or disable automatic renewal
   */
  const setAutoRenewal = (enabled: boolean) => {
    renewalManager.updatePreferences({ autoRenewalEnabled: enabled });
    setPreferences(renewalManager.getPreferences());
  };

  /**
   * Set reminder minutes
   */
  const setReminderMinutes = (minutes: number) => {
    renewalManager.updatePreferences({ reminderMinutes: minutes });
    setPreferences(renewalManager.getPreferences());
  };

  /**
   * Trigger manual renewal
   */
  const triggerRenewal = async (): Promise<boolean> => {
    return renewalManager.triggerRenewal();
  };

  /**
   * Get last activity time
   */
  const getLastActivityTime = (): Date => {
    return renewalManager.getLastActivityTime();
  };

  return {
    // State
    status: renewalState.status,
    lastRenewalAttempt: renewalState.lastRenewalAttempt,
    renewalCount: renewalState.renewalCount,
    failureCount: renewalState.failureCount,

    // Preferences
    autoRenewalEnabled: preferences.autoRenewalEnabled,
    reminderMinutes: preferences.reminderMinutes,

    // Actions
    setAutoRenewal,
    setReminderMinutes,
    triggerRenewal,
    getLastActivityTime,
  };
}




