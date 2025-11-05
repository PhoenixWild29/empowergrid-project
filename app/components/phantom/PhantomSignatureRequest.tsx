import React from 'react';

interface PhantomSignatureRequestProps {
  message: string;
  onApprove?: () => void;
  onReject?: () => void;
}

/**
 * PhantomSignatureRequest Component
 * 
 * Displays pending signature request with instructions
 */
export default function PhantomSignatureRequest({
  message,
  onApprove,
  onReject,
}: PhantomSignatureRequestProps) {
  return (
    <div className="phantom-signature-request">
      <div className="request-header">
        <div className="phantom-logo">👻</div>
        <h3>Phantom Signature Request</h3>
      </div>

      <div className="request-content">
        <p className="request-instruction">
          Please approve the signature request in your Phantom wallet extension
        </p>

        <div className="message-preview">
          <div className="message-label">Message to Sign:</div>
          <div className="message-text">{message.slice(0, 100)}...</div>
        </div>

        <div className="request-info">
          <div className="info-item">
            ℹ️ This will not cost any gas fees
          </div>
          <div className="info-item">
            🔒 Your private key remains secure in your wallet
          </div>
        </div>
      </div>

      <div className="request-animation">
        <div className="pulse-ring"></div>
        <div className="wallet-icon">👛</div>
      </div>

      <style jsx>{`
        .phantom-signature-request {
          max-width: 400px;
          margin: 0 auto;
          text-align: center;
          padding: 2rem;
        }

        .request-header {
          margin-bottom: 1.5rem;
        }

        .phantom-logo {
          font-size: 3rem;
          margin-bottom: 0.5rem;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .request-header h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #AB33C0;
          margin: 0;
        }

        .request-content {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .request-instruction {
          color: #495057;
          margin-bottom: 1rem;
          font-weight: 500;
        }

        .message-preview {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          text-align: left;
        }

        .message-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #6c757d;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }

        .message-text {
          font-family: 'Monaco', monospace;
          font-size: 0.8rem;
          color: #212529;
          word-break: break-all;
        }

        .request-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #6c757d;
        }

        .info-item {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .request-animation {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto;
        }

        .pulse-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          border: 3px solid #AB33C0;
          border-radius: 50%;
          animation: pulse-ring 2s infinite;
        }

        @keyframes pulse-ring {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.4);
            opacity: 0;
          }
        }

        .wallet-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 2.5rem;
        }
      `}</style>
    </div>
  );
}






