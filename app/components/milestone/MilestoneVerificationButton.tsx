/**
 * Milestone Verification Button
 * 
 * WO-113: Call-to-action button for initiating verification
 */

import React from 'react';

interface MilestoneVerificationButtonProps {
  onSubmit: () => void;
  isDisabled: boolean;
  isSubmitting: boolean;
}

export default function MilestoneVerificationButton({
  onSubmit,
  isDisabled,
  isSubmitting,
}: MilestoneVerificationButtonProps) {
  return (
    <div>
      <button
        onClick={onSubmit}
        disabled={isDisabled}
        className={'w-full px-6 py-4 rounded-lg font-semibold transition ' + (
          isDisabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        )}
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Submitting Verification...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <span>✓</span>
            <span>Submit Milestone Verification</span>
          </div>
        )}
      </button>

      {isDisabled && !isSubmitting && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          Please upload at least one evidence file or add an evidence link
        </div>
      )}
    </div>
  );
}



