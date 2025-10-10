/**
 * Technical Specifications Step
 * 
 * Second step of the multi-step project creation form
 * 
 * Fields:
 * - Energy capacity (1kW-10MW range with validation)
 * - Efficiency ratings (percentage)
 * - Equipment type and manufacturer
 * - Installation details
 */

import React from 'react';
import { useFormContext } from 'react-hook-form';
import FormField from '../../common/FormField';

export default function TechnicalSpecifications() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();

  const energyCapacity = watch('energyCapacity', 0);
  const efficiencyRating = watch('efficiencyRating', 0);

  // Calculate estimated annual production
  const estimatedProduction = energyCapacity * 8760 * (efficiencyRating / 100) * 0.25; // 25% capacity factor

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-purple-900 mb-2">
          Step 2: Technical Specifications
        </h3>
        <p className="text-sm text-purple-700">
          Define the technical details including energy capacity, efficiency, and equipment.
        </p>
      </div>

      {/* Energy Capacity */}
      <FormField
        label="Energy Capacity (kW)"
        name="energyCapacity"
        required
        error={errors.energyCapacity?.message as string}
        helpText="System capacity in kilowatts (kW). Range: 1 kW to 10,000 kW (10 MW)"
      >
        <div className="relative">
          <input
            {...register('energyCapacity', { valueAsNumber: true })}
            type="number"
            id="energyCapacity"
            min={1}
            max={10000}
            step={0.1}
            placeholder="e.g., 500"
            className={`w-full px-4 py-2 pr-12 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.energyCapacity
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
            kW
          </span>
        </div>
        {energyCapacity > 0 && (
          <div className="mt-2 text-sm text-gray-600 bg-blue-50 rounded-lg p-3">
            <p className="font-medium text-blue-900 mb-1">System Metrics:</p>
            <p>Capacity: {energyCapacity.toLocaleString()} kW</p>
            {efficiencyRating > 0 && (
              <p>Est. Annual Production: {estimatedProduction.toLocaleString()} kWh/year</p>
            )}
          </div>
        )}
      </FormField>

      {/* Efficiency Rating */}
      <FormField
        label="Efficiency Rating (%)"
        name="efficiencyRating"
        error={errors.efficiencyRating?.message as string}
        helpText="Expected system efficiency as a percentage (0-100%)"
      >
        <div className="relative">
          <input
            {...register('efficiencyRating', { valueAsNumber: true })}
            type="number"
            id="efficiencyRating"
            min={0}
            max={100}
            step={0.1}
            placeholder="e.g., 85.5"
            className={`w-full px-4 py-2 pr-12 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.efficiencyRating
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
            %
          </span>
        </div>
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(efficiencyRating, 100)}%` }}
            />
          </div>
        </div>
      </FormField>

      {/* Equipment Type */}
      <FormField
        label="Equipment Type"
        name="equipmentType"
        required
        error={errors.equipmentType?.message as string}
        helpText="Specify the primary equipment or technology being used"
      >
        <input
          {...register('equipmentType')}
          type="text"
          id="equipmentType"
          placeholder="e.g., Monocrystalline Solar Panels"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.equipmentType
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
      </FormField>

      {/* Equipment Manufacturer */}
      <FormField
        label="Equipment Manufacturer (Optional)"
        name="equipmentManufacturer"
        error={errors.equipmentManufacturer?.message as string}
        helpText="Name of the equipment manufacturer or supplier"
      >
        <input
          {...register('equipmentManufacturer')}
          type="text"
          id="equipmentManufacturer"
          placeholder="e.g., SunPower Corporation"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </FormField>

      {/* Installation Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Planned Installation Date (Optional)"
          name="installationDate"
          error={errors.installationDate?.message as string}
          helpText="When do you plan to install the equipment?"
        >
          <input
            {...register('installationDate')}
            type="date"
            id="installationDate"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </FormField>

        <FormField
          label="Warranty Period (Years, Optional)"
          name="warrantyYears"
          error={errors.warrantyYears?.message as string}
          helpText="Equipment warranty duration in years"
        >
          <input
            {...register('warrantyYears', { valueAsNumber: true })}
            type="number"
            id="warrantyYears"
            min={0}
            max={50}
            step={1}
            placeholder="e.g., 25"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </FormField>
      </div>
    </div>
  );
}


