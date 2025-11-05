/**
 * Status Badge
 * 
 * Reusable color-coded status badge component
 */

import React from 'react';

export type StatusType =
  | 'DRAFT'
  | 'ACTIVE'
  | 'FUNDED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PENDING'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'RELEASED'
  | 'REJECTED';

export interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<StatusType, {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  icon: string;
}> = {
  DRAFT: {
    label: 'Draft',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
    icon: '📝',
  },
  ACTIVE: {
    label: 'Active',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300',
    icon: '🔵',
  },
  FUNDED: {
    label: 'Funded',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-300',
    icon: '💰',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-300',
    icon: '⚡',
  },
  COMPLETED: {
    label: 'Completed',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-300',
    icon: '✓',
  },
  CANCELLED: {
    label: 'Cancelled',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
    icon: '✕',
  },
  PENDING: {
    label: 'Pending',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-300',
    icon: '○',
  },
  SUBMITTED: {
    label: 'Submitted',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-300',
    icon: '◐',
  },
  APPROVED: {
    label: 'Approved',
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
    borderColor: 'border-green-300',
    icon: '◑',
  },
  RELEASED: {
    label: 'Released',
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
    borderColor: 'border-green-300',
    icon: '●',
  },
  REJECTED: {
    label: 'Rejected',
    bgColor: 'bg-red-100',
    textColor: 'text-red-600',
    borderColor: 'border-red-300',
    icon: '✕',
  },
};

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base',
};

export default function StatusBadge({
  status,
  size = 'md',
  showIcon = false,
  className = '',
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  
  if (!config) {
    return null;
  }
  
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor} ${SIZE_CLASSES[size]} ${className}`}
    >
      {showIcon && <span>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  );
}






