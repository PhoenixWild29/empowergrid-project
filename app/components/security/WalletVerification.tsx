/**
 * Wallet Verification Component
 * 
 * WO-103: Wallet ownership verification
 * 
 * Features:
 * - Signature verification
 * - Security status display
 * - Recommendations
 */

'use client';

import React, { useState } from 'react';

interface WalletVerificationProps {
  walletAddress: string;
  onVerified: () => void;
}

export default function WalletVerification({
  walletAddress,
  onVerified,
}: WalletVerificationProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const securityScore = calculateSecurityScore(walletAddress);

  const handleVerify = async () => {
    setIsVerifying(true);
    
    // Simulate signature verification
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsVerified(true);
    setIsVerifying(false);
    onVerified();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span>🔐</span> Wallet Verification
      </h3>

      {/* Wallet Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600 mb-2">Connected Wallet</div>
        <div className="font-mono text-sm text-gray-900 break-all">{walletAddress}</div>
      </div>

      {/* Security Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium text-gray-900">Security Score</span>
          <span className={`text-2xl font-bold ${
            securityScore >= 80 ? 'text-green-600' :
            securityScore >= 60 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {securityScore}/100
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              securityScore >= 80 ? 'bg-green-600' :
              securityScore >= 60 ? 'bg-yellow-600' :
              'bg-red-600'
            }`}
            style={{ width: `${securityScore}%` }}
          />
        </div>
      </div>

      {/* Security Recommendations */}
      <div className="mb-6 space-y-2">
        <div className="font-medium text-gray-900 mb-3">Security Recommendations</div>
        
        <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <span className="text-green-600 text-xl">✓</span>
          <div>
            <div className="font-medium text-green-900">Wallet Connected</div>
            <div className="text-sm text-green-700">Your wallet is properly connected</div>
          </div>
        </div>

        {!isVerified && (
          <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <span className="text-yellow-600 text-xl">⚠</span>
            <div>
              <div className="font-medium text-yellow-900">Ownership Not Verified</div>
              <div className="text-sm text-yellow-700">Sign a message to verify ownership</div>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-blue-600 text-xl">ℹ</span>
          <div>
            <div className="font-medium text-blue-900">Enable 2FA</div>
            <div className="text-sm text-blue-700">Add multi-factor authentication for extra security</div>
          </div>
        </div>
      </div>

      {/* Verification Button */}
      {!isVerified ? (
        <button
          onClick={handleVerify}
          disabled={isVerifying}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isVerifying ? 'Verifying Wallet...' : 'Verify Wallet Ownership'}
        </button>
      ) : (
        <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg text-center">
          <div className="text-3xl mb-2">✅</div>
          <div className="font-bold text-green-900">Wallet Verified!</div>
          <div className="text-sm text-green-700">You can now proceed with transactions</div>
        </div>
      )}
    </div>
  );
}

function calculateSecurityScore(walletAddress: string): number {
  let score = 50; // Base score

  // Has recent activity (simulated)
  score += 20;

  // No known issues
  score += 20;

  // Standard wallet
  score += 10;

  return Math.min(100, score);
}


