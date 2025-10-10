/**
 * Transaction Validation Component
 * 
 * WO-103: Enhanced validation for secure transactions
 * 
 * Features:
 * - Multi-step confirmation
 * - Clear summaries
 * - Amount/recipient verification
 * - Fee disclosure
 */

'use client';

import React, { useState } from 'react';

interface TransactionValidationProps {
  transaction: {
    amount: number;
    recipient: string;
    projectTitle: string;
    fees: {
      network: number;
      platform: number;
    };
  };
  onConfirm: () => void;
  onCancel: () => void;
}

export default function TransactionValidation({
  transaction,
  onConfirm,
  onCancel,
}: TransactionValidationProps) {
  const [step, setStep] = useState(1);
  const [confirmations, setConfirmations] = useState({
    amount: false,
    recipient: false,
    fees: false,
    final: false,
  });

  const totalAmount = transaction.amount + transaction.fees.network + transaction.fees.platform;

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onConfirm();
    }
  };

  const canProceed = () => {
    if (step === 1) return confirmations.amount;
    if (step === 2) return confirmations.recipient && confirmations.fees;
    if (step === 3) return confirmations.final;
    return false;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <span>✓</span> Transaction Validation
        </h2>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded ${
                s === step ? 'bg-blue-600' : s < step ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-2">Step {step} of 3</p>
      </div>

      {/* Step 1: Amount Verification */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Verify Investment Amount</h3>
          
          <div className="p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
            <div className="text-sm text-gray-600 mb-2">You are investing</div>
            <div className="text-4xl font-bold text-blue-600 mb-4">
              ${transaction.amount.toLocaleString()} USDC
            </div>
            <div className="text-sm text-gray-600">
              in <span className="font-semibold text-gray-900">{transaction.projectTitle}</span>
            </div>
          </div>

          <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={confirmations.amount}
              onChange={(e) => setConfirmations({ ...confirmations, amount: e.target.checked })}
              className="mt-1"
            />
            <div>
              <div className="font-medium text-gray-900">I confirm this amount is correct</div>
              <div className="text-sm text-gray-600">
                This transaction cannot be reversed once confirmed
              </div>
            </div>
          </label>
        </div>
      )}

      {/* Step 2: Recipient & Fees */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Verify Transaction Details</h3>

          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Project:</span>
              <span className="font-medium text-gray-900">{transaction.projectTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Recipient Address:</span>
              <span className="font-mono text-xs text-gray-900">
                {transaction.recipient.slice(0, 8)}...{transaction.recipient.slice(-8)}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Investment Amount:</span>
                <span className="text-gray-900">${transaction.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Network Fee:</span>
                <span className="text-gray-900">${transaction.fees.network.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Platform Fee (2%):</span>
                <span className="text-gray-900">${transaction.fees.platform.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-gray-300 pt-2">
                <span>Total Amount:</span>
                <span className="text-blue-600">${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={confirmations.recipient}
              onChange={(e) => setConfirmations({ ...confirmations, recipient: e.target.checked })}
              className="mt-1"
            />
            <div>
              <div className="font-medium text-gray-900">I confirm the recipient details</div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={confirmations.fees}
              onChange={(e) => setConfirmations({ ...confirmations, fees: e.target.checked })}
              className="mt-1"
            />
            <div>
              <div className="font-medium text-gray-900">I understand the fees</div>
              <div className="text-sm text-gray-600">
                Total transaction cost: ${totalAmount.toFixed(2)}
              </div>
            </div>
          </label>
        </div>
      )}

      {/* Step 3: Final Confirmation */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Final Confirmation</h3>

          <div className="p-6 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <div className="font-bold text-gray-900 mb-2">Important Notice</div>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Blockchain transactions are irreversible</li>
                  <li>Funds will be locked in escrow until milestones are met</li>
                  <li>You cannot cancel this transaction once confirmed</li>
                  <li>Review all details carefully before proceeding</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="font-medium text-blue-900 mb-3">Transaction Summary:</div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Amount:</span>
                <span className="font-medium text-blue-900">${transaction.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Project:</span>
                <span className="font-medium text-blue-900">{transaction.projectTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Total Cost:</span>
                <span className="font-bold text-blue-900">${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <label className="flex items-start gap-3 p-4 border-2 border-red-200 rounded-lg cursor-pointer hover:bg-red-50">
            <input
              type="checkbox"
              checked={confirmations.final}
              onChange={(e) => setConfirmations({ ...confirmations, final: e.target.checked })}
              className="mt-1"
            />
            <div>
              <div className="font-medium text-gray-900">
                I have reviewed all details and authorize this transaction
              </div>
              <div className="text-sm text-gray-600">
                I understand this action is irreversible
              </div>
            </div>
          </label>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={step === 1 ? onCancel : () => setStep(step - 1)}
          className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
        >
          {step === 1 ? 'Cancel' : 'Back'}
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed()}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {step === 3 ? 'Confirm Transaction' : 'Next'}
        </button>
      </div>
    </div>
  );
}


