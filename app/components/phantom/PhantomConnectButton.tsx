import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface PhantomConnectButtonProps {
  onConnect?: () => void;
}

/**
 * PhantomConnectButton Component
 * 
 * Phantom-specific wallet connection button
 */
export default function PhantomConnectButton({ onConnect }: PhantomConnectButtonProps) {
  const { select, connect, connecting, connected, wallets } = useWallet();

  const handleConnect = async () => {
    try {
      const phantomWallet = wallets.find(w => w.adapter.name === 'Phantom');
      
      if (phantomWallet) {
        select(phantomWallet.adapter.name);
        await connect();
        onConnect?.();
      } else {
        window.open('https://phantom.app/', '_blank');
      }
    } catch (error) {
      console.error('Phantom connection failed:', error);
    }
  };

  if (connected) return null;

  return (
    <button
      className="phantom-connect-btn"
      onClick={handleConnect}
      disabled={connecting}
    >
      {connecting ? (
        <>
          <span className="spinner"></span>
          <span>Connecting to Phantom...</span>
        </>
      ) : (
        <>
          <span className="phantom-icon">👻</span>
          <span>Connect Phantom Wallet</span>
        </>
      )}

      <style jsx>{`
        .phantom-connect-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1.5rem;
          background: linear-gradient(135deg, #AB33C0 0%, #5B21B6 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(171, 51, 192, 0.3);
        }

        .phantom-connect-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(171, 51, 192, 0.4);
        }

        .phantom-connect-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .phantom-icon {
          font-size: 1.5rem;
        }

        .spinner {
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




