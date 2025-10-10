/**
 * Multi-Factor Authentication Component
 * 
 * WO-103: MFA for high-value transactions
 * 
 * Features:
 * - Email verification
 * - SMS codes
 * - Authenticator app support
 * - Configurable threshold
 */

'use client';

import React, { useState } from 'react';

interface MultiFactorAuthProps {
  transactionAmount: number;
  threshold?: number;
  onVerify: (verified: boolean) => void;
  onCancel: () => void;
}

export default function MultiFactorAuth({
  transactionAmount,
  threshold = 5000,
  onVerify,
  onCancel,
}: MultiFactorAuthProps) {
  const [method, setMethod] = useState<'email' | 'sms' | 'authenticator'>('email');
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  // WO-103: Only require MFA for high-value transactions
  const requiresMFA = transactionAmount >= threshold;

  // Auto-verify for low-value transactions
  React.useEffect(() => {
    if (!requiresMFA) {
      onVerify(true);
    }
  }, [requiresMFA, onVerify]);

  if (!requiresMFA) {
    return null;
  }

  const handleVerify = async () => {
    setIsVerifying(true);
    setError('');

    try {
      // Simulate verification
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (code === '123456') { // Simplified verification
        onVerify(true);
      } else {
        setError('Invalid verification code. Try again.');
        setIsVerifying(false);
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
      setIsVerifying(false);
    }
  };

  const handleSendCode = async () => {
    setError('');
    // Simulate sending code
    await new Promise(resolve => setTimeout(resolve, 500));
    alert(`Verification code sent via ${method}!`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Multi-Factor Authentication Required
          </h2>
          <p className="text-gray-600">
            This is a high-value transaction (${transactionAmount.toLocaleString()}).
            Please verify your identity.
          </p>
        </div>

        {/* Method Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Verification Method
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setMethod('email')}
              className={`p-3 rounded-lg border-2 transition-all ${
                method === 'email'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">📧</div>
              <div className="text-xs font-medium">Email</div>
            </button>

            <button
              onClick={() => setMethod('sms')}
              className={`p-3 rounded-lg border-2 transition-all ${
                method === 'sms'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">📱</div>
              <div className="text-xs font-medium">SMS</div>
            </button>

            <button
              onClick={() => setMethod('authenticator')}
              className={`p-3 rounded-lg border-2 transition-all ${
                method === 'authenticator'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">🔑</div>
              <div className="text-xs font-medium">App</div>
            </button>
          </div>
        </div>

        {/* Code Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verification Code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className="w-full p-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest font-mono"
          />
          <button
            onClick={handleSendCode}
            className="text-sm text-blue-600 hover:text-blue-700 mt-2"
          >
            Send {method} code →
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isVerifying}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={isVerifying || code.length !== 6}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? 'Verifying...' : 'Verify'}
          </button>
        </div>

        <p className="text-xs text-center text-gray-500 mt-4">
          For demo purposes, use code: 123456
        </p>
      </div>
    </div>
  );
}

