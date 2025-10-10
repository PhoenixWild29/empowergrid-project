/**
 * Milestone Definition Step
 * 
 * Fourth step of the multi-step project creation form
 * 
 * Fields:
 * - Dynamic milestone creation (1-10 milestones)
 * - Energy production targets (kWh)
 * - Deadlines (date picker)
 * - Deliverable descriptions
 */

import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import FormField from '../../common/FormField';

export default function MilestoneDefinition() {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'milestones',
  });

  const milestones = watch('milestones', []);

  // Add new milestone
  const addMilestone = () => {
    if (fields.length < 10) {
      append({
        title: '',
        description: '',
        energyTarget: 0,
        deadline: '',
        deliverables: '',
      });
    }
  };

  // Remove milestone
  const removeMilestone = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Add first milestone if none exist
  React.useEffect(() => {
    if (fields.length === 0) {
      addMilestone();
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-orange-900 mb-2">
          Step 4: Milestone Definition
        </h3>
        <p className="text-sm text-orange-700">
          Define project milestones with energy targets and deliverables.
        </p>
      </div>

      {/* Milestone Count Summary */}
      <div className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200">
        <div>
          <p className="text-sm font-medium text-gray-700">Total Milestones</p>
          <p className="text-2xl font-bold text-orange-600">{fields.length}</p>
        </div>
        <button
          type="button"
          onClick={addMilestone}
          disabled={fields.length >= 10}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

      {/* Milestones */}
      <div className="space-y-6">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="bg-white border-2 border-gray-200 rounded-lg p-6 relative"
          >
            {/* Milestone Header */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">
                Milestone {index + 1}
              </h4>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMilestone(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  title="Remove milestone"
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
              )}
            </div>

            <div className="space-y-4">
              {/* Milestone Title */}
              <FormField
                label="Milestone Title"
                name={`milestones.${index}.title`}
                required
                error={(errors.milestones as any)?.[index]?.title?.message as string}
                maxLength={100}
                currentLength={watch(`milestones.${index}.title`, '').length}
              >
                <input
                  {...register(`milestones.${index}.title`)}
                  type="text"
                  placeholder="e.g., Site Preparation Complete"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    (errors.milestones as any)?.[index]?.title
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
              </FormField>

              {/* Milestone Description */}
              <FormField
                label="Description"
                name={`milestones.${index}.description`}
                required
                error={(errors.milestones as any)?.[index]?.description?.message as string}
                maxLength={500}
                currentLength={watch(`milestones.${index}.description`, '').length}
              >
                <textarea
                  {...register(`milestones.${index}.description`)}
                  rows={3}
                  placeholder="Describe what will be accomplished in this milestone..."
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none ${
                    (errors.milestones as any)?.[index]?.description
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
              </FormField>

              {/* Energy Target and Deadline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Energy Production Target (kWh)"
                  name={`milestones.${index}.energyTarget`}
                  required
                  error={(errors.milestones as any)?.[index]?.energyTarget?.message as string}
                  helpText="Expected energy production for this milestone"
                >
                  <input
                    {...register(`milestones.${index}.energyTarget`, { valueAsNumber: true })}
                    type="number"
                    min={0}
                    step={100}
                    placeholder="e.g., 50000"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      (errors.milestones as any)?.[index]?.energyTarget
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                </FormField>

                <FormField
                  label="Deadline"
                  name={`milestones.${index}.deadline`}
                  required
                  error={(errors.milestones as any)?.[index]?.deadline?.message as string}
                  helpText="Target completion date for this milestone"
                >
                  <input
                    {...register(`milestones.${index}.deadline`)}
                    type="date"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      (errors.milestones as any)?.[index]?.deadline
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                </FormField>
              </div>

              {/* Deliverables */}
              <FormField
                label="Deliverables"
                name={`milestones.${index}.deliverables`}
                required
                error={(errors.milestones as any)?.[index]?.deliverables?.message as string}
                maxLength={1000}
                currentLength={watch(`milestones.${index}.deliverables`, '').length}
                helpText="List the key deliverables for this milestone"
              >
                <textarea
                  {...register(`milestones.${index}.deliverables`)}
                  rows={3}
                  placeholder="e.g., Completed foundation, electrical connections, permits obtained..."
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none ${
                    (errors.milestones as any)?.[index]?.deliverables
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
              </FormField>
            </div>
          </div>
        ))}
      </div>

      {/* Validation Error */}
      {errors.milestones && typeof errors.milestones.message === 'string' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2 text-sm text-red-600">
            <svg
              className="w-5 h-5 flex-shrink-0 mt-0.5"
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
            <span>{errors.milestones.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}


