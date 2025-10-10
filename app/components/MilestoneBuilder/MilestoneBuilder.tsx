/**
 * Milestone Builder Component
 * 
 * Main component for dynamic milestone management with:
 * - Add/remove milestones
 * - Drag-and-drop reordering
 * - Real-time validation
 * - Templates
 * - Timeline visualization
 * - Auto-calculation of totals
 */

import React, { useState } from 'react';
import { Milestone } from '../../types/projectCreation';
import MilestoneTemplates from './MilestoneTemplates';
import MilestoneSummary from './MilestoneSummary';
import { validateMilestoneConsistency } from '../../utils/milestoneValidation';

export interface MilestoneBuilderProps {
  milestones: Milestone[];
  onChange: (milestones: Milestone[]) => void;
  projectCapacity: number;
  projectFunding: number;
  projectType?: string;
}

export default function MilestoneBuilder({
  milestones,
  onChange,
  projectCapacity,
  projectFunding,
  projectType,
}: MilestoneBuilderProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }>({ valid: true, errors: [], warnings: [] });

  // Validate milestones
  React.useEffect(() => {
    const result = validateMilestoneConsistency(milestones, projectCapacity, projectFunding);
    setValidationResult(result);
  }, [milestones, projectCapacity, projectFunding]);

  // Add new milestone
  const addMilestone = () => {
    const newMilestone: Milestone = {
      title: '',
      description: '',
      energyTarget: 0,
      deadline: '',
      deliverables: '',
      order: milestones.length,
    };

    onChange([...milestones, newMilestone]);
  };

  // Remove milestone
  const removeMilestone = (index: number) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${milestones[index].title || `Milestone ${index + 1}`}"?`
    );

    if (confirmed) {
      const newMilestones = milestones.filter((_, i) => i !== index);
      // Update order
      newMilestones.forEach((m, i) => (m.order = i));
      onChange(newMilestones);
    }
  };

  // Update milestone
  const updateMilestone = (index: number, field: keyof Milestone, value: any) => {
    const newMilestones = [...milestones];
    newMilestones[index] = { ...newMilestones[index], [field]: value };
    onChange(newMilestones);
  };

  // Drag handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === index) return;

    const newMilestones = [...milestones];
    const draggedItem = newMilestones[draggedIndex];
    
    newMilestones.splice(draggedIndex, 1);
    newMilestones.splice(index, 0, draggedItem);
    
    // Update order
    newMilestones.forEach((m, i) => (m.order = i));
    
    onChange(newMilestones);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Apply template
  const handleTemplateSelect = (templateMilestones: Milestone[]) => {
    const confirmed = milestones.length > 0
      ? window.confirm('This will replace all existing milestones. Continue?')
      : true;

    if (confirmed) {
      onChange(templateMilestones);
    }
  };

  return (
    <div className="space-y-6">
      {/* Templates */}
      <MilestoneTemplates
        onSelectTemplate={handleTemplateSelect}
        projectType={projectType}
      />

      {/* Summary */}
      <MilestoneSummary
        milestones={milestones}
        projectCapacity={projectCapacity}
        projectFunding={projectFunding}
        validationErrors={validationResult.errors}
        validationWarnings={validationResult.warnings}
      />

      {/* Milestone List Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Milestones ({milestones.length}/10)
        </h3>
        <button
          type="button"
          onClick={addMilestone}
          disabled={milestones.length >= 10}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Add Milestone
        </button>
      </div>

      {/* Milestone List */}
      <div className="space-y-4">
        {milestones.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            <p className="text-gray-600 font-medium mb-2">No milestones yet</p>
            <p className="text-sm text-gray-500 mb-4">
              Add your first milestone or select a template to get started
            </p>
          </div>
        ) : (
          milestones.map((milestone, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`bg-white border-2 rounded-lg p-6 transition-all cursor-move ${
                draggedIndex === index
                  ? 'border-blue-500 shadow-lg opacity-50'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {/* Milestone Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="w-1 h-1 bg-gray-400 rounded-full" />
                    <div className="w-1 h-1 bg-gray-400 rounded-full" />
                    <div className="w-1 h-1 bg-gray-400 rounded-full" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    Milestone {index + 1}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => removeMilestone(index)}
                  className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>

              {/* Milestone Fields (Simplified) */}
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Title:</span>{' '}
                  <span className="text-gray-900">{milestone.title || '(Not set)'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Energy Target:</span>{' '}
                  <span className="text-gray-900">
                    {milestone.energyTarget.toLocaleString()} kWh
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Deadline:</span>{' '}
                  <span className="text-gray-900">
                    {milestone.deadline || '(Not set)'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Drag Instructions */}
      {milestones.length > 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            💡 <span className="font-semibold">Tip:</span> Drag and drop milestones to reorder them.
            Milestones will be automatically resequenced.
          </p>
        </div>
      )}
    </div>
  );
}

