/**
 * Escrow Contract Creation Wizard
 * 
 * WO-93: Multi-step wizard for escrow contract setup
 * 
 * Steps:
 * 1. Project Selection
 * 2. Contract Parameters
 * 3. Milestone Configuration
 * 4. Review & Submit
 * 5. Confirmation
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';

type WizardStep = 'select-project' | 'parameters' | 'milestones' | 'review' | 'confirmation';

interface ContractData {
  projectId: string;
  projectTitle: string;
  fundingTarget: number;
  milestones: Array<{
    id: string;
    title: string;
    fundingAmount: number;
    order: number;
  }>;
  signers: string[];
  requiredSignatures: number;
  oracleAuthority?: string;
  emergencyContact?: string;
}

export default function CreateEscrowContractPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<WizardStep>('select-project');
  const [contractData, setContractData] = useState<Partial<ContractData>>({
    signers: [],
    requiredSignatures: 1,
    milestones: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // WO-93: Handle contract creation submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/escrow/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractData),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentStep('confirmation');
      } else {
        setError(data.message || 'Failed to create contract');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-yellow-900 mb-2">Authentication Required</h2>
            <p className="text-yellow-700">Please connect your wallet to create an escrow contract.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const steps = [
    { id: 'select-project', label: 'Select Project' },
    { id: 'parameters', label: 'Parameters' },
    { id: 'milestones', label: 'Milestones' },
    { id: 'review', label: 'Review' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* WO-93: Progress Indicator */}
        {currentStep !== 'confirmation' && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Escrow Contract</h1>
            
            <div className="flex items-center justify-between mb-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex-1 flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    index <= currentStepIndex
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {index < currentStepIndex ? '✓' : index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 ${
                      index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              {steps.map(step => (
                <div key={step.id} className="flex-1 text-center">
                  {step.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WO-93: Step Content */}
        {currentStep === 'select-project' && (
          <ProjectSelectionStep
            data={contractData}
            onChange={setContractData}
            onNext={() => setCurrentStep('parameters')}
          />
        )}

        {currentStep === 'parameters' && (
          <ParametersStep
            data={contractData}
            onChange={setContractData}
            onNext={() => setCurrentStep('milestones')}
            onBack={() => setCurrentStep('select-project')}
          />
        )}

        {currentStep === 'milestones' && (
          <MilestonesStep
            data={contractData}
            onChange={setContractData}
            onNext={() => setCurrentStep('review')}
            onBack={() => setCurrentStep('parameters')}
          />
        )}

        {currentStep === 'review' && (
          <ReviewStep
            data={contractData as ContractData}
            onSubmit={handleSubmit}
            onBack={() => setCurrentStep('milestones')}
            isSubmitting={isSubmitting}
            error={error}
          />
        )}

        {currentStep === 'confirmation' && (
          <ConfirmationStep
            contractId={contractData.projectId || ''}
            onViewDashboard={() => router.push('/escrow/dashboard')}
            onCreateAnother={() => {
              setContractData({ signers: [], requiredSignatures: 1, milestones: [] });
              setCurrentStep('select-project');
            }}
          />
        )}
      </div>
    </Layout>
  );
}

// WO-93: Step Components (simplified for brevity)

function ProjectSelectionStep({ data, onChange, onNext }: any) {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects?status=ACTIVE');
        const result = await response.json();
        setProjects(result.projects || []);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProjects();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Your Project</h2>
      <p className="text-gray-600 mb-6">
        Choose the project for which you want to create an escrow contract.
      </p>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">You don&apos;t have any active projects yet.</p>
          <button
            onClick={() => window.location.href = '/projects/create'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create a Project First
          </button>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {projects.map(project => (
            <div
              key={project.id}
              onClick={() => onChange({ ...data, projectId: project.id, projectTitle: project.title, fundingTarget: project.targetAmount })}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                data.projectId === project.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-900">{project.title}</div>
              <div className="text-sm text-gray-600">Target: ${project.targetAmount.toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!data.projectId}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  );
}

function ParametersStep({ data, onChange, onNext, onBack }: any) {
  const [signerInput, setSignerInput] = useState('');

  const addSigner = () => {
    if (signerInput && !data.signers.includes(signerInput)) {
      onChange({ ...data, signers: [...data.signers, signerInput] });
      setSignerInput('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Contract Parameters</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Funding Target (USDC)
          </label>
          <input
            type="number"
            value={data.fundingTarget || ''}
            onChange={(e) => onChange({ ...data, fundingTarget: Number(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            min="100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Authorized Signers (Wallet Addresses)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={signerInput}
              onChange={(e) => setSignerInput(e.target.value)}
              placeholder="Enter wallet address"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={addSigner}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Add
            </button>
          </div>
          <div className="space-y-1">
            {data.signers.map((signer: string, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-mono">{signer.slice(0, 12)}...{signer.slice(-8)}</span>
                <button
                  onClick={() => onChange({ ...data, signers: data.signers.filter((_: any, i: number) => i !== index) })}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Required Signatures
          </label>
          <input
            type="number"
            value={data.requiredSignatures}
            onChange={(e) => onChange({ ...data, requiredSignatures: Number(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            min="1"
            max={data.signers.length || 1}
          />
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <button onClick={onBack} className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!data.fundingTarget || data.signers.length === 0}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function MilestonesStep({ data, onChange, onNext, onBack }: any) {
  const [newMilestone, setNewMilestone] = useState({ title: '', fundingAmount: 0 });

  const addMilestone = () => {
    if (newMilestone.title && newMilestone.fundingAmount > 0) {
      onChange({
        ...data,
        milestones: [
          ...data.milestones,
          { ...newMilestone, id: `m${Date.now()}`, order: data.milestones.length },
        ],
      });
      setNewMilestone({ title: '', fundingAmount: 0 });
    }
  };

  const totalAllocated = data.milestones.reduce((sum: number, m: any) => sum + m.fundingAmount, 0);
  const isValid = Math.abs(totalAllocated - data.fundingTarget) < 0.01 && data.milestones.length > 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Configure Milestones</h2>
      <p className="text-gray-600 mb-4">
        Define milestones for fund release. Total must equal ${data.fundingTarget?.toLocaleString()}.
      </p>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex justify-between text-sm">
          <span>Total Allocated:</span>
          <span className={`font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
            ${totalAllocated.toLocaleString()} / ${data.fundingTarget?.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="mb-6 space-y-3">
        {data.milestones.map((milestone: any, index: number) => (
          <div key={milestone.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="font-bold text-gray-600">#{index + 1}</span>
            <div className="flex-1">
              <div className="font-medium">{milestone.title}</div>
              <div className="text-sm text-gray-600">${milestone.fundingAmount.toLocaleString()}</div>
            </div>
            <button
              onClick={() => onChange({ ...data, milestones: data.milestones.filter((_: any, i: number) => i !== index) })}
              className="text-red-600 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="mb-6 space-y-3">
        <input
          type="text"
          value={newMilestone.title}
          onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
          placeholder="Milestone title"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
        <input
          type="number"
          value={newMilestone.fundingAmount || ''}
          onChange={(e) => setNewMilestone({ ...newMilestone, fundingAmount: Number(e.target.value) })}
          placeholder="Funding amount"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
        <button onClick={addMilestone} className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
          + Add Milestone
        </button>
      </div>

      <div className="flex gap-4">
        <button onClick={onBack} className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          Review
        </button>
      </div>
    </div>
  );
}

function ReviewStep({ data, onSubmit, onBack, isSubmitting, error }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Review & Submit</h2>

      <div className="space-y-6 mb-6">
        <div>
          <div className="text-sm text-gray-600 mb-1">Project</div>
          <div className="font-semibold">{data.projectTitle}</div>
        </div>

        <div>
          <div className="text-sm text-gray-600 mb-1">Funding Target</div>
          <div className="font-semibold">${data.fundingTarget?.toLocaleString()}</div>
        </div>

        <div>
          <div className="text-sm text-gray-600 mb-1">Signers & Required Signatures</div>
          <div className="font-semibold">{data.signers.length} signers, {data.requiredSignatures} required</div>
        </div>

        <div>
          <div className="text-sm text-gray-600 mb-2">Milestones ({data.milestones.length})</div>
          <div className="space-y-2">
            {data.milestones.map((m: any, i: number) => (
              <div key={m.id} className="flex justify-between p-2 bg-gray-50 rounded">
                <span>#{i + 1}: {m.title}</span>
                <span className="font-semibold">${m.fundingAmount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <button onClick={onBack} disabled={isSubmitting} className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Creating Contract...' : 'Create Contract'}
        </button>
      </div>
    </div>
  );
}

function ConfirmationStep({ contractId, onViewDashboard, onCreateAnother }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-8 text-center">
      <div className="text-6xl mb-4">✅</div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Contract Created Successfully!</h2>
      <p className="text-gray-600 mb-8">
        Your escrow contract has been deployed and is ready to receive funding.
      </p>

      <div className="flex gap-4 justify-center">
        <button onClick={onViewDashboard} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
          View Dashboard
        </button>
        <button onClick={onCreateAnother} className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
          Create Another
        </button>
      </div>
    </div>
  );
}


