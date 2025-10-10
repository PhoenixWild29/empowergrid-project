/**
 * Funding Structure Step
 * 
 * Third step of the multi-step project creation form
 * 
 * Fields:
 * - Funding target ($1K-$10M range with validation)
 * - Milestone allocation (percentage distribution)
 * - Funding timeline (days)
 * - Currency selection
 */

import React from 'react';
import { useFormContext } from 'react-hook-form';
import FormField from '../../common/FormField';

export default function FundingStructure() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const fundingTarget = watch('fundingTarget', 0);
  const fundingTimeline = watch('fundingTimeline', 90);
  const milestones = watch('milestones', []);
  const milestoneAllocation = watch('milestoneAllocation', []);

  // Calculate allocation totals
  const totalAllocation = milestoneAllocation.reduce((sum: number, val: number) => sum + val, 0);
  const allocationValid = Math.abs(totalAllocation - 100) < 0.01;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Auto-distribute allocations evenly
  const autoDistribute = () => {
    const count = milestones.length || 1;
    const evenAllocation = 100 / count;
    const allocations = Array(count).fill(evenAllocation);
    setValue('milestoneAllocation', allocations);
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-green-900 mb-2">
          Step 3: Funding Structure
        </h3>
        <p className="text-sm text-green-700">
          Set your funding goals and define how funds will be allocated.
        </p>
      </div>

      {/* Funding Target */}
      <FormField
        label="Funding Target"
        name="fundingTarget"
        required
        error={errors.fundingTarget?.message as string}
        helpText="Total funding needed for the project. Range: $1,000 to $10,000,000"
      >
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
            $
          </span>
          <input
            {...register('fundingTarget', { valueAsNumber: true })}
            type="number"
            id="fundingTarget"
            min={1000}
            max={10000000}
            step={1000}
            placeholder="e.g., 500000"
            className={`w-full px-4 py-2 pl-8 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.fundingTarget
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
        </div>
        {fundingTarget > 0 && (
          <div className="mt-2 text-sm bg-green-50 rounded-lg p-3">
            <p className="font-medium text-green-900">
              Target: {formatCurrency(fundingTarget)}
            </p>
          </div>
        )}
      </FormField>

      {/* Currency Selection */}
      <FormField
        label="Currency"
        name="currency"
        required
        error={errors.currency?.message as string}
        helpText="Select the funding currency for your project"
      >
        <div className="grid grid-cols-3 gap-3">
          {['USD', 'USDC', 'SOL'].map((curr) => (
            <label
              key={curr}
              className="relative flex items-center justify-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all"
            >
              <input
                {...register('currency')}
                type="radio"
                value={curr}
                defaultChecked={curr === 'USDC'}
                className="sr-only peer"
              />
              <div className="text-center peer-checked:text-green-600">
                <div className="text-lg font-bold">{curr}</div>
              </div>
              <div className="absolute inset-0 border-2 border-green-600 rounded-lg opacity-0 peer-checked:opacity-100 pointer-events-none" />
            </label>
          ))}
        </div>
      </FormField>

      {/* Funding Timeline */}
      <FormField
        label="Funding Timeline (Days)"
        name="fundingTimeline"
        required
        error={errors.fundingTimeline?.message as string}
        helpText="Duration for raising funds. Range: 7 to 730 days"
      >
        <div className="space-y-2">
          <input
            {...register('fundingTimeline', { valueAsNumber: true })}
            type="range"
            id="fundingTimeline"
            min={7}
            max={730}
            step={1}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">7 days</span>
            <span className="text-lg font-bold text-green-600">
              {fundingTimeline} days ({(fundingTimeline / 30).toFixed(1)} months)
            </span>
            <span className="text-sm text-gray-600">730 days</span>
          </div>
        </div>
      </FormField>

      {/* Milestone Allocation Summary */}
      {milestones.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900">
              Milestone Fund Allocation
            </h4>
            <button
              type="button"
              onClick={autoDistribute}
              className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Auto-Distribute
            </button>
          </div>
          
          <div className="space-y-2">
            {milestones.map((milestone: any, index: number) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-sm text-gray-700 flex-1 truncate">
                  {milestone.title || `Milestone ${index + 1}`}
                </span>
                <input
                  {...register(`milestoneAllocation.${index}`, { valueAsNumber: true })}
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  placeholder="%"
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            ))}
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-300">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Total:</span>
              <span
                className={`text-sm font-bold ${
                  allocationValid ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {totalAllocation.toFixed(1)}%
                {allocationValid && ' ✓'}
                {!allocationValid && ' (must equal 100%)'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


