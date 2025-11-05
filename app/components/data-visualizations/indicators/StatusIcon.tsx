/**
 * Status Icon
 * 
 * Reusable status icon component
 */

import React from 'react';

export type IconStatus =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'pending'
  | 'active'
  | 'completed';

export interface StatusIconProps {
  status: IconStatus;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withBackground?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const BG_SIZE_CLASSES = {
  sm: 'p-1',
  md: 'p-2',
  lg: 'p-3',
  xl: 'p-4',
};

export default function StatusIcon({
  status,
  size = 'md',
  withBackground = false,
  className = '',
}: StatusIconProps) {
  const renderIcon = () => {
    switch (status) {
      case 'success':
      case 'completed':
        return (
          <svg
            className={`${SIZE_CLASSES[size]} ${withBackground ? 'text-white' : 'text-green-600'} ${className}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      
      case 'warning':
        return (
          <svg
            className={`${SIZE_CLASSES[size]} ${withBackground ? 'text-white' : 'text-yellow-600'} ${className}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      
      case 'error':
        return (
          <svg
            className={`${SIZE_CLASSES[size]} ${withBackground ? 'text-white' : 'text-red-600'} ${className}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      
      case 'info':
        return (
          <svg
            className={`${SIZE_CLASSES[size]} ${withBackground ? 'text-white' : 'text-blue-600'} ${className}`}
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
        );
      
      case 'pending':
        return (
          <svg
            className={`${SIZE_CLASSES[size]} ${withBackground ? 'text-white' : 'text-gray-600'} ${className} animate-spin`}
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      
      case 'active':
        return (
          <svg
            className={`${SIZE_CLASSES[size]} ${withBackground ? 'text-white' : 'text-green-600'} ${className}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="4" className="animate-pulse" />
          </svg>
        );
      
      default:
        return null;
    }
  };
  
  const getBackgroundColor = () => {
    switch (status) {
      case 'success':
      case 'completed':
        return 'bg-green-100';
      case 'warning':
        return 'bg-yellow-100';
      case 'error':
        return 'bg-red-100';
      case 'info':
        return 'bg-blue-100';
      case 'pending':
        return 'bg-gray-100';
      case 'active':
        return 'bg-green-100';
      default:
        return 'bg-gray-100';
    }
  };
  
  if (withBackground) {
    return (
      <div className={`inline-flex items-center justify-center rounded-full ${getBackgroundColor()} ${BG_SIZE_CLASSES[size]}`}>
        {renderIcon()}
      </div>
    );
  }
  
  return renderIcon();
}






