/**
 * Milestone Templates Component
 * 
 * Pre-configured milestone sets for common project types
 */

import React from 'react';
import { Milestone } from '../../types/projectCreation';

export interface MilestoneTemplate {
  id: string;
  name: string;
  projectType: string;
  description: string;
  milestones: Omit<Milestone, 'deadline'>[];
}

const TEMPLATES: MilestoneTemplate[] = [
  {
    id: 'solar-standard',
    name: 'Solar Installation (Standard)',
    projectType: 'Solar',
    description: '4-milestone solar project with typical phases',
    milestones: [
      {
        title: 'Site Preparation & Permitting',
        description: 'Complete site assessment, obtain permits, and prepare installation area',
        energyTarget: 0,
        deliverables: 'Building permits, environmental clearances, site preparation complete',
      },
      {
        title: 'Equipment Procurement & Installation',
        description: 'Acquire panels, inverters, and mounting equipment; complete installation',
        energyTarget: 50000,
        deliverables: 'Solar panels installed, inverters connected, mounting complete',
      },
      {
        title: 'Grid Connection & Commissioning',
        description: 'Connect to utility grid and commission system for operation',
        energyTarget: 100000,
        deliverables: 'Grid interconnection complete, system commissioned, initial production verified',
      },
      {
        title: 'Performance Verification',
        description: 'Monitor system performance and verify production targets',
        energyTarget: 150000,
        deliverables: 'Performance data collected, targets met, final inspection passed',
      },
    ],
  },
  {
    id: 'wind-standard',
    name: 'Wind Farm (Standard)',
    projectType: 'Wind',
    description: '5-milestone wind farm with typical development phases',
    milestones: [
      {
        title: 'Site Assessment & Permits',
        description: 'Wind resource assessment, environmental studies, permitting',
        energyTarget: 0,
        deliverables: 'Wind data collected, permits obtained, site access secured',
      },
      {
        title: 'Foundation & Infrastructure',
        description: 'Turbine foundations, access roads, electrical infrastructure',
        energyTarget: 0,
        deliverables: 'Foundations complete, roads built, electrical infrastructure ready',
      },
      {
        title: 'Turbine Installation',
        description: 'Transport and install wind turbines',
        energyTarget: 200000,
        deliverables: 'Turbines installed, nacelles mounted, blades attached',
      },
      {
        title: 'Grid Connection',
        description: 'Connect to utility grid and begin operations',
        energyTarget: 500000,
        deliverables: 'Grid interconnection complete, turbines operational',
      },
      {
        title: 'Ramp-Up & Optimization',
        description: 'Optimize turbine performance and reach full capacity',
        energyTarget: 1000000,
        deliverables: 'Full capacity production, performance optimized',
      },
    ],
  },
  {
    id: 'battery-storage',
    name: 'Battery Storage System',
    projectType: 'Hybrid',
    description: '3-milestone battery energy storage system',
    milestones: [
      {
        title: 'Site Development & Equipment Procurement',
        description: 'Prepare site and acquire battery systems',
        energyTarget: 0,
        deliverables: 'Site ready, batteries procured, permits obtained',
      },
      {
        title: 'System Installation',
        description: 'Install battery systems, inverters, and control systems',
        energyTarget: 50000,
        deliverables: 'Batteries installed, control systems configured, safety systems active',
      },
      {
        title: 'Grid Integration & Operations',
        description: 'Connect to grid and begin energy storage operations',
        energyTarget: 100000,
        deliverables: 'Grid interconnection complete, operations verified, performance targets met',
      },
    ],
  },
];

export interface MilestoneTemplatesProps {
  onSelectTemplate: (milestones: Milestone[]) => void;
  projectType?: string;
}

export default function MilestoneTemplates({
  onSelectTemplate,
  projectType,
}: MilestoneTemplatesProps) {
  const [expanded, setExpanded] = React.useState(false);

  // Filter templates by project type if specified
  const filteredTemplates = projectType
    ? TEMPLATES.filter((t) => t.projectType === projectType)
    : TEMPLATES;

  const handleSelectTemplate = (template: MilestoneTemplate) => {
    // Convert template milestones to full Milestone objects with deadlines
    const now = new Date();
    const milestones: Milestone[] = template.milestones.map((m, index) => {
      const deadline = new Date(now);
      deadline.setDate(deadline.getDate() + (index + 1) * 30); // 30 days apart

      return {
        ...m,
        deadline: deadline.toISOString().split('T')[0],
      };
    });

    onSelectTemplate(milestones);
    setExpanded(false);
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <svg
            className="w-6 h-6 text-purple-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              Use Milestone Template
            </h4>
            <p className="text-xs text-gray-600 mt-0.5">
              Quick start with pre-configured milestone sets
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-600 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {filteredTemplates.length === 0 ? (
            <p className="text-sm text-gray-600 text-center py-4">
              No templates available for this project type
            </p>
          ) : (
            filteredTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => handleSelectTemplate(template)}
                className="w-full bg-white border border-gray-200 rounded-lg p-4 text-left hover:border-purple-500 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h5 className="text-sm font-semibold text-gray-900 mb-1">
                      {template.name}
                    </h5>
                    <p className="text-xs text-gray-600 mb-2">
                      {template.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{template.milestones.length} milestones</span>
                      <span>•</span>
                      <span>{template.projectType}</span>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-purple-600 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}




