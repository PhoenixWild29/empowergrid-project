/**
 * Emergency Action Card
 * 
 * WO-101: Display emergency action with consequences
 */

import React from 'react';

interface EmergencyActionCardProps {
  action: {
    id: string;
    title: string;
    description: string;
    icon: string;
    severity: 'HIGH' | 'CRITICAL';
    color: string;
    consequences: string[];
  };
  onInitiate: () => void;
}

export default function EmergencyActionCard({ action, onInitiate }: EmergencyActionCardProps) {
  const colorClasses = {
    yellow: 'border-yellow-500 bg-yellow-50',
    red: 'border-red-500 bg-red-50',
    purple: 'border-purple-500 bg-purple-50',
  }[action.color] || 'border-gray-500 bg-gray-50';

  const buttonClasses = {
    yellow: 'bg-yellow-600 hover:bg-yellow-700',
    red: 'bg-red-600 hover:bg-red-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
  }[action.color] || 'bg-gray-600 hover:bg-gray-700';

  return (
    <div className={'border-2 rounded-lg p-6 ' + colorClasses}>
      <div className="flex items-start space-x-4">
        <div className="text-4xl">{action.icon}</div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-bold text-gray-900">{action.title}</h3>
            <span className={'px-2 py-1 text-xs font-bold rounded ' + (
              action.severity === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'
            )}>
              {action.severity}
            </span>
          </div>
          
          <p className="text-gray-700 mb-4">{action.description}</p>

          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-900 mb-2">Consequences:</div>
            <ul className="space-y-1">
              {action.consequences.map((consequence, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  <span>{consequence}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={onInitiate}
            className={'w-full text-white px-6 py-3 rounded-lg font-medium ' + buttonClasses}
          >
            Initiate {action.title}
          </button>
        </div>
      </div>
    </div>
  );
}



