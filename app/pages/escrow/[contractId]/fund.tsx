/**
 * Escrow Funding Interface
 * 
 * WO-102: Comprehensive funding workflow with USDC wallet integration
 * 
 * Features:
 * - Contract details display
 * - USDC deposit form with validation
 * - Wallet connection (Phantom/Solflare)
 * - Transaction confirmation & fee disclosure
 * - Real-time transaction status
 * - Funding history
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../contexts/AuthContext';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

function FundingInterfaceContent() {
  const router = useRouter();
  const { contractId } = router.query;
  const { user } = useAuth();

  const [contract, setContract] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [step, setStep] = useState<'form' | 'confirm' | 'processing' | 'success'>('form');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  // WO-102: Fetch contract details
  useEffect(() => {
    async function fetchContract() {
      if (!contractId) return;

      try {
        const response = await fetch(`/api/escrow/${contractId}`);
        const data = await response.json();

        if (data.success) {
          setContract(data.contract);
        } else {
          setError('Contract not found');
        }
      } catch (err) {
        setError('Failed to load contract');
      } finally {
        setIsLoading(false);
      }
    }

    fetchContract();
  }, [contractId]);

  // WO-102: Calculate fees
  const fees = useMemo(() => {
    const amount = parseFloat(depositAmount) || 0;
    const networkFee = 0.001;
    const platformFee = amount * 0.02;
    const totalCost = amount + networkFee + platformFee;

    return { networkFee, platformFee, totalCost };
  }, [depositAmount]);

  // WO-102: Handle deposit submission
  const handleDeposit = async () => {
    if (!user?.walletAddress || !depositAmount) return;

    setStep('processing');
    setError('');

    try {
      const response = await fetch(`/api/escrow/${contractId}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(depositAmount),
          walletAddress: user.walletAddress,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTxHash(data.deposit.transactionHash);
        setStep('success');
        
        // Refresh contract data
        const contractResponse = await fetch(`/api/escrow/${contractId}`);
        const contractData = await contractResponse.json();
        if (contractData.success) {
          setContract(contractData.contract);
        }
      } else {
        setError(data.message || 'Deposit failed');
        setStep('form');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setStep('form');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6 max-w-4xl mx-auto">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && !contract) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-red-900 mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  const fundingProgress = contract ? (contract.currentBalance / contract.fundingTarget) * 100 : 0;
  const remaining = contract ? contract.fundingTarget - contract.currentBalance : 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fund Escrow Contract</h1>
          <p className="text-gray-600">Deposit USDC tokens to support this project</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column: Contract Details */}
          <div>
            {/* WO-102: Contract Details Display */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contract Details</h2>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Project</div>
                  <div className="font-semibold text-gray-900">{contract?.project?.title}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Funding Progress</div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>${contract?.currentBalance.toLocaleString()}</span>
                      <span>${contract?.fundingTarget.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-600 h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(fundingProgress, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {fundingProgress.toFixed(1)}% Complete • ${remaining.toLocaleString()} Remaining
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Contract Status</div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    contract?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                    contract?.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {contract?.status}
                  </span>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-2">Milestones</div>
                  <div className="text-sm text-gray-900">
                    {contract?.milestones?.completed || 0} completed of {contract?.milestones?.total || 0} total
                  </div>
                </div>
              </div>
            </div>

            {/* Wallet Connection */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-blue-900 mb-1">Wallet Connection</div>
                  <div className="text-sm text-blue-700">
                    {user?.walletAddress 
                      ? `Connected: ${String(user.walletAddress).slice(0, 8)}...${String(user.walletAddress).slice(-6)}`
                      : 'Connect your Solana wallet to deposit'}
                  </div>
                </div>
                <WalletMultiButton />
              </div>
            </div>
          </div>

          {/* Right Column: Funding Form */}
          <div>
            {step === 'form' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Deposit Amount</h2>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (USDC)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                      min="50"
                      max={remaining}
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg font-semibold"
                    />
                    <div className="absolute right-4 top-3 text-gray-500 font-medium">USDC</div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Min: $50</span>
                    <span>Max: ${remaining.toLocaleString()}</span>
                  </div>
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {[100, 500, 1000, 5000].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setDepositAmount(amount.toString())}
                      disabled={amount > remaining}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ${amount}
                    </button>
                  ))}
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={() => setStep('confirm')}
                  disabled={!user?.walletAddress || !depositAmount || parseFloat(depositAmount) < 50 || parseFloat(depositAmount) > remaining}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            )}

            {/* WO-102: Transaction Confirmation Screen */}
            {step === 'confirm' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Transaction</h2>

                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Deposit Amount</div>
                    <div className="text-2xl font-bold text-gray-900">${parseFloat(depositAmount).toLocaleString()} USDC</div>
                  </div>

                  {/* WO-102: Fee Disclosure */}
                  <div className="p-4 border border-gray-200 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Deposit Amount:</span>
                      <span className="font-medium">${parseFloat(depositAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Network Fee:</span>
                      <span className="font-medium">${fees.networkFee.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Platform Fee (2%):</span>
                      <span className="font-medium">${fees.platformFee.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-300 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="font-bold text-gray-900">Total Cost:</span>
                        <span className="font-bold text-blue-600">${fees.totalCost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('form')}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleDeposit}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                  >
                    Confirm Deposit
                  </button>
                </div>
              </div>
            )}

            {/* WO-102: Processing State */}
            {step === 'processing' && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="animate-spin text-6xl mb-4">⏳</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Processing Transaction...</h3>
                <p className="text-gray-600">Please wait while your deposit is being processed on the blockchain.</p>
              </div>
            )}

            {/* WO-102: Success Confirmation */}
            {step === 'success' && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Deposit Successful!</h3>
                <p className="text-gray-600 mb-6">
                  Your deposit of ${parseFloat(depositAmount).toLocaleString()} USDC has been confirmed.
                </p>

                <div className="p-4 bg-gray-50 rounded-lg mb-6 text-left">
                  <div className="text-sm text-gray-600 mb-1">Transaction Hash</div>
                  <div className="font-mono text-xs text-gray-900 break-all">{txHash}</div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => router.push('/escrow/dashboard')}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  >
                    View Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setDepositAmount('');
                      setStep('form');
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Deposit More
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

// WO-102: Wrap with Wallet Providers
export default function FundEscrowPage() {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <FundingInterfaceContent />
      </WalletModalProvider>
    </WalletProvider>
  );
}

