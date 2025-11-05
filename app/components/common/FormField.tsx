/**
 * FormField Component
 * 
 * Reusable form field component with:
 * - Label with required indicator
 * - Error message display
 * - Help tooltip
 * - Character counter
 * - Flexible input types
 */

import React, { ReactNode } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

export interface FormFieldProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  helpText?: string;
  maxLength?: number;
  currentLength?: number;
  children: ReactNode;
  className?: string;
}

export default function FormField({
  label,
  name,
  error,
  required = false,
  helpText,
  maxLength,
  currentLength,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label with required indicator and help tooltip */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-900"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" title="Required field">
              *
            </span>
          )}
        </label>
        
        {helpText && (
          <div className="group relative">
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Help"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
            <div className="hidden group-hover:block absolute right-0 top-6 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
              <div className="absolute -top-1 right-2 w-2 h-2 bg-gray-900 transform rotate-45" />
              {helpText}
            </div>
          </div>
        )}
      </div>

      {/* Input Field */}
      <div className="relative">
        {children}
      </div>

      {/* Character Counter */}
      {maxLength && currentLength !== undefined && (
        <div className="flex justify-end">
          <span
            className={`text-xs ${
              currentLength > maxLength
                ? 'text-red-600 font-semibold'
                : currentLength > maxLength * 0.9
                ? 'text-orange-600'
                : 'text-gray-500'
            }`}
          >
            {currentLength} / {maxLength}
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600">
          <svg
            className="w-4 h-4 mt-0.5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}






