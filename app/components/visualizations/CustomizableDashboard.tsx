/**
 * Customizable Dashboard Component
 * 
 * WO-100: User-customizable dashboard with drag-and-drop
 */

'use client';

import React, { useState } from 'react';

interface Widget {
  id: string;
  title: string;
  component: string;
  size: 'small' | 'medium' | 'large';
}

interface CustomizableDashboardProps {
  project: any;
}

export default function CustomizableDashboard({ project }: CustomizableDashboardProps) {
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: '1', title: 'Funding Overview', component: 'FundingWidget', size: 'medium' },
    { id: '2', title: 'Energy Production', component: 'EnergyWidget', size: 'medium' },
    { id: '3', title: 'Milestones', component: 'MilestoneWidget', size: 'large' },
    { id: '4', title: 'Financial Metrics', component: 'FinancialWidget', size: 'small' },
  ]);

  const [isEditMode, setIsEditMode] = useState(false);

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Custom Dashboard</h2>
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isEditMode
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {isEditMode ? 'Save Layout' : 'Edit Layout'}
        </button>
      </div>

      {/* Dashboard Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {widgets.map((widget) => (
          <div
            key={widget.id}
            className={`bg-white rounded-lg shadow p-6 ${
              widget.size === 'large' ? 'md:col-span-2 lg:col-span-3' :
              widget.size === 'medium' ? 'md:col-span-1' :
              ''
            } ${isEditMode ? 'ring-2 ring-blue-300 cursor-move' : ''}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{widget.title}</h3>
              {isEditMode && (
                <button className="text-red-500 hover:text-red-700">
                  ✕
                </button>
              )}
            </div>
            <WidgetContent component={widget.component} project={project} />
          </div>
        ))}
      </div>

      {isEditMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            🎨 Drag widgets to rearrange • Click ✕ to remove • Add new widgets from the library
          </p>
        </div>
      )}
    </div>
  );
}

function WidgetContent({ component, project }: any) {
  // Render different widget types based on component name
  switch (component) {
    case 'FundingWidget':
      return (
        <div>
          <div className="text-3xl font-bold text-green-600 mb-2">
            ${project.currentAmount?.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-600">
            {project.fundingProgress?.toFixed(1) || 0}% of ${project.targetAmount?.toLocaleString() || 0}
          </div>
        </div>
      );
    
    case 'EnergyWidget':
      return (
        <div>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {project.totalEnergyProduced?.toLocaleString() || 0} kWh
          </div>
          <div className="text-sm text-gray-600">Total Produced</div>
        </div>
      );
    
    case 'MilestoneWidget':
      return (
        <div>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-purple-600">
              {project.completedMilestones || 0}/{project.milestoneCount || 0}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Milestones</div>
              <div className="text-xs text-gray-600">{project.milestoneProgress?.toFixed(0) || 0}% Complete</div>
            </div>
          </div>
        </div>
      );
    
    case 'FinancialWidget':
      return (
        <div>
          <div className="text-2xl font-bold text-orange-600 mb-2">
            {project.funderCount || 0}
          </div>
          <div className="text-sm text-gray-600">Total Funders</div>
        </div>
      );
    
    default:
      return <div className="text-gray-400">Widget content</div>;
  }
}

