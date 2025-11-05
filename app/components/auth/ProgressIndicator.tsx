import React from 'react';
import { AuthStep } from './AuthFlowContainer';

interface ProgressIndicatorProps {
  currentStep: AuthStep;
}

/**
 * ProgressIndicator Component
 * 
 * Shows step-by-step progress through the authentication flow
 */
export default function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const steps = [
    { id: AuthStep.CONNECTING, label: 'Connect', icon: '🔌' },
    { id: AuthStep.CHALLENGE, label: 'Challenge', icon: '📝' },
    { id: AuthStep.SIGNING, label: 'Sign', icon: '✍️' },
    { id: AuthStep.VERIFYING, label: 'Verify', icon: '🔍' },
    { id: AuthStep.COMPLETE, label: 'Complete', icon: '✅' },
  ];

  const getStepStatus = (stepId: AuthStep): 'pending' | 'active' | 'complete' | 'error' => {
    if (currentStep === AuthStep.ERROR) {
      return 'error';
    }

    const currentIndex = steps.findIndex(s => s.id === currentStep);
    const stepIndex = steps.findIndex(s => s.id === stepId);

    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="progress-indicator">
      <div className="progress-steps">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);

          return (
            <div key={step.id} className="progress-step-wrapper">
              <div className={`progress-step ${status}`}>
                <div className="step-icon">{step.icon}</div>
                <div className="step-label">{step.label}</div>
                {status === 'active' && <div className="step-pulse"></div>}
              </div>
              {index < steps.length - 1 && (
                <div className={`progress-connector ${status === 'complete' ? 'complete' : ''}`} />
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .progress-indicator {
          margin-bottom: 2rem;
          padding: 1.5rem 1rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .progress-steps {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
        }

        .progress-step-wrapper {
          display: flex;
          align-items: center;
        }

        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          position: relative;
        }

        .step-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          background: #e9ecef;
          border: 2px solid #dee2e6;
          transition: all 0.3s;
        }

        .progress-step.active .step-icon {
          background: #0d6efd;
          border-color: #0d6efd;
          transform: scale(1.1);
          box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.1);
        }

        .progress-step.complete .step-icon {
          background: #198754;
          border-color: #198754;
        }

        .progress-step.error .step-icon {
          background: #dc3545;
          border-color: #dc3545;
        }

        .step-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6c757d;
          text-align: center;
        }

        .progress-step.active .step-label {
          color: #0d6efd;
        }

        .progress-step.complete .step-label {
          color: #198754;
        }

        .progress-connector {
          width: 60px;
          height: 2px;
          background: #dee2e6;
          transition: background 0.3s;
        }

        .progress-connector.complete {
          background: #198754;
        }

        .step-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 2px solid #0d6efd;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }

        @media (max-width: 640px) {
          .progress-connector {
            width: 30px;
          }

          .step-icon {
            width: 40px;
            height: 40px;
            font-size: 1.2rem;
          }

          .step-label {
            font-size: 0.7rem;
          }
        }
      `}</style>
    </div>
  );
}






