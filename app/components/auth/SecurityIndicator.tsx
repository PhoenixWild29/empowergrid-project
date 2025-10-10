import React from 'react';
import { AuthStep } from './AuthFlowContainer';

interface SecurityIndicatorProps {
  connected: boolean;
  step: AuthStep;
  error: boolean;
}

/**
 * SecurityIndicator Component
 * 
 * Shows connection integrity and authentication status
 */
export default function SecurityIndicator({
  connected,
  step,
  error,
}: SecurityIndicatorProps) {
  const getSecurityStatus = () => {
    if (error) {
      return {
        level: 'error',
        icon: '🔴',
        label: 'Error',
        description: 'Authentication error occurred',
      };
    }

    if (!connected) {
      return {
        level: 'disconnected',
        icon: '⚫',
        label: 'Disconnected',
        description: 'Wallet not connected',
      };
    }

    if (step === AuthStep.COMPLETE) {
      return {
        level: 'authenticated',
        icon: '🟢',
        label: 'Authenticated',
        description: 'Secure session established',
      };
    }

    if (step === AuthStep.SIGNING || step === AuthStep.VERIFYING) {
      return {
        level: 'verifying',
        icon: '🟡',
        label: 'Verifying',
        description: 'Authentication in progress',
      };
    }

    return {
      level: 'connected',
      icon: '🟢',
      label: 'Connected',
      description: 'Wallet connected securely',
    };
  };

  const status = getSecurityStatus();

  return (
    <div className={`security-indicator ${status.level}`}>
      <div className="security-status">
        <span className="status-icon">{status.icon}</span>
        <div className="status-text">
          <div className="status-label">{status.label}</div>
          <div className="status-description">{status.description}</div>
        </div>
      </div>

      <div className="security-features">
        <div className="feature-item">
          <span className="feature-icon">🔐</span>
          <span className="feature-text">End-to-end encryption</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">🛡️</span>
          <span className="feature-text">Secure signature verification</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">✅</span>
          <span className="feature-text">No private key exposure</span>
        </div>
      </div>

      <style jsx>{`
        .security-indicator {
          background: white;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          border: 1px solid #e9ecef;
        }

        .security-status {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e9ecef;
          margin-bottom: 1rem;
        }

        .status-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .status-text {
          flex: 1;
        }

        .status-label {
          font-weight: 700;
          font-size: 0.95rem;
          color: #212529;
        }

        .status-description {
          font-size: 0.8rem;
          color: #6c757d;
        }

        .security-indicator.authenticated .status-label {
          color: #198754;
        }

        .security-indicator.error .status-label {
          color: #dc3545;
        }

        .security-indicator.verifying .status-label {
          color: #ffc107;
        }

        .security-features {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: #495057;
        }

        .feature-icon {
          font-size: 0.9rem;
        }

        .feature-text {
          line-height: 1.4;
        }

        @media (max-width: 640px) {
          .security-features {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}




