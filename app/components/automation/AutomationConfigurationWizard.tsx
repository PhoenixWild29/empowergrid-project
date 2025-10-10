/**
 * Automation Configuration Wizard
 * 
 * WO-126: Step-by-step automation setup
 * 
 * Features:
 * - Multi-step wizard with progress
 * - Trigger condition builder
 * - Verification threshold selector
 * - Configuration preview
 * - Simulation mode
 * - Stakeholder approval workflow
 */

import { useState } from 'react';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  isComplete: boolean;
}

export default function AutomationConfigurationWizard({
  projectId,
  contractId,
  onComplete,
}: {
  projectId: string;
  contractId: string;
  onComplete: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState<any>({
    triggerConditions: {},
    verificationThresholds: { minConfidenceScore: 80 },
    releaseSchedule: {},
    fallbackMechanisms: {},
    manualOverride: {},
  });
  const [showPreview, setShowPreview] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const steps: WizardStep[] = [
    { id: 'triggers', title: 'Trigger Conditions', description: 'Define when releases should occur', isComplete: false },
    { id: 'thresholds', title: 'Verification Thresholds', description: 'Set confidence requirements', isComplete: false },
    { id: 'schedule', title: 'Release Schedule', description: 'Configure timing', isComplete: false },
    { id: 'fallback', title: 'Fallback & Safety', description: 'Set safety mechanisms', isComplete: false },
    { id: 'preview', title: 'Preview & Test', description: 'Review and simulate', isComplete: false },
    { id: 'approval', title: 'Stakeholder Approval', description: 'Get required approvals', isComplete: false },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSimulate = async () => {
    try {
      const response = await fetch('/api/automation/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, projectId, contractId }),
      });

      const data = await response.json();
      setSimulationResult(data);
    } catch (error) {
      console.error('Simulation failed:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/escrow/releases/configure-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, projectId, contractId }),
      });

      if (response.ok) {
        onComplete();
      }
    } catch (error) {
      console.error('Configuration failed:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex-1">
              <div className={`h-2 rounded ${
                idx <= currentStep ? 'bg-blue-500' : 'bg-gray-200'
              }`} />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm">
          {steps.map((step, idx) => (
            <span key={step.id} className={idx === currentStep ? 'font-semibold text-blue-600' : 'text-gray-500'}>
              {step.title}
            </span>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">{steps[currentStep].title}</h2>
        <p className="text-gray-600 mb-6">{steps[currentStep].description}</p>

        {/* Step-specific content */}
        {currentStep === 0 && <TriggerConditionBuilder config={config} setConfig={setConfig} />}
        {currentStep === 1 && <VerificationThresholdSelector config={config} setConfig={setConfig} />}
        {currentStep === 2 && <ReleaseScheduleBuilder config={config} setConfig={setConfig} />}
        {currentStep === 3 && <FallbackMechanismsBuilder config={config} setConfig={setConfig} />}
        {currentStep === 4 && (
          <ConfigurationPreview
            config={config}
            onSimulate={handleSimulate}
            simulationResult={simulationResult}
          />
        )}
        {currentStep === 5 && <StakeholderApprovalSection config={config} />}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className="px-6 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
        >
          Back
        </button>
        
        {currentStep < steps.length - 1 ? (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Activate Automation
          </button>
        )}
      </div>
    </div>
  );
}

// Wizard step components

function TriggerConditionBuilder({ config, setConfig }: any) {
  return (
    <div className="space-y-4">
      <label className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={config.triggerConditions.milestoneCompletion}
          onChange={(e) => setConfig({
            ...config,
            triggerConditions: { ...config.triggerConditions, milestoneCompletion: e.target.checked }
          })}
          className="w-4 h-4"
        />
        <span>Require milestone completion</span>
      </label>
      
      <div>
        <label className="block text-sm font-medium mb-2">Oracle Threshold (%)</label>
        <input
          type="number"
          min="0"
          max="100"
          value={config.triggerConditions.oracleThreshold || 80}
          onChange={(e) => setConfig({
            ...config,
            triggerConditions: { ...config.triggerConditions, oracleThreshold: parseInt(e.target.value) }
          })}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
    </div>
  );
}

function VerificationThresholdSelector({ config, setConfig }: any) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Minimum Confidence Score (%)
        </label>
        <input
          type="number"
          min="0"
          max="100"
          value={config.verificationThresholds.minConfidenceScore}
          onChange={(e) => setConfig({
            ...config,
            verificationThresholds: { ...config.verificationThresholds, minConfidenceScore: parseInt(e.target.value) }
          })}
          className="w-full px-3 py-2 border rounded-lg"
        />
        <p className="text-sm text-gray-500 mt-1">Recommended: 80%</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Required Data Points</label>
        <input
          type="number"
          min="1"
          max="10"
          value={config.verificationThresholds.requiredDataPoints || 3}
          onChange={(e) => setConfig({
            ...config,
            verificationThresholds: { ...config.verificationThresholds, requiredDataPoints: parseInt(e.target.value) }
          })}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
    </div>
  );
}

function ReleaseScheduleBuilder({ config, setConfig }: any) {
  return (
    <div className="space-y-4">
      <label className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={config.releaseSchedule.immediate}
          onChange={(e) => setConfig({
            ...config,
            releaseSchedule: { ...config.releaseSchedule, immediate: e.target.checked }
          })}
          className="w-4 h-4"
        />
        <span>Release immediately when conditions met</span>
      </label>
      
      {!config.releaseSchedule.immediate && (
        <div>
          <label className="block text-sm font-medium mb-2">Delay (seconds)</label>
          <input
            type="number"
            min="0"
            value={config.releaseSchedule.delaySeconds || 0}
            onChange={(e) => setConfig({
              ...config,
              releaseSchedule: { ...config.releaseSchedule, delaySeconds: parseInt(e.target.value) }
            })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      )}
    </div>
  );
}

function FallbackMechanismsBuilder({ config, setConfig }: any) {
  return (
    <div className="space-y-4">
      <label className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={config.fallbackMechanisms.enableManualReview}
          onChange={(e) => setConfig({
            ...config,
            fallbackMechanisms: { ...config.fallbackMechanisms, enableManualReview: e.target.checked }
          })}
          className="w-4 h-4"
        />
        <span>Enable manual review on failure</span>
      </label>
      
      <label className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={config.fallbackMechanisms.notifyOnFailure}
          onChange={(e) => setConfig({
            ...config,
            fallbackMechanisms: { ...config.fallbackMechanisms, notifyOnFailure: e.target.checked }
          })}
          className="w-4 h-4"
        />
        <span>Notify stakeholders on failure</span>
      </label>
      
      <div>
        <label className="block text-sm font-medium mb-2">Maximum Retries</label>
        <input
          type="number"
          min="0"
          max="5"
          value={config.fallbackMechanisms.maxRetries || 3}
          onChange={(e) => setConfig({
            ...config,
            fallbackMechanisms: { ...config.fallbackMechanisms, maxRetries: parseInt(e.target.value) }
          })}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
    </div>
  );
}

function ConfigurationPreview({ config, onSimulate, simulationResult }: any) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Configuration Summary</h3>
        <pre className="text-sm text-gray-700 overflow-auto">
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>
      
      <button
        onClick={onSimulate}
        className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
      >
        Run Simulation
      </button>
      
      {simulationResult && (
        <div className={`p-4 rounded-lg ${simulationResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
          <h4 className="font-semibold mb-2">Simulation Result</h4>
          <p>Expected behavior: {simulationResult.message}</p>
        </div>
      )}
    </div>
  );
}

function StakeholderApprovalSection({ config }: any) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Required Approvals</h3>
        <p className="text-sm text-gray-700">
          This configuration requires approval from {config.manualOverride?.requiresApprovals || 2} stakeholders.
        </p>
      </div>
      
      <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center">
        <p className="text-gray-500 mb-4">Approval workflow will be initiated upon activation</p>
        <p className="text-sm text-gray-400">
          Stakeholders will receive notification and have {(config.manualOverride?.approvalTimeout || 86400) / 3600} hours to approve
        </p>
      </div>
    </div>
  );
}



