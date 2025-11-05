import React, { useEffect, useState } from 'react';
import { renewalManager } from '../lib/session/AutomaticRenewalManager';
import SessionRenewalDialog from './SessionRenewalDialog';
import { useSessionRenewal } from '../hooks/useSessionRenewal';

/**
 * AutoRenewalProvider Component
 * 
 * Manages automatic session renewal and coordinates with renewal dialog
 * 
 * Features:
 * - Background session monitoring
 * - Automatic renewal based on user activity
 * - Coordinates with SessionRenewalDialog for user prompts
 * - Handles renewal success and failure
 * - Manages renewal preferences
 */
export default function AutoRenewalProvider({ children }: { children: React.ReactNode }) {
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const { renewSession, logout } = useSessionRenewal();

  useEffect(() => {
    // Start renewal manager
    renewalManager.start({
      onRenewalRequired: (remaining) => {
        setTimeRemaining(remaining);
        setShowRenewalDialog(true);
      },
      onRenewalSuccess: () => {
        setShowRenewalDialog(false);
        console.log('Session renewed automatically');
      },
      onRenewalFailure: (error) => {
        console.error('Auto-renewal failed:', error);
        // Show dialog for manual renewal
        setShowRenewalDialog(true);
      },
    });

    return () => {
      renewalManager.stop();
    };
  }, []);

  const handleRenew = async () => {
    try {
      await renewSession();
      setShowRenewalDialog(false);
    } catch (error) {
      console.error('Manual renewal failed:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleClose = () => {
    setShowRenewalDialog(false);
  };

  return (
    <>
      {children}
      
      <SessionRenewalDialog
        isOpen={showRenewalDialog}
        timeRemaining={timeRemaining}
        onRenew={handleRenew}
        onLogout={handleLogout}
        onClose={handleClose}
      />
    </>
  );
}






