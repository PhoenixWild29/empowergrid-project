import React from 'react';

interface PhantomErrorModalProps {
  isOpen: boolean;
  error: string;
  onClose: () => void;
  onRetry?: () => void;
}

/**
 * PhantomErrorModal Component
 * 
 * Displays Phantom connection errors with helpful recovery suggestions
 */
export default function PhantomErrorModal({
  isOpen,
  error,
  onClose,
  onRetry,
}: PhantomErrorModalProps) {
  if (!isOpen) return null;

  const getErrorGuidance = (errorMessage: string) => {
    if (errorMessage.includes('rejected')) {
      return {
        title: 'Connection Rejected',
        suggestion: 'You rejected the connection request. Please try again and approve the connection in your Phantom wallet.',
        action: 'Retry Connection',
      };
    }

    if (errorMessage.includes('not installed') || errorMessage.includes('not found')) {
      return {
        title: 'Phantom Not Installed',
        suggestion: 'Phantom wallet extension is not installed in your browser.',
        action: 'Install Phantom',
        actionUrl: 'https://phantom.app/',
      };
    }

    if (errorMessage.includes('timeout')) {
      return {
        title: 'Connection Timeout',
        suggestion: 'The connection request timed out. Please ensure Phantom is unlocked and try again.',
        action: 'Retry Connection',
      };
    }

    return {
      title: 'Connection Error',
      suggestion: 'An unexpected error occurred while connecting to Phantom wallet.',
      action: 'Try Again',
    };
  };

  const guidance = getErrorGuidance(error);

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="phantom-error-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div className="error-icon">⚠️</div>
          <h2>{guidance.title}</h2>
        </div>

        <div className="modal-body">
          <p className="error-message">{error}</p>
          <p className="error-suggestion">{guidance.suggestion}</p>
        </div>

        <div className="modal-actions">
          {guidance.actionUrl ? (
            <button
              className="btn btn-primary"
              onClick={() => window.open(guidance.actionUrl, '_blank')}
            >
              {guidance.action}
            </button>
          ) : onRetry ? (
            <button className="btn btn-primary" onClick={onRetry}>
              {guidance.action}
            </button>
          ) : null}
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            z-index: 9998;
          }

          .phantom-error-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 12px;
            padding: 2rem;
            max-width: 400px;
            width: 90%;
            z-index: 9999;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }

          .modal-header {
            text-align: center;
            margin-bottom: 1.5rem;
          }

          .error-icon {
            font-size: 3rem;
            margin-bottom: 0.5rem;
          }

          .modal-header h2 {
            font-size: 1.25rem;
            font-weight: 700;
            color: #dc3545;
            margin: 0;
          }

          .modal-body {
            margin-bottom: 1.5rem;
          }

          .error-message {
            background: #f8d7da;
            color: #842029;
            padding: 0.875rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            font-size: 0.9rem;
          }

          .error-suggestion {
            color: #495057;
            font-size: 0.9rem;
            line-height: 1.6;
          }

          .modal-actions {
            display: flex;
            gap: 0.75rem;
            justify-content: center;
          }

          .btn {
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn-primary {
            background: #AB33C0;
            color: white;
          }

          .btn-primary:hover {
            background: #9429ac;
          }

          .btn-secondary {
            background: #6c757d;
            color: white;
          }

          .btn-secondary:hover {
            background: #5a6268;
          }
        `}</style>
      </div>
    </>
  );
}






