import React, { useEffect, useState } from 'react';

interface ChallengeDisplayProps {
  message: string;
  expiresAt?: string;
  onCancel: () => void;
}

/**
 * ChallengeDisplay Component
 * 
 * Displays the authentication challenge message that will be signed
 * Shows expiry countdown and security information
 */
export default function ChallengeDisplay({
  message,
  expiresAt,
  onCancel,
}: ChallengeDisplayProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      
      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="challenge-display">
      <div className="challenge-header">
        <h2>🔐 Authentication Challenge</h2>
        <p className="challenge-subtitle">
          Please review the message below that will be signed by your wallet
        </p>
      </div>

      <div className="challenge-message-container">
        <div className="challenge-message-label">
          <strong>Message to Sign:</strong>
          {expiresAt && (
            <span className="challenge-expiry">
              Expires in: <strong>{formatTime(timeRemaining)}</strong>
            </span>
          )}
        </div>

        <div className="challenge-message-box">
          <pre className="challenge-message">{message}</pre>
        </div>

        <div className="challenge-info">
          <div className="info-item">
            <span className="info-icon">ℹ️</span>
            <span className="info-text">
              This request will not trigger any blockchain transaction
            </span>
          </div>
          <div className="info-item">
            <span className="info-icon">🔒</span>
            <span className="info-text">
              Your signature proves wallet ownership without revealing private keys
            </span>
          </div>
          <div className="info-item">
            <span className="info-icon">⚡</span>
            <span className="info-text">
              No gas fees will be charged for this authentication
            </span>
          </div>
        </div>
      </div>

      <div className="challenge-actions">
        <button
          className="btn btn-secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
        <div className="challenge-note">
          Your wallet will prompt you to sign this message
        </div>
      </div>

      <style jsx>{`
        .challenge-display {
          max-width: 600px;
          margin: 0 auto;
          padding: 2rem;
        }

        .challenge-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .challenge-header h2 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }

        .challenge-subtitle {
          color: #666;
          font-size: 0.95rem;
        }

        .challenge-message-container {
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .challenge-message-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .challenge-expiry {
          color: #dc3545;
          font-size: 0.85rem;
        }

        .challenge-message-box {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .challenge-message {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.85rem;
          line-height: 1.6;
          color: #2d3748;
          white-space: pre-wrap;
          word-wrap: break-word;
          margin: 0;
        }

        .challenge-info {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .info-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #495057;
        }

        .info-icon {
          font-size: 1rem;
          flex-shrink: 0;
        }

        .info-text {
          line-height: 1.5;
        }

        .challenge-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .challenge-note {
          font-size: 0.85rem;
          color: #6c757d;
          text-align: center;
        }

        .btn {
          padding: 0.75rem 2rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #5a6268;
        }
      `}</style>
    </div>
  );
}




