import React, { useState, useEffect, useRef } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useAuth } from '../../contexts/AuthContext';

interface WalletButtonProps {
  onOpenModal?: () => void;
}

/**
 * WalletButton Component
 * 
 * Dynamic wallet button showing connection status, address, and balance
 * 
 * Features:
 * - Connect button when disconnected
 * - Truncated address display when connected
 * - Balance display with loading states
 * - Dropdown menu for wallet options
 * - Responsive design
 * - Visual state indicators
 */
export default function WalletButton({ onOpenModal }: WalletButtonProps) {
  const { publicKey, connecting, connected, disconnect } = useWallet();
  const { connection } = useConnection();
  const { isAuthenticated, logout } = useAuth();
  
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load wallet balance
  useEffect(() => {
    if (publicKey && connected) {
      loadBalance();
    } else {
      setBalance(null);
    }
  }, [publicKey, connected]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadBalance = async () => {
    if (!publicKey) return;

    setLoadingBalance(true);
    try {
      const balanceLamports = await connection.getBalance(publicKey);
      setBalance(balanceLamports / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Failed to load balance:', error);
      setBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleConnect = () => {
    if (onOpenModal) {
      onOpenModal();
    }
  };

  const handleDisconnect = async () => {
    setShowDropdown(false);
    if (isAuthenticated) {
      await logout();
    }
    await disconnect();
  };

  const truncateAddress = (address: string): string => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Disconnected state
  if (!connected || !publicKey) {
    return (
      <button
        className="wallet-btn wallet-btn-connect"
        onClick={handleConnect}
        disabled={connecting}
        aria-label="Connect wallet"
      >
        {connecting ? (
          <>
            <span className="spinner-small"></span>
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <span className="wallet-icon">👛</span>
            <span>Connect Wallet</span>
          </>
        )}

        <style jsx>{`
          .wallet-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.625rem 1.25rem;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.9rem;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
          }

          .wallet-btn-connect {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }

          .wallet-btn-connect:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          }

          .wallet-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .wallet-icon {
            font-size: 1.2rem;
          }

          .spinner-small {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </button>
    );
  }

  // Connected state
  return (
    <div className="wallet-btn-container" ref={dropdownRef}>
      <button
        className="wallet-btn wallet-btn-connected"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Wallet options"
        aria-expanded={showDropdown}
        aria-haspopup="true"
      >
        <div className="connection-indicator"></div>
        
        <div className="wallet-info">
          <div className="wallet-address">
            {truncateAddress(publicKey.toString())}
          </div>
          {loadingBalance ? (
            <div className="wallet-balance loading">Loading...</div>
          ) : balance !== null ? (
            <div className="wallet-balance">
              {balance.toFixed(4)} SOL
            </div>
          ) : null}
        </div>

        <span className="dropdown-arrow">{showDropdown ? '▲' : '▼'}</span>
      </button>

      {showDropdown && (
        <div className="wallet-dropdown" role="menu">
          <div className="dropdown-section">
            <div className="dropdown-item wallet-details">
              <div className="detail-label">Wallet Address</div>
              <div className="detail-value">
                <code>{publicKey.toString().slice(0, 16)}...</code>
                <button
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(publicKey.toString());
                    // Could add toast notification
                  }}
                  title="Copy address"
                >
                  📋
                </button>
              </div>
            </div>

            {balance !== null && (
              <div className="dropdown-item wallet-details">
                <div className="detail-label">Balance</div>
                <div className="detail-value">
                  <strong>{balance.toFixed(4)} SOL</strong>
                  <button
                    className="refresh-btn"
                    onClick={loadBalance}
                    title="Refresh balance"
                  >
                    🔄
                  </button>
                </div>
              </div>
            )}

            {isAuthenticated && (
              <div className="dropdown-item wallet-details">
                <div className="detail-label">Status</div>
                <div className="detail-value authenticated">
                  <span className="status-dot"></span>
                  Authenticated
                </div>
              </div>
            )}
          </div>

          <div className="dropdown-divider"></div>

          <div className="dropdown-section">
            <button
              className="dropdown-button"
              onClick={() => {
                setShowDropdown(false);
                // Could open account settings
                window.location.href = '/profile';
              }}
              role="menuitem"
            >
              <span className="dropdown-icon">⚙️</span>
              <span>Account Settings</span>
            </button>

            <button
              className="dropdown-button"
              onClick={handleDisconnect}
              role="menuitem"
            >
              <span className="dropdown-icon">🚪</span>
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .wallet-btn-container {
          position: relative;
        }

        .wallet-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .wallet-btn-connected {
          background: white;
          border: 2px solid #e9ecef;
          color: #212529;
        }

        .wallet-btn-connected:hover {
          border-color: #0d6efd;
          box-shadow: 0 2px 8px rgba(13, 110, 253, 0.15);
        }

        .connection-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #198754;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .wallet-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.125rem;
        }

        .wallet-address {
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.85rem;
          font-weight: 700;
          color: #212529;
        }

        .wallet-balance {
          font-size: 0.75rem;
          color: #6c757d;
          font-weight: 500;
        }

        .wallet-balance.loading {
          font-style: italic;
        }

        .dropdown-arrow {
          font-size: 0.7rem;
          color: #6c757d;
          margin-left: 0.25rem;
        }

        .wallet-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          min-width: 280px;
          z-index: 1000;
          animation: dropdownSlide 0.2s ease-out;
        }

        @keyframes dropdownSlide {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-section {
          padding: 0.75rem;
        }

        .dropdown-item {
          padding: 0.75rem;
        }

        .wallet-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .detail-label {
          font-size: 0.75rem;
          color: #6c757d;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-value {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #212529;
        }

        .detail-value code {
          background: #f8f9fa;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
        }

        .detail-value.authenticated {
          color: #198754;
          font-weight: 600;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #198754;
        }

        .copy-btn,
        .refresh-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          padding: 0.25rem;
          opacity: 0.6;
          transition: opacity 0.2s;
        }

        .copy-btn:hover,
        .refresh-btn:hover {
          opacity: 1;
        }

        .dropdown-divider {
          height: 1px;
          background: #e9ecef;
          margin: 0;
        }

        .dropdown-button {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: none;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          color: #212529;
          font-weight: 500;
          transition: background 0.2s;
          text-align: left;
        }

        .dropdown-button:hover {
          background: #f8f9fa;
        }

        .dropdown-icon {
          font-size: 1.2rem;
        }

        @media (max-width: 640px) {
          .wallet-info {
            max-width: 120px;
          }

          .wallet-address {
            font-size: 0.8rem;
          }

          .wallet-balance {
            font-size: 0.7rem;
          }

          .wallet-dropdown {
            right: -1rem;
            min-width: 240px;
          }
        }
      `}</style>
    </div>
  );
}




