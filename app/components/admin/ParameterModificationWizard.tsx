/**
 * Parameter Modification Wizard
 * 
 * WO-94: Multi-step wizard for contract parameter updates
 * 
 * Features:
 * - Step-by-step validation
 * - Change preview
 * - Confirmation dialogs
 * - Integration with Parameter Update API
 */

import React, { useState } from 'react';

interface ParameterModificationWizardProps {
  contractId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ParameterModificationWizard({
  contractId,
  onClose,
  onSuccess,
}: ParameterModificationWizardProps) {
  const [step, setStep] = useState(1);
  const [changeType, setChangeType] = useState('');
  const [parameters, setParameters] = useState<any>({});
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // WO-94: Change types available
  const changeTypes = [
    { value: 'MILESTONE_UPDATE', label: 'Update Milestone', description: 'Modify milestone targets or amounts' },
    { value: 'MILESTONE_REORDER', label: 'Reorder Milestones', description: 'Change milestone sequence' },
    { value: 'TIMELINE_ADJUSTMENT', label: 'Adjust Timeline', description: 'Modify milestone due dates' },
    { value: 'ORACLE_CONFIGURATION', label: 'Oracle Configuration', description: 'Update oracle settings' },
    { value: 'SIGNER_UPDATE', label: 'Update Signers', description: 'Add or remove authorized signers' },
    { value: 'THRESHOLD_UPDATE', label: 'Update Threshold', description: 'Change signature requirements' },
    { value: 'TARGET_AMOUNT_UPDATE', label: 'Update Target Amount', description: 'Adjust funding target' },
  ];

  // WO-94: Step 1 - Select Change Type
  const renderStepOne = () => (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Select Modification Type</h3>
      <p className="text-gray-600 mb-6">Choose the type of parameter you want to modify</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {changeTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => {
              setChangeType(type.value);
              setStep(2);
            }}
            className={`p-4 border-2 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition ${
              changeType === type.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <div className="font-medium text-gray-900">{type.label}</div>
            <div className="text-sm text-gray-600 mt-1">{type.description}</div>
          </button>
        ))}
      </div>
    </div>
  );

  // WO-94: Step 2 - Enter Parameters
  const renderStepTwo = () => (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Enter New Parameters</h3>
      <p className="text-gray-600 mb-6">
        Modification Type: <span className="font-medium">{changeTypes.find(t => t.value === changeType)?.label}</span>
      </p>

      {/* Dynamic parameter inputs based on change type */}
      {changeType === 'ORACLE_CONFIGURATION' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Oracle Authority Address
            </label>
            <input
              type="text"
              value={parameters.oracleAuthority || ''}
              onChange={(e) => setParameters({ ...parameters, oracleAuthority: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Solana address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Confidence (0-1)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={parameters.minConfidence || ''}
              onChange={(e) => setParameters({ ...parameters, minConfidence: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="0.8"
            />
          </div>
        </div>
      )}

      {changeType === 'THRESHOLD_UPDATE' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Signature Threshold
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={parameters.newThreshold || ''}
            onChange={(e) => setParameters({ ...parameters, newThreshold: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            placeholder="Enter new threshold"
          />
          <p className="text-sm text-gray-500 mt-2">
            Number of signatures required to approve future changes
          </p>
        </div>
      )}

      {changeType === 'SIGNER_UPDATE' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action
            </label>
            <select
              value={parameters.action || ''}
              onChange={(e) => setParameters({ ...parameters, action: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select action</option>
              <option value="ADD">Add Signer</option>
              <option value="REMOVE">Remove Signer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Signer Address
            </label>
            <input
              type="text"
              value={parameters.signerAddress || ''}
              onChange={(e) => setParameters({ ...parameters, signerAddress: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Solana wallet address"
            />
          </div>
        </div>
      )}

      {/* Generic parameter input for other types */}
      {!['ORACLE_CONFIGURATION', 'THRESHOLD_UPDATE', 'SIGNER_UPDATE'].includes(changeType) && (
        <div>
          <p className="text-gray-600 mb-4">
            Parameter modification for {changeType} - Enter details below
          </p>
          <textarea
            value={JSON.stringify(parameters, null, 2)}
            onChange={(e) => {
              try {
                setParameters(JSON.parse(e.target.value));
              } catch (err) {
                // Invalid JSON, don't update
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded font-mono text-sm"
            rows={8}
            placeholder='{"key": "value"}'
          />
        </div>
      )}

      {/* Reason */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reason for Modification (Required) *
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Provide detailed explanation (minimum 10 characters)"
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          {reason.length}/10 characters minimum
        </p>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setStep(1)}
          className="px-6 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={() => {
            if (reason.length < 10) {
              alert('Reason must be at least 10 characters');
              return;
            }
            setStep(3);
          }}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Preview Changes
        </button>
      </div>
    </div>
  );

  // WO-94: Step 3 - Preview and Confirm
  const renderStepThree = () => (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Preview Changes</h3>
      <p className="text-gray-600 mb-6">Review your proposed modifications before submission</p>

      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium text-gray-500">Change Type</div>
            <div className="text-lg text-gray-900">
              {changeTypes.find(t => t.value === changeType)?.label}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-500">Reason</div>
            <div className="text-gray-900">{reason}</div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-500">Parameters to Update</div>
            <pre className="mt-2 bg-white p-4 rounded border border-gray-200 text-sm overflow-x-auto">
              {JSON.stringify(parameters, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="font-medium text-red-800 mb-2">Validation Errors:</div>
          <ul className="list-disc list-inside space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="text-red-700 text-sm">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <span className="text-yellow-600 text-xl">⚠️</span>
          <div>
            <div className="font-medium text-yellow-800">Important</div>
            <div className="text-yellow-700 text-sm mt-1">
              This modification may require multi-signature approval. All stakeholders will be notified
              and must approve before changes take effect.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setStep(2)}
          className="px-6 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Modification'}
        </button>
      </div>
    </div>
  );

  // WO-94: Submit modification
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      const response = await fetch(`/api/escrow/contracts/${contractId}/parameters`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changeType,
          reason,
          expirationHours: 48,
          parameters,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Parameter modification submitted successfully!');
        onSuccess();
      } else {
        if (data.validationErrors) {
          setValidationErrors(data.validationErrors);
        } else {
          alert(data.message || 'Failed to submit modification');
        }
      }
    } catch (error) {
      console.error('[WO-94] Submission error:', error);
      alert('Failed to submit modification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Modify Contract Parameters</h2>
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
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  } font-semibold`}>
                    {s}
                  </div>
                  {s < 3 && (
                    <div className={`h-1 w-16 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>Select Type</span>
              <span>Enter Details</span>
              <span>Confirm</span>
            </div>
          </div>

          {/* Wizard Steps */}
          {step === 1 && renderStepOne()}
          {step === 2 && renderStepTwo()}
          {step === 3 && renderStepThree()}
        </div>
      </div>
    </div>
  );
}



