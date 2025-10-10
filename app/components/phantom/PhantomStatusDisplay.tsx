import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface PhantomStatusDisplayProps {
  status?: ConnectionStatus;
  error?: string;
}

/**
 * PhantomStatusDisplay Component
 * 
 * Displays Phantom wallet connection status
 */
export default function PhantomStatusDisplay({ 
  status: overrideStatus,
  error 
}: PhantomStatusDisplayProps) {
  const { connected, connecting } = useWallet();

  const status: ConnectionStatus = overrideStatus || (
    connecting ? 'connecting' :
    connected ? 'connected' :
    error ? 'error' :
    'disconnected'
  );

  const statusConfig = {
    connecting: {
      icon: '🔄',
      title: 'Connecting to Phantom',
      message: 'Please wait...',
      color: '#ffc107',
    },
    connected: {
      icon: '✅',
      title: 'Phantom Wallet Connected',
      message: 'Your wallet is securely connected',
      color: '#198754',
    },
    disconnected: {
      icon: '⚫',
      title: 'Wallet Disconnected',
      message: 'Connect your Phantom wallet to continue',
      color: '#6c757d',
    },
    error: {
      icon: '❌',
      title: 'Connection Failed',
      message: error || 'Unable to connect to Phantom wallet',
      color: '#dc3545',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`phantom-status ${status}`}>
      <div className="status-icon">{config.icon}</div>
      <div className="status-content">
        <div className="status-title">{config.title}</div>
        <div className="status-message">{config.message}</div>
      </div>

      <style jsx>{`
        .phantom-status {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid ${config.color};
        }

        .status-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .status-content {
          flex: 1;
        }

        .status-title {
          font-weight: 700;
          color: ${config.color};
          margin-bottom: 0.25rem;
        }

        .status-message {
          font-size: 0.85rem;
          color: #6c757d;
        }

        .phantom-status.connecting .status-icon {
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}




