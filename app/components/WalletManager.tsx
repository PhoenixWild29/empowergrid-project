import React, { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { WALLET_METADATA } from '../lib/config/walletProviders';

interface ConnectedWalletInfo {
  name: string;
  address: string;
  balance: number | null;
  isActive: boolean;
}

/**
 * WalletManager Component
 * 
 * Manage multiple connected wallets
 * 
 * Features:
 * - View all connected wallets
 * - Disconnect specific wallets
 * - See balance for each wallet
 * - Portfolio aggregation
 */
export default function WalletManager() {
  const { wallet, wallets, publicKey, disconnect } = useWallet();
  const { connection } = useConnection();
  const [connectedWallets, setConnectedWallets] = useState<ConnectedWalletInfo[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);

  useEffect(() => {
    loadConnectedWallets();
  }, [wallet, publicKey]);

  const loadConnectedWallets = async () => {
    if (!publicKey) {
      setConnectedWallets([]);
      return;
    }

    try {
      // Load balance for current wallet
      const balanceLamports = await connection.getBalance(publicKey);
      const balance = balanceLamports / LAMPORTS_PER_SOL;

      const walletInfo: ConnectedWalletInfo = {
        name: wallet?.adapter.name || 'Unknown',
        address: publicKey.toString(),
        balance,
        isActive: true,
      };

      setConnectedWallets([walletInfo]);
      setTotalBalance(balance);
    } catch (error) {
      console.error('Failed to load wallet info:', error);
    }
  };

  const handleDisconnect = async (walletName: string) => {
    try {
      await disconnect();
      
      // Clear from connected list
      setConnectedWallets(prev => prev.filter(w => w.name !== walletName));
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  if (connectedWallets.length === 0) {
    return (
      <div className="wallet-manager empty">
        <p>No wallets connected</p>
        <style jsx>{`
          .wallet-manager.empty {
            padding: 2rem;
            text-align: center;
            color: #6c757d;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="wallet-manager">
      <div className="manager-header">
        <h2>Connected Wallets</h2>
        <div className="total-portfolio">
          <span className="portfolio-label">Total Portfolio:</span>
          <span className="portfolio-value">{totalBalance.toFixed(4)} SOL</span>
        </div>
      </div>

      <div className="wallet-list">
        {connectedWallets.map((walletInfo) => {
          const metadata = Object.values(WALLET_METADATA).find(
            m => m.name === walletInfo.name
          );

          return (
            <div key={walletInfo.address} className={`wallet-card ${walletInfo.isActive ? 'active' : ''}`}>
              <div className="wallet-header">
                <div className="wallet-branding">
                  <span className="wallet-icon">{metadata?.icon || '👛'}</span>
                  <span className="wallet-name">{walletInfo.name}</span>
                  {walletInfo.isActive && <span className="active-badge">Active</span>}
                </div>
              </div>

              <div className="wallet-details">
                <div className="detail-row">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">
                    <code>{walletInfo.address.slice(0, 8)}...{walletInfo.address.slice(-8)}</code>
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Balance:</span>
                  <span className="detail-value">
                    {walletInfo.balance !== null ? (
                      <strong>{walletInfo.balance.toFixed(4)} SOL</strong>
                    ) : (
                      <span className="loading">Loading...</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="wallet-actions">
                <button
                  className="btn-disconnect"
                  onClick={() => handleDisconnect(walletInfo.name)}
                >
                  Disconnect
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .wallet-manager {
          padding: 1.5rem;
        }

        .manager-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e9ecef;
        }

        .manager-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .total-portfolio {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .portfolio-label {
          font-size: 0.75rem;
          color: #6c757d;
          text-transform: uppercase;
        }

        .portfolio-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #198754;
        }

        .wallet-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .wallet-card {
          background: white;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          padding: 1.25rem;
          transition: all 0.2s;
        }

        .wallet-card.active {
          border-color: #0d6efd;
          background: #f0f7ff;
        }

        .wallet-header {
          margin-bottom: 1rem;
        }

        .wallet-branding {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .wallet-icon {
          font-size: 2rem;
        }

        .wallet-name {
          font-size: 1.1rem;
          font-weight: 700;
        }

        .active-badge {
          background: #0d6efd;
          color: white;
          padding: 0.25rem 0.625rem;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .wallet-details {
          margin-bottom: 1rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f8f9fa;
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-label {
          font-size: 0.85rem;
          color: #6c757d;
          font-weight: 600;
        }

        .detail-value {
          font-size: 0.9rem;
        }

        .detail-value code {
          background: #f8f9fa;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
        }

        .loading {
          font-style: italic;
          color: #6c757d;
        }

        .wallet-actions {
          display: flex;
          gap: 0.75rem;
        }

        .btn-disconnect {
          flex: 1;
          padding: 0.625rem;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-disconnect:hover {
          background: #bb2d3b;
        }
      `}</style>
    </div>
  );
}






