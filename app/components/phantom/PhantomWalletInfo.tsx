import React, { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

/**
 * PhantomWalletInfo Component
 * 
 * Displays connected Phantom wallet information
 */
export default function PhantomWalletInfo() {
  const { publicKey, disconnect } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (publicKey) {
      loadBalance();
    }
  }, [publicKey]);

  const loadBalance = async () => {
    if (!publicKey) return;
    try {
      const balanceLamports = await connection.getBalance(publicKey);
      setBalance(balanceLamports / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  if (!publicKey) return null;

  return (
    <div className="phantom-wallet-info">
      <div className="info-header">
        <div className="phantom-badge">
          <span className="phantom-icon">👻</span>
          <span className="phantom-label">Phantom</span>
        </div>
        <div className="connection-status">
          <span className="status-dot"></span>
          <span>Connected</span>
        </div>
      </div>

      <div className="wallet-details">
        <div className="detail-row">
          <span className="detail-label">Address</span>
          <span className="detail-value">
            <code>{publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}</code>
          </span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Balance</span>
          <span className="detail-value">
            {balance !== null ? (
              <strong>{balance.toFixed(4)} SOL</strong>
            ) : (
              <span className="loading">Loading...</span>
            )}
          </span>
        </div>
      </div>

      <button className="disconnect-btn" onClick={disconnect}>
        Disconnect Phantom
      </button>

      <style jsx>{`
        .phantom-wallet-info {
          background: linear-gradient(135deg, #AB33C0 0%, #5B21B6 100%);
          color: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(171, 51, 192, 0.3);
        }

        .info-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }

        .phantom-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.15);
          padding: 0.5rem 0.875rem;
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }

        .phantom-icon {
          font-size: 1.25rem;
        }

        .phantom-label {
          font-weight: 700;
          font-size: 0.9rem;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: #4ade80;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .wallet-details {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-label {
          font-size: 0.85rem;
          opacity: 0.9;
        }

        .detail-value {
          font-size: 0.9rem;
        }

        .detail-value code {
          background: rgba(0, 0, 0, 0.2);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
        }

        .loading {
          font-style: italic;
          opacity: 0.8;
        }

        .disconnect-btn {
          width: 100%;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(10px);
        }

        .disconnect-btn:hover {
          background: rgba(255, 255, 255, 0.25);
        }
      `}</style>
    </div>
  );
}




