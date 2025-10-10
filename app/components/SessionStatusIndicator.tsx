import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

type SessionStatus = 'active' | 'expiring-soon' | 'expired' | 'disconnected';
type SecurityLevel = 'secure' | 'warning' | 'compromised';

/**
 * SessionStatusIndicator Component
 * 
 * Real-time session monitoring with countdown and health indicators
 * 
 * Features:
 * - Current session status display
 * - Expiration countdown (< 5 minutes)
 * - Last activity time
 * - Security level indicators
 * - Hover details with full session info
 */
export default function SessionStatusIndicator() {
  const { isAuthenticated } = useAuth();
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('disconnected');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showDetails, setShowDetails] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setSessionStatus('disconnected');
      return;
    }

    const updateStatus = () => {
      const sessionData = localStorage.getItem('empowergrid_session');
      if (!sessionData) {
        setSessionStatus('disconnected');
        return;
      }

      try {
        const session = JSON.parse(sessionData);
        const expiresAt = new Date(session.expiresAt);
        const now = new Date();
        const remaining = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);

        setTimeRemaining(remaining);
        setSessionInfo(session);

        if (remaining <= 0) {
          setSessionStatus('expired');
        } else if (remaining < 300) { // < 5 minutes
          setSessionStatus('expiring-soon');
        } else {
          setSessionStatus('active');
        }
      } catch (error) {
        setSessionStatus('disconnected');
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSecurityLevel = (): SecurityLevel => {
    if (timeRemaining <= 0) return 'compromised';
    if (timeRemaining < 120) return 'warning'; // < 2 minutes
    return 'secure';
  };

  const getStatusConfig = () => {
    const securityLevel = getSecurityLevel();
    
    const configs = {
      'active': {
        icon: '🟢',
        label: 'Active Session',
        color: '#198754',
        securityLabel: 'Secure',
      },
      'expiring-soon': {
        icon: '🟡',
        label: 'Expiring Soon',
        color: '#ffc107',
        securityLabel: 'Warning',
      },
      'expired': {
        icon: '🔴',
        label: 'Session Expired',
        color: '#dc3545',
        securityLabel: 'Expired',
      },
      'disconnected': {
        icon: '⚫',
        label: 'Not Connected',
        color: '#6c757d',
        securityLabel: 'Disconnected',
      },
    };

    return configs[sessionStatus];
  };

  if (!isAuthenticated && sessionStatus === 'disconnected') return null;

  const config = getStatusConfig();
  const securityLevel = getSecurityLevel();

  return (
    <div
      className="session-status-indicator"
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
      role="status"
      aria-label={`Session status: ${config.label}`}
    >
      <div className="status-badge">
        <span className="status-icon">{config.icon}</span>
        <span className="status-label">{config.label}</span>
        {sessionStatus === 'expiring-soon' && (
          <span className="countdown">{formatTime(timeRemaining)}</span>
        )}
      </div>

      {showDetails && sessionInfo && (
        <div className="status-details">
          <div className="details-header">
            <strong>Session Details</strong>
          </div>

          <div className="detail-item">
            <span className="detail-label">Status:</span>
            <span className="detail-value">{config.label}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Security Level:</span>
            <span className={`detail-value security-${securityLevel}`}>
              {config.securityLabel}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Expires At:</span>
            <span className="detail-value">
              {new Date(sessionInfo.expiresAt).toLocaleString()}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Time Remaining:</span>
            <span className="detail-value">
              {timeRemaining > 0 ? formatTime(timeRemaining) : 'Expired'}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Created:</span>
            <span className="detail-value">
              {new Date(sessionInfo.createdAt).toLocaleString()}
            </span>
          </div>

          {timeRemaining < 300 && timeRemaining > 0 && (
            <div className="renewal-hint">
              💡 Your session will be automatically renewed on next activity
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .session-status-indicator {
          position: relative;
          display: inline-block;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.875rem;
          background: white;
          border: 2px solid ${config.color};
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: help;
          transition: all 0.2s;
        }

        .status-badge:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .status-icon {
          font-size: 1rem;
          animation: ${sessionStatus === 'expiring-soon' ? 'pulse 2s infinite' : 'none'};
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .status-label {
          color: ${config.color};
        }

        .countdown {
          font-family: 'Monaco', monospace;
          background: ${config.color};
          color: white;
          padding: 0.125rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
        }

        .status-details {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          min-width: 300px;
          z-index: 1000;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .details-header {
          padding: 0.875rem;
          border-bottom: 1px solid #e9ecef;
          font-size: 0.9rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0.875rem;
          font-size: 0.85rem;
          border-bottom: 1px solid #f8f9fa;
        }

        .detail-item:last-of-type {
          border-bottom: none;
        }

        .detail-label {
          color: #6c757d;
          font-weight: 600;
        }

        .detail-value {
          color: #212529;
        }

        .detail-value.security-secure {
          color: #198754;
          font-weight: 700;
        }

        .detail-value.security-warning {
          color: #ffc107;
          font-weight: 700;
        }

        .detail-value.security-compromised {
          color: #dc3545;
          font-weight: 700;
        }

        .renewal-hint {
          padding: 0.75rem 0.875rem;
          background: #e7f3ff;
          border-top: 1px solid #b6d4fe;
          font-size: 0.8rem;
          color: #084298;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}




