/**
 * Parameter Change Proposal Interface
 * 
 * WO-112: Submit governance proposals with justification and impact analysis
 */

import React, { useState } from 'react';

interface ParameterChangeProposalInterfaceProps {
  contractId: string;
}

export default function ParameterChangeProposalInterface({ contractId }: ParameterChangeProposalInterfaceProps) {
  const [proposalType, setProposalType] = useState('');
  const [justification, setJustification] = useState('');
  const [impactAnalysis, setImpactAnalysis] = useState('');
  const [votingSchedule, setVotingSchedule] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const proposalTypes = [
    { value: 'MILESTONE_UPDATE', label: 'Milestone Update' },
    { value: 'ORACLE_CONFIGURATION', label: 'Oracle Configuration' },
    { value: 'SIGNER_UPDATE', label: 'Signer Update' },
    { value: 'THRESHOLD_UPDATE', label: 'Threshold Update' },
  ];

  const handleSubmit = async () => {
    if (!proposalType || !justification || !impactAnalysis) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/escrow/contracts/${contractId}/parameters`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changeType: proposalType,
          reason: justification + '\\n\\nImpact: ' + impactAnalysis,
          expirationHours: 48,
          parameters: {}, // Would include actual parameters
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Proposal submitted successfully!');
        setProposalType('');
        setJustification('');
        setImpactAnalysis('');
        setVotingSchedule('');
      } else {
        alert(data.message || 'Failed to submit proposal');
      }
    } catch (error) {
      console.error('[WO-112] Proposal submission error:', error);
      alert('Failed to submit proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Submit Governance Proposal</h3>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Proposal Type *
          </label>
          <select
            value={proposalType}
            onChange={(e) => setProposalType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select proposal type</option>
            {proposalTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Detailed Justification *
          </label>
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Explain why this change is necessary..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Impact Analysis *
          </label>
          <textarea
            value={impactAnalysis}
            onChange={(e) => setImpactAnalysis(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Describe the expected impact on stakeholders and contract..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Voting Schedule
          </label>
          <input
            type="text"
            value={votingSchedule}
            onChange={(e) => setVotingSchedule(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 48 hours"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
        </button>
      </div>
    </div>
  );
}



