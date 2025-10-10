import React, { useState } from 'react';
import FeedbackModal from './FeedbackModal';

/**
 * Floating feedback button that opens the feedback modal
 * Can be placed globally in the application
 */
export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        title="Send Feedback"
        aria-label="Send Feedback"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
      </button>

      {/* Feedback Modal */}
      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

