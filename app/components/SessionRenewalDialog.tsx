import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface SessionRenewalDialogProps {
  isOpen: boolean;
  timeRemaining: number; // in seconds
  onRenew: () => Promise<void>;
  onLogout: () => void;
  onClose: () => void;
}

/**
 * SessionRenewalDialog Component
 * 
 * Proactive session renewal with user consent
 * 
 * Features:
 * - Countdown timer showing time until expiration
 * - Clear "Renew" and "Logout" options
 * - Current session information
 * - Renewal progress indicator
 * - "Remember my choice" for automatic renewals
 * - Keyboard accessible (ESC to close, Tab navigation)
 * - Screen reader support with ARIA attributes
 */
export default function SessionRenewalDialog({
  isOpen,
  timeRemaining: initialTimeRemaining,
  onRenew,
  onLogout,
  onClose,
}: SessionRenewalDialogProps) {
  const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining);
  const [renewing, setRenewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberChoice, setRememberChoice] = useState(false);

  useEffect(() => {
    setTimeRemaining(initialTimeRemaining);
  }, [initialTimeRemaining]);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Keyboard accessibility
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleRenew = async () => {
    setRenewing(true);
    setError(null);

    try {
      // Save preference if "Remember my choice" is checked
      if (rememberChoice) {
        localStorage.setItem('empowergrid_auto_renew', 'true');
      }

      await onRenew();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to renew session');
    } finally {
      setRenewing(false);
    }
  };

  const handleLogout = () => {
    if (rememberChoice) {
      localStorage.setItem('empowergrid_auto_renew', 'false');
    }
    onLogout();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const isUrgent = timeRemaining < 60; // Less than 1 minute

  return (
    <>
      <div 
        className="dialog-overlay" 
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
      />
      <div
        className="session-renewal-dialog"
        role="dialog"
        aria-labelledby="renewal-dialog-title"
        aria-describedby="renewal-dialog-description"
        aria-modal="true"
      >
        <div className="dialog-header">
          <div className="warning-icon">⏰</div>
          <h2 id="renewal-dialog-title">Session Expiring Soon</h2>
          <button
            className="close-btn"
            onClick={onClose}
            aria-label="Close dialog"
            disabled={renewing}
          >
            ✕
          </button>
        </div>

        <div className="dialog-body">
          <div 
            id="renewal-dialog-description" 
            className="expiration-notice"
          >
            Your session will expire in
          </div>

          <div className={`countdown ${isUrgent ? 'urgent' : ''}`}>
            {formatTime(timeRemaining)}
          </div>

          <div className="session-info">
            <div className="info-item">
              <span className="info-label">Status:</span>
              <span className="info-value">
                {isUrgent ? '⚠️ Expiring very soon' : '⏳ Expiring soon'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Action Required:</span>
              <span className="info-value">Renew to continue</span>
            </div>
          </div>

          {error && (
            <div className="error-message" role="alert">
              <strong>Renewal Failed:</strong> {error}
              <br />
              Please try again or logout and re-authenticate.
            </div>
          )}

          <div className="remember-choice">
            <label>
              <input
                type="checkbox"
                checked={rememberChoice}
                onChange={(e) => setRememberChoice(e.target.checked)}
                disabled={renewing}
              />
              <span>Remember my choice for future sessions</span>
            </label>
          </div>
        </div>

        <div className="dialog-actions">
          <button
            className="btn-renew"
            onClick={handleRenew}
            disabled={renewing || timeRemaining === 0}
            aria-busy={renewing}
          >
            {renewing ? (
              <>
                <span className="spinner" aria-hidden="true">⟳</span>
                Renewing...
              </>
            ) : (
              '✓ Renew Session'
            )}
          </button>

          <button
            className="btn-logout"
            onClick={handleLogout}
            disabled={renewing}
          >
            Logout Now
          </button>
        </div>
      </div>

      <style jsx>{`
        .dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 9998;
          backdrop-filter: blur(2px);
        }

        .session-renewal-dialog {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          border-radius: 16px;
          padding: 2rem;
          max-width: 500px;
          width: 90%;
          z-index: 9999;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -45%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }

        .dialog-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e9ecef;
        }

        .warning-icon {
          font-size: 2.5rem;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .dialog-header h2 {
          flex: 1;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
          color: #dc3545;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6c757d;
          padding: 0.25rem;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .close-btn:hover:not(:disabled) {
          background: #f8f9fa;
          color: #212529;
        }

        .close-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .dialog-body {
          margin-bottom: 1.5rem;
        }

        .expiration-notice {
          text-align: center;
          font-size: 1.1rem;
          color: #6c757d;
          margin-bottom: 1rem;
        }

        .countdown {
          text-align: center;
          font-size: 3.5rem;
          font-weight: 700;
          font-family: 'Monaco', monospace;
          color: #ffc107;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #fff8e1;
          border-radius: 12px;
          transition: all 0.3s;
        }

        .countdown.urgent {
          color: #dc3545;
          background: #ffe5e5;
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .session-info {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          font-size: 0.9rem;
        }

        .info-label {
          color: #6c757d;
          font-weight: 600;
        }

        .info-value {
          color: #212529;
        }

        .error-message {
          background: #f8d7da;
          border: 1px solid #f5c2c7;
          color: #842029;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          line-height: 1.5;
        }

        .remember-choice {
          margin-top: 1rem;
        }

        .remember-choice label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.9rem;
          color: #495057;
        }

        .remember-choice input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .dialog-actions {
          display: flex;
          gap: 1rem;
        }

        .btn-renew,
        .btn-logout {
          flex: 1;
          padding: 1rem;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .btn-renew {
          background: #198754;
          color: white;
        }

        .btn-renew:hover:not(:disabled) {
          background: #157347;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(25, 135, 84, 0.3);
        }

        .btn-renew:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-logout {
          background: #6c757d;
          color: white;
        }

        .btn-logout:hover:not(:disabled) {
          background: #5a6268;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
        }

        .spinner {
          display: inline-block;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Focus styles for accessibility */
        button:focus-visible,
        input:focus-visible {
          outline: 2px solid #0d6efd;
          outline-offset: 2px;
        }
      `}</style>
    </>
  );
}






