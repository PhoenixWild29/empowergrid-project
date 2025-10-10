/**
 * Project Basic Info Step
 * 
 * First step of the multi-step project creation form
 * 
 * Fields:
 * - Project name (required, with validation)
 * - Description (required, with character counter)
 * - Location (required, with coordinate input)
 * - Project type (required, dropdown selection)
 */

import React from 'react';
import { useFormContext } from 'react-hook-form';
import FormField from '../../common/FormField';

const PROJECT_TYPES = [
  { value: 'Solar', label: 'Solar Energy', icon: '☀️' },
  { value: 'Wind', label: 'Wind Energy', icon: '💨' },
  { value: 'Hydro', label: 'Hydroelectric', icon: '💧' },
  { value: 'Biomass', label: 'Biomass Energy', icon: '🌱' },
  { value: 'Geothermal', label: 'Geothermal Energy', icon: '🌋' },
  { value: 'Hybrid', label: 'Hybrid System', icon: '⚡' },
];

export default function ProjectBasicInfo() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();

  const projectName = watch('projectName', '');
  const description = watch('description', '');

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          Step 1: Project Basic Information
        </h3>
        <p className="text-sm text-blue-700">
          Provide the fundamental information about your renewable energy project.
        </p>
      </div>

      {/* Project Name */}
      <FormField
        label="Project Name"
        name="projectName"
        required
        error={errors.projectName?.message as string}
        helpText="Choose a unique, descriptive name for your project"
        maxLength={200}
        currentLength={projectName.length}
      >
        <input
          {...register('projectName')}
          type="text"
          id="projectName"
          placeholder="e.g., Community Solar Farm - Downtown District"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.projectName
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
      </FormField>

      {/* Description */}
      <FormField
        label="Project Description"
        name="description"
        required
        error={errors.description?.message as string}
        helpText="Provide a detailed description of your project's goals, impact, and benefits"
        maxLength={2000}
        currentLength={description.length}
      >
        <textarea
          {...register('description')}
          id="description"
          rows={6}
          placeholder="Describe your renewable energy project in detail..."
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none ${
            errors.description
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
      </FormField>

      {/* Location */}
      <FormField
        label="Location"
        name="location"
        required
        error={errors.location?.message as string}
        helpText="Enter the city, state, or region where the project will be located"
        maxLength={200}
        currentLength={watch('location', '').length}
      >
        <input
          {...register('location')}
          type="text"
          id="location"
          placeholder="e.g., San Francisco, California"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.location
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
      </FormField>

      {/* Location Coordinates (Optional) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Latitude (Optional)"
          name="locationCoordinates.latitude"
          error={(errors.locationCoordinates as any)?.latitude?.message as string}
          helpText="Precise GPS latitude (-90 to 90)"
        >
          <input
            {...register('locationCoordinates.latitude', { valueAsNumber: true })}
            type="number"
            step="0.000001"
            placeholder="e.g., 37.7749"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </FormField>

        <FormField
          label="Longitude (Optional)"
          name="locationCoordinates.longitude"
          error={(errors.locationCoordinates as any)?.longitude?.message as string}
          helpText="Precise GPS longitude (-180 to 180)"
        >
          <input
            {...register('locationCoordinates.longitude', { valueAsNumber: true })}
            type="number"
            step="0.000001"
            placeholder="e.g., -122.4194"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </FormField>
      </div>

      {/* Project Type */}
      <FormField
        label="Project Type"
        name="projectType"
        required
        error={errors.projectType?.message as string}
        helpText="Select the primary renewable energy source for this project"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PROJECT_TYPES.map((type) => (
            <label
              key={type.value}
              className="relative flex items-center justify-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <input
                {...register('projectType')}
                type="radio"
                value={type.value}
                className="sr-only peer"
              />
              <div className="text-center peer-checked:text-blue-600">
                <div className="text-3xl mb-2">{type.icon}</div>
                <div className="text-sm font-medium">{type.label}</div>
              </div>
              <div className="absolute inset-0 border-2 border-blue-600 rounded-lg opacity-0 peer-checked:opacity-100 pointer-events-none" />
            </label>
          ))}
        </div>
      </FormField>
    </div>
  );
}


