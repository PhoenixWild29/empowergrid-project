/**
 * Emergency Confirmation Dialog
 * 
 * WO-101: Multi-step confirmation for emergency actions
 * 
 * Features:
 * - Detailed impact analysis
 * - Affected stakeholders display
 * - Typed confirmation requirement
 * - Multiple confirmation steps
 */

import React, { useState } from 'react';

interface EmergencyConfirmationDialogProps {
  action: any;
  contract: any;
  onClose: () => void;
  onConfirm: () => void;
}

export default function EmergencyConfirmationDialog({
  action,
  contract,
  onClose,
  onConfirm,
}: EmergencyConfirmationDialogProps) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [reason, setReason] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requiredConfirmationText = action.title.toUpperCase();

  // WO-101: Step 1 - Impact Analysis
  const renderStepOne = () => (
    <div>
      <h3 className="text-xl font-bold text-red-600 mb-4">⚠️ Impact Analysis</h3>
      
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="font-semibold text-red-900 mb-2">Critical Action</div>
        <p className="text-red-800 text-sm">
          You are about to initiate: <span className="font-bold">{action.title}</span>
        </p>
      </div>

      <div className="mb-6">
        <div className="text-sm font-medium text-gray-700 mb-3">Consequences:</div>
        <ul className="space-y-2">
          {action.consequences.map((consequence: string, idx: number) => (
            <li key={idx} className="flex items-start">
              <span className="text-red-600 mr-2 text-lg">•</span>
              <span className="text-gray-800">{consequence}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-6">
        <div className="text-sm font-medium text-gray-700 mb-3">Affected Stakeholders:</div>
        <div className="bg-gray-50 rounded p-4">
          <div className="text-sm text-gray-700">
            • Project Creator: {contract.project?.creator?.username || 'Unknown'}
          </div>
          <div className="text-sm text-gray-700 mt-1">
            • Total Funders: {contract.deposits?.length || 0}
          </div>
          <div className="text-sm text-gray-700 mt-1">
            • Authorized Signers: {contract.signers?.length || 0}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onClose}
          className="px-6 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={() => setStep(2)}
          className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Continue
        </button>
      </div>
    </div>
  );

  // WO-101: Step 2 - Enter Details
  const renderStepTwo = () => (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-4">Emergency Action Details</h3>

      {action.requiresAmount && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount to Release (USDC) *
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            max={contract.currentBalance}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500"
            placeholder="Enter amount"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum available: ${contract.currentBalance.toLocaleString()}
          </p>
        </div>
      )}

      {action.requiresRecipient && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Wallet Address *
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 font-mono text-sm"
            placeholder="Enter Solana wallet address"
            required
          />
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Detailed Justification (Required) *
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500"
          rows={4}
          placeholder="Provide detailed explanation for this emergency action (minimum 20 characters)"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          {reason.length}/20 characters minimum
        </p>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setStep(1)}
          className="px-6 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={() => {
            if (action.requiresAmount && !amount) {
              alert('Amount is required');
              return;
            }
            if (action.requiresRecipient && !recipient) {
              alert('Recipient address is required');
              return;
            }
            if (reason.length < 20) {
              alert('Justification must be at least 20 characters');
              return;
            }
            setStep(3);
          }}
          className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Continue
        </button>
      </div>
    </div>
  );

  // WO-101: Step 3 - Final Confirmation with Typed Text
  const renderStepThree = () => (
    <div>
      <h3 className="text-xl font-bold text-red-600 mb-4">🚨 Final Confirmation Required</h3>

      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-6">
        <div className="font-bold text-yellow-900 mb-2">⚠️ WARNING</div>
        <p className="text-yellow-800">
          This action cannot be undone. All stakeholders will be immediately notified.
          A time-lock period will be enforced before execution.
        </p>
      </div>

      <div className="mb-6">
        <div className="text-sm font-medium text-gray-700 mb-3">Summary:</div>
        <div className="bg-gray-50 rounded p-4 space-y-2 text-sm">
          <div><span className="font-medium">Action:</span> {action.title}</div>
          {amount && <div><span className="font-medium">Amount:</span> ${parseFloat(amount).toLocaleString()}</div>}
          {recipient && <div><span className="font-medium">Recipient:</span> <span className="font-mono text-xs">{recipient}</span></div>}
          <div><span className="font-medium">Reason:</span> {reason}</div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-red-700 mb-2">
          Type <span className="font-mono font-bold">{requiredConfirmationText}</span> to confirm *
        </label>
        <input
          type="text"
          value={confirmationText}
          onChange={(e) => setConfirmationText(e.target.value)}
          className="w-full px-4 py-2 border-2 border-red-300 rounded focus:ring-2 focus:ring-red-500"
          placeholder={requiredConfirmationText}
        />
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setStep(2)}
          className="px-6 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={confirmationText !== requiredConfirmationText || isSubmitting}
          className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Confirm Emergency Action'}
        </button>
      </div>
    </div>
  );

  // WO-101: Submit emergency action
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/escrow/contracts/${contract.contractId}/emergency-release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'INITIATE',
          releaseType: action.id,
          amount: amount ? parseFloat(amount) : undefined,
          recipient,
          reason,
          timeLockDelaySeconds: 24 * 60 * 60, // 24 hour time-lock
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Emergency action initiated successfully. Time-lock activated for 24 hours.');
        onConfirm();
      } else {
        alert(data.message || 'Failed to initiate emergency action');
      }
    } catch (error) {
      console.error('[WO-101] Submission error:', error);
      alert('Failed to initiate emergency action');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Emergency Action Confirmation</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                  <div className={'flex items-center justify-center w-10 h-10 rounded-full font-semibold ' + (
                    step >= s ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'
                  )}>
                    {s}
                  </div>
                  {s < 3 && (
                    <div className={'h-1 w-16 ' + (step > s ? 'bg-red-600' : 'bg-gray-200')}></div>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>Impact Analysis</span>
              <span>Details</span>
              <span>Confirm</span>
            </div>
          </div>

          {/* Steps */}
          {step === 1 && renderStepOne()}
          {step === 2 && renderStepTwo()}
          {step === 3 && renderStepThree()}
        </div>
      </div>
    </div>
  );
}



