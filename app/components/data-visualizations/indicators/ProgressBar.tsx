/**
 * Progress Bar
 * 
 * Reusable progress bar component with customizable appearance
 */

import React from 'react';

export interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'gradient';
  showLabel?: boolean;
  label?: string;
  className?: string;
  animated?: boolean;
}

const SIZE_CLASSES = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

const VARIANT_CLASSES = {
  default: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
  gradient: 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500',
};

export default function ProgressBar({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  className = '',
  animated = false,
}: ProgressBarProps) {
  // Calculate percentage
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  // Determine variant based on percentage if not explicitly set
  const effectiveVariant = variant === 'default' && !label
    ? percentage >= 100
      ? 'success'
      : percentage >= 75
      ? 'default'
      : percentage >= 50
      ? 'warning'
      : 'danger'
    : variant;
  
  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {label || 'Progress'}
          </span>
          <span className="text-sm font-semibold text-gray-900">
            {percentage.toFixed(0)}%
          </span>
        </div>
      )}
      
      <div className={`relative w-full ${SIZE_CLASSES[size]} bg-gray-200 rounded-full overflow-hidden`}>
        <div
          className={`h-full ${VARIANT_CLASSES[effectiveVariant]} rounded-full transition-all duration-500 ease-out ${
            animated ? 'animate-pulse' : ''
          }`}
          style={{ width: `${percentage}%` }}
        >
          {animated && (
            <div className="absolute inset-0 bg-white opacity-30 animate-shimmer" />
          )}
        </div>
      </div>
      
      {!showLabel && percentage === 100 && (
        <div className="flex items-center gap-1 mt-1">
          <svg
            className="w-4 h-4 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="text-xs font-medium text-green-600">Complete</span>
        </div>
      )}
    </div>
  );
}




