import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import WalletProviderItem from './WalletProviderItem';

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect?: (walletName: string) => void;
}

/**
 * Supported wallet providers
 */
const WALLET_PROVIDERS = [
  {
    name: 'Phantom',
    icon: '👻',
    description: 'Popular Solana wallet with best-in-class UX',
    detectFn: () => typeof window !== 'undefined' && window.solana?.isPhantom,
    installUrl: 'https://phantom.app/',
  },
  {
    name: 'Solflare',
    icon: '🔥',
    description: 'Secure Solana wallet for web and mobile',
    detectFn: () => typeof window !== 'undefined' && window.solflare?.isSolflare,
    installUrl: 'https://solflare.com/',
  },
  {
    name: 'Ledger',
    icon: '🔐',
    description: 'Hardware wallet for maximum security',
    detectFn: () => false, // Ledger requires manual setup
    installUrl: 'https://www.ledger.com/',
  },
  {
    name: 'Glow',
    icon: '✨',
    description: 'Mobile-first Solana wallet',
    detectFn: () => typeof window !== 'undefined' && window.glow,
    installUrl: 'https://glow.app/',
  },
  {
    name: 'Backpack',
    icon: '🎒',
    description: 'Multi-chain wallet with Solana support',
    detectFn: () => typeof window !== 'undefined' && window.backpack,
    installUrl: 'https://backpack.app/',
  },
];

/**
 * WalletConnectionModal Component
 * 
 * Modal for selecting and connecting to Solana wallets
 * 
 * Features:
 * - Multi-provider support (Phantom, Solflare, Ledger, Glow, Backpack)
 * - Auto-detection of installed wallets
 * - Installation prompts for unavailable wallets
 * - Loading states during connection
 * - Error handling with retry options
 * - Responsive design
 * - Accessibility support
 */
export default function WalletConnectionModal({
  isOpen,
  onClose,
  onConnect,
}: WalletConnectionModalProps) {
  const { select, wallets, connect, connecting, connected } = useWallet();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectedWallets, setDetectedWallets] = useState<Set<string>>(new Set());

  // Detect installed wallets
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const detected = new Set<string>();
    
    WALLET_PROVIDERS.forEach(provider => {
      if (provider.detectFn()) {
        detected.add(provider.name);
      }
    });

    setDetectedWallets(detected);
  }, [isOpen]);

  // Handle successful connection
  useEffect(() => {
    if (connected && selectedWallet) {
      onConnect?.(selectedWallet);
      setTimeout(() => {
        onClose();
        setSelectedWallet(null);
        setError(null);
      }, 500);
    }
  }, [connected, selectedWallet]);

  const handleWalletSelect = async (providerName: string) => {
    setSelectedWallet(providerName);
    setError(null);

    try {
      const wallet = wallets.find(w => w.adapter.name === providerName);
      
      if (wallet) {
        select(wallet.adapter.name);
        await connect();
      } else {
        throw new Error(`${providerName} wallet not found`);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect wallet'
      );
      setSelectedWallet(null);
    }
  };

  const handleClose = () => {
    if (!connecting) {
      setSelectedWallet(null);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={handleClose} />
      <div className="wallet-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <h2 id="modal-title">Connect Wallet</h2>
          <button
            className="close-btn"
            onClick={handleClose}
            disabled={connecting}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-content">
          <p className="modal-description">
            Select your Solana wallet to connect to EmpowerGRID
          </p>

          {error && (
            <div className="error-message" role="alert">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="wallet-providers">
            {WALLET_PROVIDERS.map(provider => (
              <WalletProviderItem
                key={provider.name}
                name={provider.name}
                icon={provider.icon}
                description={provider.description}
                isInstalled={detectedWallets.has(provider.name)}
                isConnecting={connecting && selectedWallet === provider.name}
                installUrl={provider.installUrl}
                onSelect={() => handleWalletSelect(provider.name)}
                disabled={connecting}
              />
            ))}
          </div>

          <div className="modal-footer">
            <p className="footer-text">
              New to Solana?{' '}
              <a
                href="https://docs.solana.com/wallet-guide"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn about wallets
              </a>
            </p>
          </div>
        </div>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            z-index: 9998;
            animation: fadeIn 0.2s;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .wallet-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            width: 90%;
            max-width: 480px;
            max-height: 90vh;
            overflow-y: auto;
            z-index: 9999;
            animation: slideUp 0.3s ease-out;
          }

          @keyframes slideUp {
            from {
              transform: translate(-50%, -40%);
              opacity: 0;
            }
            to {
              transform: translate(-50%, -50%);
              opacity: 1;
            }
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            border-bottom: 1px solid #e9ecef;
          }

          .modal-header h2 {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0;
          }

          .close-btn {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: #6c757d;
            cursor: pointer;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            transition: all 0.2s;
          }

          .close-btn:hover:not(:disabled) {
            background: #f8f9fa;
            color: #212529;
          }

          .close-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .modal-content {
            padding: 1.5rem;
          }

          .modal-description {
            color: #6c757d;
            margin-bottom: 1.5rem;
            font-size: 0.95rem;
            text-align: center;
          }

          .error-message {
            background: #f8d7da;
            border: 1px solid #f5c2c7;
            color: #842029;
            padding: 0.75rem 1rem;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
            font-size: 0.9rem;
          }

          .error-icon {
            font-size: 1.2rem;
          }

          .wallet-providers {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .modal-footer {
            margin-top: 1.5rem;
            padding-top: 1.5rem;
            border-top: 1px solid #e9ecef;
            text-align: center;
          }

          .footer-text {
            font-size: 0.85rem;
            color: #6c757d;
            margin: 0;
          }

          .footer-text a {
            color: #0d6efd;
            text-decoration: none;
          }

          .footer-text a:hover {
            text-decoration: underline;
          }

          @media (max-width: 640px) {
            .wallet-modal {
              width: 100%;
              max-width: none;
              border-radius: 16px 16px 0 0;
              top: auto;
              bottom: 0;
              transform: translate(-50%, 0);
              animation: slideUpMobile 0.3s ease-out;
            }

            @keyframes slideUpMobile {
              from {
                transform: translate(-50%, 100%);
              }
              to {
                transform: translate(-50%, 0);
              }
            }
          }
        `}</style>
      </div>
    </>
  );
}






