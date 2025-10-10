/**
 * Multi-Step Project Creation Form
 * 
 * Enhanced architecture with React Hook Form integration
 * 
 * Features:
 * - 4 distinct steps with React Hook Form
 * - Progress indicator with completion percentage
 * - Forward navigation with validation
 * - Backward navigation without data loss
 * - Auto-save every 30 seconds
 * - Form recovery from localStorage
 * - Loading states and animations
 * - Fully responsive and accessible
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useRouter } from 'next/router';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAutoSave } from '../../hooks/useAutoSave';
import { loadDraft, clearDraft } from '../../utils/formRecovery';
import {
  ProjectBasicInfoSchema,
  TechnicalSpecificationsSchema,
  FundingStructureSchema,
  MilestoneDefinitionSchema,
  CompleteProjectCreationSchema,
} from '../../lib/schemas/projectCreationSchemas';
import ProjectBasicInfo from './steps/ProjectBasicInfo';
import TechnicalSpecifications from './steps/TechnicalSpecifications';
import FundingStructure from './steps/FundingStructure';
import MilestoneDefinition from './steps/MilestoneDefinition';

// Step names
type StepName = 'ProjectBasicInfo' | 'TechnicalSpecifications' | 'FundingStructure' | 'MilestoneDefinition';

export interface ProjectFormData {
  // Project Basic Info
  projectName: string;
  description: string;
  location: string;
  projectType: string;
  
  // Technical Specifications
  energyCapacity: number;
  efficiencyRating: number;
  equipmentType: string;
  
  // Funding Structure
  fundingTarget: number;
  milestoneAllocation: number[];
  fundingTimeline: number;
  
  // Milestone Definition
  milestones: Array<{
    title: string;
    description: string;
    energyTarget: number;
    deadline: string;
    deliverables: string;
  }>;
}

const STEPS: Array<{ name: StepName; label: string; description: string }> = [
  {
    name: 'ProjectBasicInfo',
    label: 'Basic Information',
    description: 'Project name, description, and location',
  },
  {
    name: 'TechnicalSpecifications',
    label: 'Technical Details',
    description: 'Energy capacity and equipment specifications',
  },
  {
    name: 'FundingStructure',
    label: 'Funding Requirements',
    description: 'Funding goals and milestone allocation',
  },
  {
    name: 'MilestoneDefinition',
    label: 'Milestones',
    description: 'Define project milestones and deliverables',
  },
];

interface MultiStepProjectFormProps {
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onCancel?: () => void;
  draftKey?: string;
}

export default function MultiStepProjectForm({
  onSubmit,
  onCancel,
  draftKey = 'project_creation_draft',
}: MultiStepProjectFormProps) {
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const currentStep = STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  // Initialize form with React Hook Form
  const methods = useForm<ProjectFormData>({
    mode: 'onChange',
    defaultValues: {
      projectName: '',
      description: '',
      location: '',
      projectType: '',
      energyCapacity: 0,
      efficiencyRating: 0,
      equipmentType: '',
      fundingTarget: 0,
      milestoneAllocation: [],
      fundingTimeline: 90,
      milestones: [],
    },
  });

  const {
    handleSubmit,
    trigger,
    getValues,
    reset,
    formState: { errors, isValid },
  } = methods;

  // Load saved draft on mount
  useEffect(() => {
    const draft = loadDraft<ProjectFormData>(draftKey);
    if (draft) {
      reset(draft.data);
      setCurrentStepIndex(draft.currentStep || 0);
    }
  }, [draftKey, reset]);

  // Auto-save hook - saves every 30 seconds and after step completion
  const { isSaving, lastSaved } = useAutoSave({
    data: getValues(),
    currentStep: currentStepIndex,
    storageKey: draftKey,
    interval: 30000, // 30 seconds
  });

  // Calculate estimated completion time
  useEffect(() => {
    const totalFields = 15; // Approximate total required fields
    const currentProgress = currentStepIndex / STEPS.length;
    const fieldsCompleted = Object.keys(getValues()).filter((key) => {
      const value = getValues()[key as keyof ProjectFormData];
      return value && value !== '' && value !== 0;
    }).length;
    
    const avgTimePerField = 45; // seconds
    const remainingFields = totalFields - fieldsCompleted;
    const estimated = remainingFields * avgTimePerField;
    
    setEstimatedTime(Math.max(0, estimated));
  }, [currentStepIndex, getValues]);

  // Navigate to next step
  const handleNext = useCallback(async () => {
    // Trigger validation for current step fields
    const isStepValid = await trigger();
    
    if (!isStepValid) {
      return;
    }

    setIsTransitioning(true);
    
    // Simulate smooth transition
    setTimeout(() => {
      setCurrentStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
      setIsTransitioning(false);
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  }, [trigger]);

  // Navigate to previous step
  const handlePrevious = useCallback(() => {
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
      setIsTransitioning(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  }, []);

  // Jump to specific step (only if it's a previous step)
  const handleJumpToStep = useCallback((stepIndex: number) => {
    if (stepIndex < currentStepIndex) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStepIndex(stepIndex);
        setIsTransitioning(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 300);
    }
  }, [currentStepIndex]);

  // Submit form
  const handleFormSubmit = handleSubmit(async (data) => {
    setSubmitting(true);
    
    try {
      await onSubmit(data);
      
      // Clear draft after successful submission
      clearDraft(draftKey);
      
      // Redirect or show success message
      router.push('/projects');
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setSubmitting(false);
    }
  });

  // Format estimated time
  const formatEstimatedTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">
                Create New Project
              </h1>
              <div className="text-sm text-gray-500">
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Saving...
                  </span>
                ) : lastSaved ? (
                  <span>Saved {new Date(lastSaved).toLocaleTimeString()}</span>
                ) : null}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Step {currentStepIndex + 1} of {STEPS.length}
                </span>
                <span className="text-sm font-medium text-blue-600">
                  {progress.toFixed(0)}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <button
                  key={step.name}
                  onClick={() => handleJumpToStep(index)}
                  disabled={index > currentStepIndex}
                  className={`flex-1 ${index < STEPS.length - 1 ? 'mr-2' : ''}`}
                >
                  <div
                    className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                      index === currentStepIndex
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : index < currentStepIndex
                        ? 'bg-green-50 border-2 border-green-500 cursor-pointer hover:bg-green-100'
                        : 'bg-gray-50 border-2 border-gray-200 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                        index === currentStepIndex
                          ? 'bg-blue-500 text-white'
                          : index < currentStepIndex
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {index < currentStepIndex ? (
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <span className="text-sm font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-center hidden sm:block">
                      {step.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Estimated Time */}
            {estimatedTime > 0 && (
              <div className="mt-4 text-center text-sm text-gray-600">
                Estimated time to complete: {formatEstimatedTime(estimatedTime)}
              </div>
            )}
          </div>

          {/* Step Content */}
          <form onSubmit={handleFormSubmit}>
            <div
              className={`bg-white rounded-lg shadow-sm p-6 mb-6 transition-opacity duration-300 ${
                isTransitioning ? 'opacity-50' : 'opacity-100'
              }`}
            >
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {currentStep.label}
              </h2>
              <p className="text-gray-600 mb-6">{currentStep.description}</p>

              {/* Step components */}
              <div className="min-h-[400px]">
                {currentStep.name === 'ProjectBasicInfo' && <ProjectBasicInfo />}
                {currentStep.name === 'TechnicalSpecifications' && <TechnicalSpecifications />}
                {currentStep.name === 'FundingStructure' && <FundingStructure />}
                {currentStep.name === 'MilestoneDefinition' && <MilestoneDefinition />}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={isFirstStep ? onCancel : handlePrevious}
                  disabled={isTransitioning}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isFirstStep ? 'Cancel' : 'Previous'}
                </button>

                <div className="flex gap-4">
                  {!isLastStep && (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={isTransitioning || !isValid}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  )}
                  {isLastStep && (
                    <button
                      type="submit"
                      disabled={submitting || !isValid}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <svg
                            className="animate-spin h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Creating...
                        </>
                      ) : (
                        'Create Project'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </FormProvider>
  );
}

