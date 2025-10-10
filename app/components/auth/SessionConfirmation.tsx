import React, { useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

interface SessionConfirmationProps {
  walletAddress: string;
  sessionId?: string;
}

/**
 * SessionConfirmation Component
 * 
 * Displays successful authentication confirmation with wallet details
 */
export default function SessionConfirmation({
  walletAddress,
  sessionId,
}: SessionConfirmationProps) {
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);

  useEffect(() => {
    loadWalletBalance();
  }, [walletAddress]);

  const loadWalletBalance = async () => {
    try {
      const pubKey = new PublicKey(walletAddress);
      const balanceLamports = await connection.getBalance(pubKey);
      setBalance(balanceLamports / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Failed to load balance:', error);
      setBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  };

  return (
    <div className="session-confirmation">
      <div className="confirmation-header">
        <div className="success-icon">🎉</div>
        <h2>Authentication Successful!</h2>
        <p className="confirmation-subtitle">
          Your wallet has been authenticated and session established
        </p>
      </div>

      <div className="session-details">
        <div className="detail-card">
          <div className="detail-icon">👛</div>
          <div className="detail-content">
            <div className="detail-label">Wallet Address</div>
            <div className="detail-value">
              <code>{walletAddress.slice(0, 12)}...{walletAddress.slice(-12)}</code>
              <button
                className="copy-btn"
                onClick={() => navigator.clipboard.writeText(walletAddress)}
                title="Copy address"
              >
                📋
              </button>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <div className="detail-icon">💰</div>
          <div className="detail-content">
            <div className="detail-label">Balance</div>
            <div className="detail-value">
              {loadingBalance ? (
                <span className="loading">Loading...</span>
              ) : balance !== null ? (
                <strong>{balance.toFixed(4)} SOL</strong>
              ) : (
                <span className="text-muted">Unable to load</span>
              )}
            </div>
          </div>
        </div>

        {sessionId && (
          <div className="detail-card">
            <div className="detail-icon">🔐</div>
            <div className="detail-content">
              <div className="detail-label">Session ID</div>
              <div className="detail-value">
                <code>{sessionId.slice(0, 16)}...</code>
              </div>
            </div>
          </div>
        )}

        <div className="detail-card">
          <div className="detail-icon">⏰</div>
          <div className="detail-content">
            <div className="detail-label">Session Expires</div>
            <div className="detail-value">
              In 24 hours
            </div>
          </div>
        </div>
      </div>

      <div className="confirmation-actions">
        <button
          className="btn btn-primary"
          onClick={() => window.location.href = '/dashboard'}
        >
          Go to Dashboard
        </button>
      </div>

      <style jsx>{`
        .session-confirmation {
          max-width: 500px;
          margin: 0 auto;
          text-align: center;
        }

        .confirmation-header {
          margin-bottom: 2rem;
        }

        .success-icon {
          font-size: 5rem;
          margin-bottom: 1rem;
          animation: celebration 0.6s ease-out;
        }

        @keyframes celebration {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        .confirmation-header h2 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #198754;
          margin-bottom: 0.5rem;
        }

        .confirmation-subtitle {
          color: #666;
          font-size: 0.95rem;
        }

        .session-details {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .detail-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: #f8f9fa;
          padding: 1.25rem;
          border-radius: 8px;
          border: 1px solid #e9ecef;
          text-align: left;
        }

        .detail-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .detail-content {
          flex: 1;
        }

        .detail-label {
          font-size: 0.8rem;
          color: #6c757d;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.25rem;
        }

        .detail-value {
          font-size: 1rem;
          color: #212529;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .detail-value code {
          background: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.85rem;
          border: 1px solid #dee2e6;
        }

        .copy-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.2rem;
          padding: 0.25rem;
          opacity: 0.6;
          transition: opacity 0.2s;
        }

        .copy-btn:hover {
          opacity: 1;
        }

        .loading {
          color: #6c757d;
          font-style: italic;
        }

        .text-muted {
          color: #6c757d;
        }

        .confirmation-actions {
          margin-top: 2rem;
        }

        .btn {
          padding: 0.875rem 2.5rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #0d6efd;
          color: white;
        }

        .btn-primary:hover {
          background: #0b5ed7;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
        }
      `}</style>
    </div>
  );
}




