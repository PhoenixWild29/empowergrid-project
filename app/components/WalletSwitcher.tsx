import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WALLET_METADATA } from '../lib/config/walletProviders';

/**
 * WalletSwitcher Component
 * 
 * Allows switching between connected wallet providers
 * 
 * Features:
 * - List of connected wallets
 * - Active wallet indication
 * - Provider-specific branding
 * - Quick wallet switching
 */
export default function WalletSwitcher() {
  const { wallet, wallets, select, connected } = useWallet();
  const [showSwitcher, setShowSwitcher] = useState(false);

  if (!connected || wallets.length <= 1) return null;

  const connectedWallets = wallets.filter(w => w.readyState === 'Installed');

  const handleSwitch = (walletName: string) => {
    select(walletName as any); // WalletName is a branded type
    setShowSwitcher(false);
    
    // Save preference
    localStorage.setItem('empowergrid_preferred_wallet', walletName);
  };

  return (
    <div className="wallet-switcher">
      <button
        className="switcher-toggle"
        onClick={() => setShowSwitcher(!showSwitcher)}
        aria-label="Switch wallet"
        aria-expanded={showSwitcher}
      >
        <span className="current-wallet">
          {wallet?.adapter.name || 'Select Wallet'}
        </span>
        <span className="toggle-icon">{showSwitcher ? '▲' : '▼'}</span>
      </button>

      {showSwitcher && (
        <div className="switcher-dropdown">
          <div className="dropdown-header">
            <strong>Switch Wallet</strong>
          </div>

          {connectedWallets.map((w) => {
            const metadata = Object.values(WALLET_METADATA).find(
              m => m.name === w.adapter.name
            );
            const isActive = w.adapter.name === wallet?.adapter.name;

            return (
              <button
                key={w.adapter.name}
                className={`wallet-option ${isActive ? 'active' : ''}`}
                onClick={() => handleSwitch(w.adapter.name)}
                disabled={isActive}
              >
                <span className="wallet-icon">{metadata?.icon || '👛'}</span>
                <span className="wallet-name">{w.adapter.name}</span>
                {isActive && <span className="active-badge">✓ Active</span>}
              </button>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .wallet-switcher {
          position: relative;
        }

        .switcher-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          color: #212529;
          transition: all 0.2s;
        }

        .switcher-toggle:hover {
          border-color: #0d6efd;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .current-wallet {
          min-width: 80px;
          text-align: left;
        }

        .toggle-icon {
          font-size: 0.7rem;
          color: #6c757d;
        }

        .switcher-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          min-width: 200px;
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

        .dropdown-header {
          padding: 0.875rem;
          border-bottom: 1px solid #e9ecef;
          font-size: 0.85rem;
        }

        .wallet-option {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background 0.2s;
          font-size: 0.9rem;
        }

        .wallet-option:hover:not(:disabled) {
          background: #f8f9fa;
        }

        .wallet-option.active {
          background: #e7f3ff;
        }

        .wallet-option:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .wallet-icon {
          font-size: 1.5rem;
        }

        .wallet-name {
          flex: 1;
          font-weight: 600;
        }

        .active-badge {
          background: #198754;
          color: white;
          padding: 0.125rem 0.5rem;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}

