/**
 * Funding Interface Component
 * 
 * WO-66: Create Funding Interface with Investment Workflow
 * 
 * Features:
 * - Current funding status display
 * - Investment amount input with validation
 * - Investment impact calculator
 * - Wallet connection workflow
 * - Transaction confirmation screen
 * - Transaction status tracking
 * - Success/failure feedback
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface FundingInterfaceProps {
  projectId: string;
  project: {
    id: string;
    title: string;
    targetAmount: number;
    currentAmount: number;
    energyCapacity: number | null;
    status: string;
  };
  onFundingComplete?: () => void;
}

type WorkflowStep = 'amount' | 'wallet' | 'confirm' | 'processing' | 'complete' | 'error';

export default function FundingInterface({
  projectId,
  project,
  onFundingComplete,
}: FundingInterfaceProps) {
  const { connected, publicKey, connecting } = useWallet();
  
  const [step, setStep] = useState<WorkflowStep>('amount');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');

  const fundingProgress = (project.currentAmount / project.targetAmount) * 100;
  const remaining = project.targetAmount - project.currentAmount;

  // WO-66: Amount validation
  const validateAmount = (value: string): boolean => {
    const numAmount = parseFloat(value);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be greater than 0');
      return false;
    }

    if (numAmount < 10) {
      setError('Minimum investment is $10');
      return false;
    }

    if (numAmount > remaining) {
      setError(`Maximum investment is $${remaining.toLocaleString()} (remaining amount)`);
      return false;
    }

    if (numAmount > 100000) {
      setError('Maximum investment per transaction is $100,000');
      return false;
    }

    setError('');
    return true;
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (value) {
      validateAmount(value);
    } else {
      setError('');
    }
  };

  const handleNext = () => {
    if (step === 'amount') {
      if (!validateAmount(amount)) return;
      if (!connected) {
        setStep('wallet');
      } else {
        setStep('confirm');
      }
    } else if (step === 'wallet') {
      if (connected) {
        setStep('confirm');
      }
    } else if (step === 'confirm') {
      handleSubmitFunding();
    }
  };

  const handleSubmitFunding = async () => {
    setStep('processing');

    try {
      const response = await fetch(`/api/projects/${projectId}/fund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency: 'USDC',
          walletAddress: publicKey?.toString(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTxHash(data.blockchain.transactionHash);
        setStep('complete');
        onFundingComplete?.();
      } else {
        setError(data.message || 'Transaction failed');
        setStep('error');
      }
    } catch (err) {
      console.error('Funding error:', err);
      setError('Failed to process funding. Please try again.');
      setStep('error');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      {/* WO-66: Funding Status Display */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Fund This Project</h2>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Funding Progress</span>
            <span>${project.currentAmount.toLocaleString()} / ${project.targetAmount.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-600 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(fundingProgress, 100)}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {fundingProgress.toFixed(1)}% funded • ${remaining.toLocaleString()} remaining
          </div>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="p-6">
        {/* Step Indicators */}
        <div className="flex items-center justify-between mb-8">
          <StepIndicator number={1} label="Amount" active={step === 'amount'} completed={['wallet', 'confirm', 'processing', 'complete'].includes(step)} />
          <div className="flex-1 h-0.5 bg-gray-300 mx-2"></div>
          <StepIndicator number={2} label="Wallet" active={step === 'wallet'} completed={['confirm', 'processing', 'complete'].includes(step)} />
          <div className="flex-1 h-0.5 bg-gray-300 mx-2"></div>
          <StepIndicator number={3} label="Confirm" active={step === 'confirm'} completed={['processing', 'complete'].includes(step)} />
          <div className="flex-1 h-0.5 bg-gray-300 mx-2"></div>
          <StepIndicator number={4} label="Complete" active={step === 'processing' || step === 'complete'} completed={step === 'complete'} />
        </div>

        {/* Step Content */}
        {step === 'amount' && (
          <AmountStep
            amount={amount}
            onAmountChange={handleAmountChange}
            error={error}
            remaining={remaining}
            energyCapacity={project.energyCapacity || 0}
          />
        )}

        {step === 'wallet' && (
          <WalletStep connected={connected} connecting={connecting} />
        )}

        {step === 'confirm' && (
          <ConfirmStep
            amount={parseFloat(amount)}
            project={project}
            walletAddress={publicKey?.toString() || ''}
          />
        )}

        {step === 'processing' && (
          <ProcessingStep />
        )}

        {step === 'complete' && (
          <CompleteStep
            amount={parseFloat(amount)}
            txHash={txHash}
            projectTitle={project.title}
          />
        )}

        {step === 'error' && (
          <ErrorStep
            error={error}
            onRetry={() => setStep('amount')}
          />
        )}

        {/* Navigation Buttons */}
        {['amount', 'wallet', 'confirm'].includes(step) && (
          <div className="flex gap-3 mt-6">
            {step !== 'amount' && (
              <button
                onClick={() => setStep(step === 'wallet' ? 'amount' : step === 'confirm' ? (connected ? 'amount' : 'wallet') : 'amount')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={(step === 'wallet' && !connected) || (step === 'amount' && (!amount || !!error))}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {step === 'confirm' ? 'Confirm & Fund' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Step Components */

function AmountStep({ amount, onAmountChange, error, remaining, energyCapacity }: any) {
  const numAmount = parseFloat(amount) || 0;
  const estimatedROI = (numAmount > 0 && energyCapacity > 0) 
    ? ((energyCapacity * 8760 * 0.25 * 0.12) / numAmount * 100).toFixed(2)
    : '0';
  const energyContribution = energyCapacity > 0 && remaining > 0
    ? ((numAmount / remaining) * energyCapacity).toFixed(2)
    : '0';

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Investment Amount (USDC)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-3.5 text-gray-500">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="0.00"
            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"
            min="10"
            step="10"
          />
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
        <p className="mt-2 text-xs text-gray-500">
          Minimum: $10 • Maximum: ${Math.min(remaining, 100000).toLocaleString()}
        </p>
      </div>

      {/* Quick Amount Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {[50, 100, 500, 1000].map(amt => (
          <button
            key={amt}
            onClick={() => onAmountChange(amt.toString())}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            ${amt}
          </button>
        ))}
      </div>

      {/* WO-66: Investment Impact Display */}
      {numAmount > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">Your Investment Impact</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Estimated Annual ROI</div>
              <div className="text-2xl font-bold text-green-600">{estimatedROI}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Energy Contribution</div>
              <div className="text-2xl font-bold text-blue-600">{energyContribution} kW</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WalletStep({ connected, connecting }: any) {
  return (
    <div className="text-center py-8">
      <div className="text-6xl mb-4">👛</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Connect Your Wallet</h3>
      <p className="text-gray-600 mb-6">
        Connect your Solana wallet to proceed with the investment
      </p>
      
      <div className="flex justify-center">
        <WalletMultiButton />
      </div>

      {connecting && (
        <p className="mt-4 text-sm text-gray-500">Connecting...</p>
      )}
      
      {connected && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">✓ Wallet connected successfully!</p>
        </div>
      )}
    </div>
  );
}

function ConfirmStep({ amount, project, walletAddress }: any) {
  const gasFee = 0.000005; // Typical Solana fee

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Investment</h3>
        <p className="text-gray-600">Review your investment details before confirming</p>
      </div>

      <div className="border border-gray-200 rounded-lg divide-y">
        <ConfirmRow label="Project" value={project.title} />
        <ConfirmRow label="Investment Amount" value={`$${amount.toLocaleString()} USDC`} highlight />
        <ConfirmRow label="Network Fee" value={`~${gasFee} SOL`} />
        <ConfirmRow label="Total" value={`$${amount.toLocaleString()} USDC + fees`} />
        <ConfirmRow label="Your Wallet" value={`${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`} />
        <ConfirmRow label="New Project Total" value={`$${(project.currentAmount + amount).toLocaleString()}`} />
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          ⚠️ <strong>Important:</strong> Funds will be held in escrow and released to project creators upon milestone completion verification.
        </p>
      </div>
    </div>
  );
}

function ProcessingStep() {
  return (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-6"></div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Processing Transaction</h3>
      <p className="text-gray-600 mb-4">Please wait while we confirm your investment on the Solana blockchain...</p>
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        <span>This may take a few seconds</span>
      </div>
    </div>
  );
}

function CompleteStep({ amount, txHash, projectTitle }: any) {
  return (
    <div className="text-center py-8">
      <div className="text-6xl mb-4">🎉</div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Investment Successful!</h3>
      <p className="text-gray-600 mb-6">
        You&apos;ve successfully invested ${amount.toLocaleString()} USDC in {projectTitle}
      </p>

      <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
        <div className="text-sm text-gray-600 mb-1">Transaction Hash</div>
        <div className="font-mono text-xs text-gray-800 break-all">{txHash}</div>
        <a
          href={`https://explorer.solana.com/tx/${txHash}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
        >
          View on Solana Explorer →
        </a>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-700">✓ Funds held in secure escrow</p>
        <p className="text-sm text-gray-700">✓ Released upon milestone completion</p>
        <p className="text-sm text-gray-700">✓ Track your investment in your portfolio</p>
      </div>
    </div>
  );
}

function ErrorStep({ error, onRetry }: any) {
  return (
    <div className="text-center py-8">
      <div className="text-6xl mb-4">⚠️</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Transaction Failed</h3>
      <p className="text-gray-600 mb-6">{error}</p>

      <button
        onClick={onRetry}
        className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
      >
        Try Again
      </button>
    </div>
  );
}

function StepIndicator({ number, label, active, completed }: any) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
        completed ? 'bg-green-600 text-white' :
        active ? 'bg-blue-600 text-white' :
        'bg-gray-300 text-gray-600'
      }`}>
        {completed ? '✓' : number}
      </div>
      <div className="text-xs mt-2 font-medium text-gray-600">{label}</div>
    </div>
  );
}

function ConfirmRow({ label, value, highlight }: any) {
  return (
    <div className={`px-4 py-3 flex justify-between ${highlight ? 'bg-green-50' : ''}`}>
      <span className="text-gray-600">{label}</span>
      <span className={`font-medium ${highlight ? 'text-green-600 text-lg' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  );
}

