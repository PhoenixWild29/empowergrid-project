/**
 * Milestone Guidance
 * 
 * WO-113: Provide guidance on acceptable verification evidence
 */

import React from 'react';

interface MilestoneGuidanceProps {
  milestoneType: string;
}

export default function MilestoneGuidance({ milestoneType }: MilestoneGuidanceProps) {
  const guidanceByType: Record<string, any> = {
    ENERGY_PRODUCTION: {
      title: 'Energy Production Milestone',
      requirements: [
        'Upload energy meter readings or dashboard screenshots',
        'Provide link to online energy monitoring dashboard',
        'Include timestamped production data',
        'Ensure data covers the entire milestone period',
      ],
      examples: [
        'Solar panel monitoring system exports (PDF)',
        'Energy meter photos with timestamps',
        'Link to utility company production portal',
        'Third-party verification reports',
      ],
    },
    INSTALLATION_COMPLETE: {
      title: 'Installation Completion Milestone',
      requirements: [
        'Upload photos of completed installation',
        'Provide installation completion certificate',
        'Include inspector sign-off documentation',
        'Upload final inspection report',
      ],
      examples: [
        'Photos from multiple angles',
        'Contractor completion certificate',
        'Government inspection approval',
        'Safety compliance documentation',
      ],
    },
    EQUIPMENT_OPERATIONAL: {
      title: 'Equipment Operational Milestone',
      requirements: [
        'Upload equipment test results',
        'Provide operational status reports',
        'Include performance metrics',
        'Show system monitoring data',
      ],
      examples: [
        'System diagnostic reports',
        'Performance test results',
        'Monitoring dashboard screenshots',
        'Operational status certificates',
      ],
    },
  };

  const guidance = guidanceByType[milestoneType] || guidanceByType.ENERGY_PRODUCTION;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-start space-x-3">
        <div className="text-2xl">📋</div>
        <div className="flex-1">
          <h4 className="font-semibold text-blue-900 mb-2">{guidance.title} - Verification Guide</h4>
          
          <div className="mb-4">
            <div className="text-sm font-medium text-blue-900 mb-2">Required Evidence:</div>
            <ul className="space-y-1">
              {guidance.requirements.map((req: string, idx: number) => (
                <li key={idx} className="text-sm text-blue-800 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-sm font-medium text-blue-900 mb-2">Acceptable Examples:</div>
            <div className="flex flex-wrap gap-2">
              {guidance.examples.map((example: string, idx: number) => (
                <span key={idx} className="px-2 py-1 bg-white text-blue-800 text-xs rounded border border-blue-200">
                  {example}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 text-xs text-blue-700">
            ℹ️ Oracle service will automatically verify energy production data if available
          </div>
        </div>
      </div>
    </div>
  );
}



