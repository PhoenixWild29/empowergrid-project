import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * SessionTimeoutWarning Component
 * 
 * Displays countdown timer and renewal option when session is about to expire
 */
export default function SessionTimeoutWarning() {
  const { isAuthenticated } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarning(false);
      return;
    }

    // Get session from localStorage
    const sessionData = localStorage.getItem('empowergrid_session');
    if (!sessionData) return;

    try {
      const session = JSON.parse(sessionData);
      const expiresAt = new Date(session.expiresAt);

      const interval = setInterval(() => {
        const now = new Date().getTime();
        const expiry = expiresAt.getTime();
        const remaining = Math.floor((expiry - now) / 1000);

        setTimeRemaining(remaining);

        // Show warning when less than 5 minutes remaining
        if (remaining > 0 && remaining < 300) {
          setShowWarning(true);
        } else if (remaining <= 0) {
          setShowWarning(false);
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    } catch (error) {
      console.error('Failed to parse session:', error);
    }
  }, [isAuthenticated]);

  const handleRenew = async () => {
    try {
      const sessionData = localStorage.getItem('empowergrid_session');
      if (!sessionData) return;

      const session = JSON.parse(sessionData);

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: session.refreshToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update session in localStorage
        const updatedSession = {
          ...session,
          token: data.accessToken,
          refreshToken: data.refreshToken || session.refreshToken,
          expiresAt: data.expiresAt,
        };
        
        localStorage.setItem('empowergrid_session', JSON.stringify(updatedSession));
        
        setShowWarning(false);
      }
    } catch (error) {
      console.error('Failed to renew session:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!showWarning) return null;

  return (
    <div className="session-timeout-warning">
      <div className="warning-content">
        <div className="warning-icon">⏰</div>
        <div className="warning-text">
          <strong>Session Expiring Soon</strong>
          <p>Your session will expire in {formatTime(timeRemaining)}</p>
        </div>
        <button className="btn-renew" onClick={handleRenew}>
          Renew Session
        </button>
      </div>

      <style jsx>{`
        .session-timeout-warning {
          position: fixed;
          top: 1rem;
          right: 1rem;
          z-index: 9999;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .warning-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: #fff3cd;
          border: 2px solid #ffc107;
          border-radius: 8px;
          padding: 1rem 1.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          max-width: 400px;
        }

        .warning-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .warning-text {
          flex: 1;
        }

        .warning-text strong {
          display: block;
          color: #856404;
          font-size: 0.95rem;
          margin-bottom: 0.25rem;
        }

        .warning-text p {
          margin: 0;
          color: #856404;
          font-size: 0.85rem;
        }

        .btn-renew {
          padding: 0.5rem 1rem;
          background: #ffc107;
          color: #000;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .btn-renew:hover {
          background: #ffca2c;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
        }

        @media (max-width: 640px) {
          .session-timeout-warning {
            top: 0;
            right: 0;
            left: 0;
            border-radius: 0;
          }

          .warning-content {
            border-radius: 0;
            flex-wrap: wrap;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}




