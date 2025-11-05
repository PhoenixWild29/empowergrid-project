import React, { useState } from 'react';
import { connectionManager, WalletProviderType } from '../../lib/wallet/ConnectionManager';
import { LEDGER_SETUP_STEPS } from '../../lib/wallet/providers/LedgerConnector';

interface ConnectionModalProps {
  isOpen: boolean;
  provider: WalletProviderType;
  onClose: () => void;
  onSuccess: (publicKey: string) => void;
}

/**
 * ConnectionModal Component
 * 
 * Provider-specific connection flow modal
 * 
 * Features:
 * - Provider-specific instructions
 * - Step-by-step guidance (especially for Ledger)
 * - Connection progress indicators
 * - Error handling with recovery steps
 */
export default function ConnectionModal({
  isOpen,
  provider,
  onClose,
  onSuccess,
}: ConnectionModalProps) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupStep, setSetupStep] = useState(0);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);

    try {
      const result = await connectionManager.connect({ provider });

      if (result.success && result.publicKey) {
        onSuccess(result.publicKey.toString());
      } else {
        setError(result.error || 'Connection failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setConnecting(false);
    }
  };

  if (!isOpen) return null;

  const isLedger = provider === 'ledger';

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="connection-modal">
        <div className="modal-header">
          <h2>Connect {provider.charAt(0).toUpperCase() + provider.slice(1)}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {isLedger && (
            <div className="ledger-steps">
              {LEDGER_SETUP_STEPS.map((step) => (
                <div key={step.step} className={`setup-step ${setupStep >= step.step ? 'active' : ''}`}>
                  <div className="step-icon">{step.icon}</div>
                  <div className="step-content">
                    <div className="step-title">{step.title}</div>
                    <div className="step-description">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <button
            className="connect-btn"
            onClick={handleConnect}
            disabled={connecting}
          >
            {connecting ? 'Connecting...' : `Connect ${provider}`}
          </button>
        </div>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9998;
          }

          .connection-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 12px;
            padding: 2rem;
            max-width: 500px;
            width: 90%;
            z-index: 9999;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
          }

          .modal-header h2 {
            font-size: 1.5rem;
            font-weight: 700;
            margin: 0;
          }

          .close-btn {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #6c757d;
          }

          .ledger-steps {
            margin-bottom: 1.5rem;
          }

          .setup-step {
            display: flex;
            gap: 1rem;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 0.75rem;
            opacity: 0.5;
          }

          .setup-step.active {
            opacity: 1;
            border: 2px solid #0d6efd;
          }

          .step-icon {
            font-size: 2rem;
            flex-shrink: 0;
          }

          .step-content {
            flex: 1;
          }

          .step-title {
            font-weight: 700;
            margin-bottom: 0.25rem;
          }

          .step-description {
            font-size: 0.85rem;
            color: #6c757d;
          }

          .error-message {
            background: #f8d7da;
            color: #842029;
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 1rem;
          }

          .connect-btn {
            width: 100%;
            padding: 0.875rem;
            background: #0d6efd;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 700;
            cursor: pointer;
            transition: background 0.2s;
          }

          .connect-btn:hover:not(:disabled) {
            background: #0b5ed7;
          }

          .connect-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    </>
  );
}






