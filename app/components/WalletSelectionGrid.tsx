import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WALLET_METADATA } from '../lib/config/walletProviders';
import { detectAllWallets } from '../lib/utils/walletDetection';

interface WalletProviderInfo {
  name: string;
  icon: string;
  description: string;
  isInstalled: boolean;
  installUrl: string;
}

interface WalletSelectionGridProps {
  onSelect?: (walletName: string) => void;
}

/**
 * WalletSelectionGrid Component
 * 
 * Grid display of available Solana wallet providers with auto-detection
 * 
 * Features:
 * - Auto-detection of installed wallets
 * - Visual distinction between installed/not installed
 * - Installation links for unavailable wallets
 * - Responsive grid layout
 * - Keyboard navigation support
 */
export default function WalletSelectionGrid({ onSelect }: WalletSelectionGridProps) {
  const { select, connect, wallets } = useWallet();
  const [detectedWallets, setDetectedWallets] = useState<Record<string, boolean>>({});
  const [connecting, setConnecting] = useState<string | null>(null);

  // Detect installed wallets
  useEffect(() => {
    const detected = detectAllWallets();
    setDetectedWallets(detected);
  }, []);

  const handleWalletSelect = async (walletName: string) => {
    setConnecting(walletName);
    
    try {
      const wallet = wallets.find(w => 
        w.adapter.name.toLowerCase() === walletName.toLowerCase()
      );
      
      if (wallet) {
        select(wallet.adapter.name);
        await connect();
        onSelect?.(walletName);
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
    } finally {
      setConnecting(null);
    }
  };

  const walletProviders: WalletProviderInfo[] = Object.entries(WALLET_METADATA).map(
    ([key, metadata]) => ({
      name: metadata.name,
      icon: metadata.icon,
      description: metadata.description,
      isInstalled: detectedWallets[key] || false,
      installUrl: metadata.url,
    })
  );

  return (
    <div className="wallet-selection-grid">
      <div className="grid-header">
        <h2>Select Your Wallet</h2>
        <p>Choose from available Solana wallet providers</p>
      </div>

      <div className="wallet-grid">
        {walletProviders.map((wallet) => (
          <WalletCard
            key={wallet.name}
            wallet={wallet}
            isConnecting={connecting === wallet.name}
            onSelect={() => handleWalletSelect(wallet.name)}
          />
        ))}
      </div>

      <style jsx>{`
        .wallet-selection-grid {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
        }

        .grid-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .grid-header h2 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }

        .grid-header p {
          color: #6c757d;
          font-size: 0.95rem;
        }

        .wallet-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1rem;
        }

        @media (max-width: 640px) {
          .wallet-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * WalletCard Component
 * 
 * Individual wallet provider card
 */
function WalletCard({
  wallet,
  isConnecting,
  onSelect,
}: {
  wallet: WalletProviderInfo;
  isConnecting: boolean;
  onSelect: () => void;
}) {
  const handleClick = () => {
    if (wallet.isInstalled) {
      onSelect();
    } else {
      window.open(wallet.installUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button
      className={`wallet-card ${wallet.isInstalled ? 'installed' : 'not-installed'} ${isConnecting ? 'connecting' : ''}`}
      onClick={handleClick}
      disabled={isConnecting}
      aria-label={`${wallet.isInstalled ? 'Connect' : 'Install'} ${wallet.name}`}
      tabIndex={0}
    >
      <div className="wallet-icon">{wallet.icon}</div>
      
      <div className="wallet-info">
        <div className="wallet-name">
          {wallet.name}
          {wallet.isInstalled && <span className="installed-badge">✓ Detected</span>}
        </div>
        <div className="wallet-description">{wallet.description}</div>
      </div>

      <div className="wallet-action">
        {isConnecting ? (
          <div className="spinner-small"></div>
        ) : wallet.isInstalled ? (
          <span className="action-text">Connect →</span>
        ) : (
          <span className="action-text install">Install ↗</span>
        )}
      </div>

      <style jsx>{`
        .wallet-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 1.5rem;
          background: white;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .wallet-card:hover:not(:disabled) {
          border-color: #0d6efd;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-4px);
        }

        .wallet-card.installed {
          border-color: #198754;
        }

        .wallet-card.connecting {
          border-color: #0d6efd;
          background: #e7f3ff;
        }

        .wallet-card.not-installed {
          opacity: 0.7;
        }

        .wallet-card:disabled {
          cursor: not-allowed;
        }

        .wallet-card:focus {
          outline: 2px solid #0d6efd;
          outline-offset: 2px;
        }

        .wallet-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .wallet-info {
          flex: 1;
          margin-bottom: 1rem;
        }

        .wallet-name {
          font-weight: 700;
          font-size: 1.1rem;
          color: #212529;
          margin-bottom: 0.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .installed-badge {
          background: #198754;
          color: white;
          font-size: 0.7rem;
          padding: 0.2rem 0.6rem;
          border-radius: 12px;
          font-weight: 600;
        }

        .wallet-description {
          font-size: 0.85rem;
          color: #6c757d;
          line-height: 1.4;
        }

        .wallet-action {
          margin-top: auto;
        }

        .action-text {
          font-weight: 600;
          font-size: 0.9rem;
          color: #0d6efd;
        }

        .action-text.install {
          color: #6c757d;
        }

        .spinner-small {
          width: 24px;
          height: 24px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #0d6efd;
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






