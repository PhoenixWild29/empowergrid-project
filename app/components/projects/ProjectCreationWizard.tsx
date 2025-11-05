import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

type WizardStep = 'details' | 'energy' | 'funding' | 'milestones' | 'review';

interface ProjectDraft {
  // Step 1: Project Details
  title: string;
  description: string;
  category: string;
  tags: string[];
  location?: string;
  
  // Step 2: Energy Specifications
  energyCapacity?: number;
  energyType?: string;
  
  // Step 3: Funding Requirements
  targetAmount: number;
  duration: number;
  
  // Step 4: Milestones
  milestoneCount: number;
  milestones?: Array<{
    title: string;
    description: string;
    targetAmount: number;
  }>;
  
  // Media
  images?: string[];
  videoUrl?: string;
}

/**
 * Multi-Step Project Creation Wizard
 * 
 * Features:
 * - 5 steps: Details, Energy, Funding, Milestones, Review
 * - Form validation per step
 * - Progress indicator
 * - Backward navigation
 * - Draft saving
 * - Summary review
 * - Error handling
 */
export default function ProjectCreationWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>('details');
  const [formData, setFormData] = useState<ProjectDraft>({
    title: '',
    description: '',
    category: '',
    tags: [],
    targetAmount: 0,
    duration: 90,
    milestoneCount: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const steps: WizardStep[] = ['details', 'energy', 'funding', 'milestones', 'review'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Load draft from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('project_draft');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, []);

  // Save draft to localStorage whenever formData changes
  useEffect(() => {
    localStorage.setItem('project_draft', JSON.stringify(formData));
  }, [formData]);

  // Validation functions
  const validateStep = (step: WizardStep): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 'details') {
      if (!formData.title || formData.title.length < 10) {
        newErrors.title = 'Title must be at least 10 characters';
      }
      if (!formData.description || formData.description.length < 50) {
        newErrors.description = 'Description must be at least 50 characters';
      }
      if (!formData.category) {
        newErrors.category = 'Category is required';
      }
      if (formData.tags.length === 0) {
        newErrors.tags = 'At least one tag is required';
      }
    } else if (step === 'funding') {
      if (formData.targetAmount < 1000) {
        newErrors.targetAmount = 'Minimum funding target is $1,000';
      }
      if (formData.targetAmount > 10000000) {
        newErrors.targetAmount = 'Maximum funding target is $10,000,000';
      }
      if (formData.duration < 7) {
        newErrors.duration = 'Minimum duration is 7 days';
      }
      if (formData.duration > 730) {
        newErrors.duration = 'Maximum duration is 2 years';
      }
    } else if (step === 'milestones') {
      if (formData.milestoneCount < 1) {
        newErrors.milestoneCount = 'At least 1 milestone is required';
      }
      if (formData.milestoneCount > 10) {
        newErrors.milestoneCount = 'Maximum 10 milestones allowed';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation
  const goToNextStep = () => {
    if (!validateStep(currentStep)) return;
    
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
      setErrors({});
    }
  };

  // Submit project
  const handleSubmit = async () => {
    setSaving(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.details) {
          const fieldErrors: Record<string, string> = {};
          data.details.forEach((detail: any) => {
            fieldErrors[detail.field] = detail.message;
          });
          setErrors(fieldErrors);
          // Go back to first step with errors
          setCurrentStep('details');
        } else {
          setErrors({ general: data.error || 'Failed to create project' });
        }
        return;
      }

      const data = await response.json();
      
      // Clear draft
      localStorage.removeItem('project_draft');
      
      // Redirect to project page
      router.push(`/projects/${data.project.id}`);
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'details':
        return (
          <div className="wizard-step">
            <h2>Project Details</h2>
            <p className="step-description">Tell us about your renewable energy project</p>

            {errors.general && (
              <div className="error-message general">{errors.general}</div>
            )}

            <div className="form-group">
              <label htmlFor="title">
                Project Title <span className="required">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className={errors.title ? 'error' : ''}
                placeholder="e.g., Community Solar Farm in Phoenix"
              />
              {errors.title && <span className="error-message">{errors.title}</span>}
              <span className="char-count">{formData.title.length}/200</span>
            </div>

            <div className="form-group">
              <label htmlFor="description">
                Description <span className="required">*</span>
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className={errors.description ? 'error' : ''}
                rows={6}
                placeholder="Provide a detailed description of your project, its goals, and expected impact..."
              />
              {errors.description && <span className="error-message">{errors.description}</span>}
              <span className="char-count">{formData.description.length}/5000</span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">
                  Category <span className="required">*</span>
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className={errors.category ? 'error' : ''}
                >
                  <option value="">Select category...</option>
                  <option value="Solar">Solar</option>
                  <option value="Wind">Wind</option>
                  <option value="Hydro">Hydro</option>
                  <option value="Geothermal">Geothermal</option>
                  <option value="Biomass">Biomass</option>
                </select>
                {errors.category && <span className="error-message">{errors.category}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="City, State/Country"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tags">
                Tags <span className="required">*</span>
              </label>
              <input
                type="text"
                id="tags"
                value={formData.tags.join(', ')}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) 
                }))}
                className={errors.tags ? 'error' : ''}
                placeholder="renewable, solar, community (comma-separated)"
              />
              {errors.tags && <span className="error-message">{errors.tags}</span>}
            </div>
          </div>
        );

      case 'energy':
        return (
          <div className="wizard-step">
            <h2>Energy Specifications</h2>
            <p className="step-description">Define the energy production capacity</p>

            <div className="form-group">
              <label htmlFor="energyCapacity">
                Energy Capacity (kW)
              </label>
              <input
                type="number"
                id="energyCapacity"
                value={formData.energyCapacity || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, energyCapacity: Number(e.target.value) }))}
                min="1"
                max="10000"
                placeholder="e.g., 500"
              />
              <span className="help-text">Range: 1 kW - 10,000 kW (10 MW)</span>
            </div>

            <div className="form-group">
              <label htmlFor="energyType">Energy Type</label>
              <select
                id="energyType"
                value={formData.energyType || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, energyType: e.target.value }))}
              >
                <option value="">Select type...</option>
                <option value="photovoltaic">Photovoltaic Solar</option>
                <option value="wind-turbine">Wind Turbine</option>
                <option value="hydroelectric">Hydroelectric</option>
                <option value="geothermal">Geothermal</option>
                <option value="biomass">Biomass</option>
              </select>
            </div>
          </div>
        );

      case 'funding':
        return (
          <div className="wizard-step">
            <h2>Funding Requirements</h2>
            <p className="step-description">Set your funding goal and timeline</p>

            <div className="form-group">
              <label htmlFor="targetAmount">
                Funding Target (SOL) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="targetAmount"
                value={formData.targetAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: Number(e.target.value) }))}
                className={errors.targetAmount ? 'error' : ''}
                min="1000"
                max="10000000"
                placeholder="e.g., 50000"
              />
              {errors.targetAmount && <span className="error-message">{errors.targetAmount}</span>}
              <span className="help-text">Range: $1,000 - $10,000,000</span>
            </div>

            <div className="form-group">
              <label htmlFor="duration">
                Project Duration (days) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                className={errors.duration ? 'error' : ''}
                min="7"
                max="730"
                placeholder="90"
              />
              {errors.duration && <span className="error-message">{errors.duration}</span>}
              <span className="help-text">Range: 7 days - 2 years</span>
            </div>
          </div>
        );

      case 'milestones':
        return (
          <div className="wizard-step">
            <h2>Milestone Planning</h2>
            <p className="step-description">Define project milestones for fund release</p>

            <div className="form-group">
              <label htmlFor="milestoneCount">
                Number of Milestones <span className="required">*</span>
              </label>
              <input
                type="number"
                id="milestoneCount"
                value={formData.milestoneCount}
                onChange={(e) => setFormData(prev => ({ ...prev, milestoneCount: Number(e.target.value) }))}
                className={errors.milestoneCount ? 'error' : ''}
                min="1"
                max="10"
              />
              {errors.milestoneCount && <span className="error-message">{errors.milestoneCount}</span>}
              <span className="help-text">Split your project into 1-10 milestones</span>
            </div>

            <div className="milestone-info">
              <p>💡 Each milestone will receive an equal portion of the total funding ({(formData.targetAmount / formData.milestoneCount).toFixed(2)} SOL per milestone)</p>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="wizard-step">
            <h2>Review & Submit</h2>
            <p className="step-description">Review your project details before submission</p>

            <div className="review-section">
              <h3>Project Details</h3>
              <div className="review-item">
                <strong>Title:</strong> {formData.title}
              </div>
              <div className="review-item">
                <strong>Category:</strong> {formData.category}
              </div>
              <div className="review-item">
                <strong>Tags:</strong> {formData.tags.join(', ')}
              </div>
              <div className="review-item">
                <strong>Description:</strong> {formData.description}
              </div>
            </div>

            {formData.energyCapacity && (
              <div className="review-section">
                <h3>Energy Specifications</h3>
                <div className="review-item">
                  <strong>Capacity:</strong> {formData.energyCapacity} kW
                </div>
                {formData.energyType && (
                  <div className="review-item">
                    <strong>Type:</strong> {formData.energyType}
                  </div>
                )}
              </div>
            )}

            <div className="review-section">
              <h3>Funding Requirements</h3>
              <div className="review-item">
                <strong>Target Amount:</strong> {formData.targetAmount.toLocaleString()} SOL
              </div>
              <div className="review-item">
                <strong>Duration:</strong> {formData.duration} days
              </div>
            </div>

            <div className="review-section">
              <h3>Milestones</h3>
              <div className="review-item">
                <strong>Count:</strong> {formData.milestoneCount}
              </div>
              <div className="review-item">
                <strong>Per Milestone:</strong> {(formData.targetAmount / formData.milestoneCount).toFixed(2)} SOL
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="project-creation-wizard">
      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="progress-label">
          Step {currentStepIndex + 1} of {steps.length} ({progress.toFixed(0)}% Complete)
        </div>
      </div>

      {/* Step Indicator */}
      <div className="step-indicator">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`step-item ${index <= currentStepIndex ? 'active' : ''} ${index === currentStepIndex ? 'current' : ''}`}
          >
            <div className="step-number">{index + 1}</div>
            <div className="step-name">{step.charAt(0).toUpperCase() + step.slice(1)}</div>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="wizard-content">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="wizard-actions">
        <button
          onClick={goToPreviousStep}
          disabled={currentStepIndex === 0 || saving}
          className="btn-secondary"
        >
          ← Previous
        </button>

        {currentStep !== 'review' ? (
          <button
            onClick={goToNextStep}
            className="btn-primary"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-submit"
          >
            {saving ? 'Creating Project...' : '✓ Create Project'}
          </button>
        )}
      </div>

      <style jsx>{`
        .project-creation-wizard {
          max-width: 800px;
          margin: 0 auto;
        }

        .progress-section {
          margin-bottom: 2rem;
        }

        .progress-bar {
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #0d6efd 0%, #198754 100%);
          transition: width 0.3s ease;
        }

        .progress-label {
          text-align: center;
          font-size: 0.9rem;
          color: #6c757d;
          font-weight: 600;
        }

        .step-indicator {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3rem;
        }

        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
          position: relative;
        }

        .step-item::after {
          content: '';
          position: absolute;
          top: 15px;
          left: 50%;
          width: 100%;
          height: 2px;
          background: #e9ecef;
          z-index: -1;
        }

        .step-item:last-child::after {
          display: none;
        }

        .step-item.active::after {
          background: #0d6efd;
        }

        .step-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #e9ecef;
          color: #6c757d;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .step-item.active .step-number {
          background: #0d6efd;
          color: white;
        }

        .step-item.current .step-number {
          background: #198754;
          color: white;
        }

        .step-name {
          font-size: 0.75rem;
          color: #6c757d;
          font-weight: 600;
        }

        .step-item.active .step-name {
          color: #0d6efd;
        }

        .wizard-content {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 2rem;
        }

        .wizard-step h2 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .step-description {
          color: #6c757d;
          margin-bottom: 2rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .required {
          color: #dc3545;
        }

        input,
        textarea,
        select {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 1rem;
          font-family: inherit;
        }

        input:focus,
        textarea:focus,
        select:focus {
          outline: none;
          border-color: #0d6efd;
        }

        input.error,
        textarea.error,
        select.error {
          border-color: #dc3545;
        }

        .error-message {
          display: block;
          color: #dc3545;
          font-size: 0.85rem;
          margin-top: 0.25rem;
        }

        .error-message.general {
          background: #f8d7da;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1.5rem;
        }

        .char-count,
        .help-text {
          display: block;
          font-size: 0.85rem;
          color: #6c757d;
          margin-top: 0.25rem;
        }

        .milestone-info {
          background: #e7f3ff;
          padding: 1rem;
          border-radius: 8px;
          color: #0d6efd;
        }

        .review-section {
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 2px solid #e9ecef;
        }

        .review-section:last-child {
          border-bottom: none;
        }

        .review-section h3 {
          font-size: 1.25rem;
          margin-bottom: 1rem;
        }

        .review-item {
          margin-bottom: 0.75rem;
          color: #495057;
        }

        .review-item strong {
          display: inline-block;
          min-width: 150px;
          color: #212529;
        }

        .wizard-actions {
          display: flex;
          justify-content: space-between;
        }

        .btn-secondary,
        .btn-primary,
        .btn-submit {
          padding: 1rem 2rem;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #5a6268;
        }

        .btn-primary {
          background: #0d6efd;
          color: white;
        }

        .btn-primary:hover {
          background: #0b5ed7;
        }

        .btn-submit {
          background: #198754;
          color: white;
        }

        .btn-submit:hover:not(:disabled) {
          background: #157347;
        }

        .btn-secondary:disabled,
        .btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .step-name {
            display: none;
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}






