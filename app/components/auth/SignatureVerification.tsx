import React from 'react';

interface SignatureVerificationProps {
  message: string;
  walletAddress: string;
}

/**
 * SignatureVerification Component
 * 
 * Displays signature request interface with security warnings
 */
export default function SignatureVerification({
  message,
  walletAddress,
}: SignatureVerificationProps) {
  return (
    <div className="signature-verification">
      <div className="verification-header">
        <div className="wallet-icon">👛</div>
        <h2>Wallet Signature Requested</h2>
        <p className="verification-subtitle">
          Please approve the signature request in your wallet
        </p>
      </div>

      <div className="verification-details">
        <div className="detail-item">
          <span className="detail-label">Wallet Address:</span>
          <span className="detail-value wallet-address">
            {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
          </span>
        </div>

        <div className="detail-item">
          <span className="detail-label">Action:</span>
          <span className="detail-value">Sign Authentication Message</span>
        </div>

        <div className="detail-item">
          <span className="detail-label">Cost:</span>
          <span className="detail-value">
            <strong className="text-success">FREE</strong> (No gas fees)
          </span>
        </div>
      </div>

      <div className="security-warnings">
        <h3>🛡️ Security Information</h3>
        <ul>
          <li>✅ No blockchain transaction will be initiated</li>
          <li>✅ No tokens will be transferred</li>
          <li>✅ No gas fees will be charged</li>
          <li>✅ Only proves you control this wallet</li>
        </ul>
      </div>

      <div className="verification-spinner">
        <div className="spinner-border"></div>
        <p>Waiting for wallet approval...</p>
        <p className="text-muted">Check your wallet extension</p>
      </div>

      <style jsx>{`
        .signature-verification {
          max-width: 500px;
          margin: 0 auto;
          text-align: center;
        }

        .verification-header {
          margin-bottom: 2rem;
        }

        .wallet-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .verification-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }

        .verification-subtitle {
          color: #666;
          font-size: 0.95rem;
        }

        .verification-details {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          text-align: left;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid #e9ecef;
        }

        .detail-item:last-child {
          border-bottom: none;
        }

        .detail-label {
          font-weight: 600;
          color: #495057;
        }

        .detail-value {
          color: #212529;
        }

        .wallet-address {
          font-family: 'Monaco', monospace;
          font-size: 0.85rem;
        }

        .text-success {
          color: #198754;
        }

        .security-warnings {
          background: #d1ecf1;
          border: 1px solid #bee5eb;
          border-radius: 8px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
          text-align: left;
        }

        .security-warnings h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #0c5460;
          margin-bottom: 0.75rem;
        }

        .security-warnings ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .security-warnings li {
          padding: 0.25rem 0;
          color: #0c5460;
          font-size: 0.9rem;
        }

        .verification-spinner {
          padding: 2rem 0;
        }

        .spinner-border {
          width: 48px;
          height: 48px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #0d6efd;
          border-radius: 50%;
          margin: 0 auto 1rem;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .verification-spinner p {
          margin: 0.5rem 0;
          color: #495057;
        }

        .text-muted {
          color: #6c757d !important;
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
}






