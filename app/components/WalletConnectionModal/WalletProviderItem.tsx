import React from 'react';

interface WalletProviderItemProps {
  name: string;
  icon: string;
  description: string;
  isInstalled: boolean;
  isConnecting: boolean;
  installUrl: string;
  onSelect: () => void;
  disabled: boolean;
}

/**
 * WalletProviderItem Component
 * 
 * Individual wallet provider card in the connection modal
 */
export default function WalletProviderItem({
  name,
  icon,
  description,
  isInstalled,
  isConnecting,
  installUrl,
  onSelect,
  disabled,
}: WalletProviderItemProps) {
  const handleClick = () => {
    if (isInstalled) {
      onSelect();
    } else {
      window.open(installUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button
      className={`wallet-provider-item ${isInstalled ? 'installed' : 'not-installed'} ${isConnecting ? 'connecting' : ''}`}
      onClick={handleClick}
      disabled={disabled && !isConnecting}
      aria-label={`${isInstalled ? 'Connect' : 'Install'} ${name} wallet`}
    >
      <div className="provider-icon">{icon}</div>
      
      <div className="provider-info">
        <div className="provider-name">
          {name}
          {isInstalled && <span className="installed-badge">Detected</span>}
        </div>
        <div className="provider-description">{description}</div>
      </div>

      <div className="provider-action">
        {isConnecting ? (
          <div className="spinner-small"></div>
        ) : isInstalled ? (
          <span className="action-text">Connect →</span>
        ) : (
          <span className="action-text install">Install ↗</span>
        )}
      </div>

      <style jsx>{`
        .wallet-provider-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          width: 100%;
        }

        .wallet-provider-item:hover:not(:disabled) {
          background: white;
          border-color: #0d6efd;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .wallet-provider-item.installed {
          border-color: #198754;
        }

        .wallet-provider-item.installed:hover {
          border-color: #0d6efd;
        }

        .wallet-provider-item.connecting {
          background: #e7f3ff;
          border-color: #0d6efd;
        }

        .wallet-provider-item.not-installed {
          opacity: 0.7;
        }

        .wallet-provider-item:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .provider-icon {
          font-size: 2.5rem;
          flex-shrink: 0;
        }

        .provider-info {
          flex: 1;
          min-width: 0;
        }

        .provider-name {
          font-weight: 700;
          font-size: 1.05rem;
          color: #212529;
          margin-bottom: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .installed-badge {
          background: #198754;
          color: white;
          font-size: 0.65rem;
          padding: 0.15rem 0.5rem;
          border-radius: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .provider-description {
          font-size: 0.85rem;
          color: #6c757d;
          line-height: 1.4;
        }

        .provider-action {
          flex-shrink: 0;
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
          width: 20px;
          height: 20px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #0d6efd;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .wallet-provider-item {
            padding: 0.875rem;
          }

          .provider-icon {
            font-size: 2rem;
          }

          .provider-name {
            font-size: 0.95rem;
          }

          .provider-description {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </button>
  );
}

declare global {
  interface Window {
    solana?: any;
    solflare?: any;
    glow?: any;
    backpack?: any;
  }
}






