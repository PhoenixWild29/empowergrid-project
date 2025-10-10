/**
 * Milestone Status Display
 * 
 * WO-113: Visual indicators for verification status
 */

import React from 'react';

interface MilestoneStatusDisplayProps {
  milestone: any;
}

export default function MilestoneStatusDisplay({ milestone }: MilestoneStatusDisplayProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          color: 'gray',
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: '○',
          message: 'Not yet submitted for verification',
        };
      case 'SUBMITTED':
        return {
          color: 'blue',
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          icon: '⏳',
          message: 'Submitted - Awaiting verification',
        };
      case 'APPROVED':
        return {
          color: 'green',
          bg: 'bg-green-100',
          text: 'text-green-800',
          icon: '✓',
          message: 'Verified and approved',
        };
      case 'REJECTED':
        return {
          color: 'red',
          bg: 'bg-red-100',
          text: 'text-red-800',
          icon: '✗',
          message: 'Verification rejected',
        };
      case 'RELEASED':
        return {
          color: 'purple',
          bg: 'bg-purple-100',
          text: 'text-purple-800',
          icon: '✓',
          message: 'Funds released',
        };
      default:
        return {
          color: 'gray',
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: '?',
          message: 'Unknown status',
        };
    }
  };

  const config = getStatusConfig(milestone.status);

  return (
    <div className={'rounded-lg border-2 p-6 ' + config.bg + ' border-' + config.color + '-300'}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-4xl">{config.icon}</div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{milestone.title}</h3>
            <p className={'text-sm font-medium mt-1 ' + config.text}>{config.message}</p>
          </div>
        </div>

        <div className={'px-4 py-2 rounded-full font-medium ' + config.bg + ' ' + config.text}>
          {milestone.status}
        </div>
      </div>

      {/* Progress Info */}
      {milestone.energyTarget && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Target Energy</div>
              <div className="font-bold text-gray-900">{milestone.energyTarget.toLocaleString()} kWh</div>
            </div>
            <div>
              <div className="text-gray-600">Target Amount</div>
              <div className="font-bold text-gray-900">${milestone.targetAmount.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-600">Due Date</div>
              <div className="font-bold text-gray-900">{new Date(milestone.dueDate).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



