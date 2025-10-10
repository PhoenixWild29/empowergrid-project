import React from 'react';

interface AuthErrorDisplayProps {
  error: {
    message: string;
    code?: string;
    retryable: boolean;
  };
  onRetry?: () => void;
  onCancel: () => void;
}

/**
 * AuthErrorDisplay Component
 * 
 * Displays authentication errors with specific messages and retry options
 */
export default function AuthErrorDisplay({
  error,
  onRetry,
  onCancel,
}: AuthErrorDisplayProps) {
  const getErrorTitle = (code?: string): string => {
    switch (code) {
      case 'SIGNATURE_REJECTED':
        return 'Signature Rejected';
      case 'VERIFICATION_FAILED':
        return 'Verification Failed';
      case 'EXPIRED_CHALLENGE':
        return 'Challenge Expired';
      case 'INVALID_SIGNATURE':
        return 'Invalid Signature';
      default:
        return 'Authentication Error';
    }
  };

  const getErrorSuggestion = (code?: string): string => {
    switch (code) {
      case 'SIGNATURE_REJECTED':
        return 'You rejected the signature request in your wallet. Please try again and approve the signature.';
      case 'VERIFICATION_FAILED':
        return 'The signature could not be verified. Please ensure you are using the correct wallet.';
      case 'EXPIRED_CHALLENGE':
        return 'The authentication challenge has expired. Please start the process again.';
      case 'INVALID_SIGNATURE':
        return 'The signature format is invalid. This may be a wallet compatibility issue.';
      default:
        return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
    }
  };

  return (
    <div className="auth-error-display">
      <div className="error-header">
        <div className="error-icon">❌</div>
        <h2>{getErrorTitle(error.code)}</h2>
      </div>

      <div className="error-content">
        <div className="error-message">
          {error.message}
        </div>

        <div className="error-suggestion">
          <strong>💡 Suggestion:</strong>
          <p>{getErrorSuggestion(error.code)}</p>
        </div>

        {error.code && (
          <div className="error-code">
            <small>Error Code: {error.code}</small>
          </div>
        )}
      </div>

      <div className="error-actions">
        {onRetry && error.retryable && (
          <button className="btn btn-primary" onClick={onRetry}>
            🔄 Try Again
          </button>
        )}
        <button className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <div className="error-help">
        <p>Need help? Check our <a href="/docs/authentication">authentication guide</a></p>
      </div>

      <style jsx>{`
        .auth-error-display {
          max-width: 500px;
          margin: 0 auto;
          text-align: center;
        }

        .error-header {
          margin-bottom: 1.5rem;
        }

        .error-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          animation: shake 0.5s;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        .error-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #dc3545;
          margin: 0;
        }

        .error-content {
          background: #f8d7da;
          border: 1px solid #f5c2c7;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          text-align: left;
        }

        .error-message {
          color: #842029;
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .error-suggestion {
          background: white;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
        }

        .error-suggestion strong {
          display: block;
          color: #0c5460;
          margin-bottom: 0.5rem;
        }

        .error-suggestion p {
          margin: 0;
          color: #495057;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .error-code {
          font-size: 0.75rem;
          color: #6c757d;
          font-family: 'Monaco', monospace;
        }

        .error-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .btn {
          padding: 0.75rem 2rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #0d6efd;
          color: white;
        }

        .btn-primary:hover {
          background: #0b5ed7;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #5a6268;
        }

        .error-help {
          font-size: 0.85rem;
          color: #6c757d;
        }

        .error-help a {
          color: #0d6efd;
          text-decoration: none;
        }

        .error-help a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}




