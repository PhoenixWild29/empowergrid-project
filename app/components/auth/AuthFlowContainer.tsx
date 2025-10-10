import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '../../contexts/AuthContext';
import ChallengeDisplay from './ChallengeDisplay';
import ProgressIndicator from './ProgressIndicator';
import SignatureVerification from './SignatureVerification';
import SessionConfirmation from './SessionConfirmation';
import AuthErrorDisplay from './AuthErrorDisplay';
import SecurityIndicator from './SecurityIndicator';

/**
 * Authentication flow steps
 */
export enum AuthStep {
  CONNECTING = 'connecting',
  CHALLENGE = 'challenge',
  SIGNING = 'signing',
  VERIFYING = 'verifying',
  ESTABLISHING_SESSION = 'establishing_session',
  COMPLETE = 'complete',
  ERROR = 'error',
}

/**
 * Authentication flow state
 */
interface AuthFlowState {
  step: AuthStep;
  challengeMessage?: string;
  challengeNonce?: string;
  challengeExpiresAt?: string;
  error?: {
    message: string;
    code?: string;
    retryable: boolean;
  };
  sessionId?: string;
}

/**
 * AuthFlowContainer Component
 * 
 * Manages the complete wallet authentication flow with step-by-step guidance
 * 
 * Features:
 * - Progress indicators for each step
 * - Clear challenge message display
 * - Signature verification UI
 * - Session confirmation
 * - Error handling with retry options
 * - Security status indicators
 */
export default function AuthFlowContainer() {
  const { publicKey, signMessage, connected } = useWallet();
  const { login, isAuthenticated, isLoading, error: authError } = useAuth();

  const [flowState, setFlowState] = useState<AuthFlowState>({
    step: AuthStep.CONNECTING,
  });

  // Handle authentication
  useEffect(() => {
    if (connected && publicKey && !isAuthenticated) {
      startAuthenticationFlow();
    }
  }, [connected, publicKey, isAuthenticated]);

  /**
   * Start the authentication flow
   */
  const startAuthenticationFlow = async () => {
    if (!publicKey || !signMessage) {
      setFlowState({
        step: AuthStep.ERROR,
        error: {
          message: 'Wallet not connected properly',
          retryable: true,
        },
      });
      return;
    }

    try {
      // Step 1: Generate challenge
      setFlowState({ step: AuthStep.CHALLENGE });

      const challengeResponse = await fetch('/api/auth/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
        }),
      });

      if (!challengeResponse.ok) {
        throw new Error('Failed to generate authentication challenge');
      }

      const challengeData = await challengeResponse.json();

      setFlowState({
        step: AuthStep.CHALLENGE,
        challengeMessage: challengeData.message,
        challengeNonce: challengeData.nonce,
        challengeExpiresAt: challengeData.expiresAt,
      });

      // Wait a moment for user to read the challenge
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Request signature
      await requestSignature(challengeData);

    } catch (error) {
      setFlowState({
        step: AuthStep.ERROR,
        error: {
          message: error instanceof Error ? error.message : 'Authentication failed',
          retryable: true,
        },
      });
    }
  };

  /**
   * Request signature from wallet
   */
  const requestSignature = async (challengeData: any) => {
    if (!signMessage || !publicKey) return;

    try {
      setFlowState(prev => ({ ...prev, step: AuthStep.SIGNING }));

      // Sign the challenge message
      const messageBytes = new TextEncoder().encode(challengeData.message);
      const signatureBytes = await signMessage(messageBytes);

      // Convert to base58
      const bs58 = await import('bs58');
      const signature = bs58.default.encode(signatureBytes);

      // Step 3: Verify signature with backend
      await verifySignature(challengeData, signature);

    } catch (error) {
      setFlowState({
        step: AuthStep.ERROR,
        error: {
          message: error instanceof Error ? error.message : 'Signature failed',
          code: 'SIGNATURE_REJECTED',
          retryable: true,
        },
      });
    }
  };

  /**
   * Verify signature and establish session
   */
  const verifySignature = async (challengeData: any, signature: string) => {
    if (!publicKey) return;

    try {
      setFlowState(prev => ({ ...prev, step: AuthStep.VERIFYING }));

      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          signature,
          message: challengeData.message,
          nonce: challengeData.nonce,
        }),
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json();
        throw new Error(errorData.message || 'Authentication failed');
      }

      const loginData = await loginResponse.json();

      setFlowState({
        step: AuthStep.ESTABLISHING_SESSION,
        sessionId: loginData.sessionId,
      });

      // Wait a moment to show session establishment
      await new Promise(resolve => setTimeout(resolve, 500));

      setFlowState({
        step: AuthStep.COMPLETE,
        sessionId: loginData.sessionId,
      });

    } catch (error) {
      setFlowState({
        step: AuthStep.ERROR,
        error: {
          message: error instanceof Error ? error.message : 'Verification failed',
          code: 'VERIFICATION_FAILED',
          retryable: true,
        },
      });
    }
  };

  /**
   * Retry authentication
   */
  const handleRetry = () => {
    setFlowState({ step: AuthStep.CONNECTING });
    startAuthenticationFlow();
  };

  /**
   * Cancel authentication
   */
  const handleCancel = () => {
    setFlowState({ step: AuthStep.CONNECTING });
  };

  return (
    <div className="auth-flow-container">
      {/* Security Indicator - Always visible */}
      <SecurityIndicator
        connected={connected}
        step={flowState.step}
        error={!!flowState.error}
      />

      {/* Progress Indicator */}
      <ProgressIndicator currentStep={flowState.step} />

      {/* Step-specific content */}
      <div className="auth-flow-content">
        {flowState.step === AuthStep.CHALLENGE && flowState.challengeMessage && (
          <ChallengeDisplay
            message={flowState.challengeMessage}
            expiresAt={flowState.challengeExpiresAt}
            onCancel={handleCancel}
          />
        )}

        {flowState.step === AuthStep.SIGNING && (
          <SignatureVerification
            message={flowState.challengeMessage || ''}
            walletAddress={publicKey?.toString() || ''}
          />
        )}

        {flowState.step === AuthStep.VERIFYING && (
          <div className="auth-flow-step verifying">
            <div className="spinner"></div>
            <h3>Verifying Signature</h3>
            <p>Please wait while we verify your wallet signature...</p>
          </div>
        )}

        {flowState.step === AuthStep.ESTABLISHING_SESSION && (
          <div className="auth-flow-step establishing">
            <div className="spinner"></div>
            <h3>Establishing Session</h3>
            <p>Creating your secure session...</p>
          </div>
        )}

        {flowState.step === AuthStep.COMPLETE && (
          <SessionConfirmation
            walletAddress={publicKey?.toString() || ''}
            sessionId={flowState.sessionId}
          />
        )}

        {flowState.step === AuthStep.ERROR && flowState.error && (
          <AuthErrorDisplay
            error={flowState.error}
            onRetry={flowState.error.retryable ? handleRetry : undefined}
            onCancel={handleCancel}
          />
        )}
      </div>

      {/* Session timeout warning handled by AutoRenewalProvider */}
    </div>
  );
}

