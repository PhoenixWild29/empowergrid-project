/**
 * Proposal Creation Form
 * 
 * WO-146: Create new governance proposals
 * 
 * Features:
 * - Title & description fields
 * - Character count validation
 * - Proposal type selection
 * - Real-time validation
 * - Success confirmation
 * - Error handling
 */

import { useState } from 'react';
import { useRouter } from 'next/router';

export default function CreateProposalPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    proposalType: 'GENERAL',
    votingPeriodDays: 7,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // WO-146: Client-side validation
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be 200 characters or less';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.length > 5000) {
      newErrors.description = 'Description must be 5000 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/governance/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/governance/proposals/${data.proposal.id}`);
        }, 2000);
      } else {
        setErrors({ submit: data.message || 'Failed to create proposal' });
      }
    } catch (error) {
      setErrors({ submit: 'Failed to submit proposal' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      title: '',
      description: '',
      proposalType: 'GENERAL',
      votingPeriodDays: 7,
    });
    setErrors({});
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Proposal Created!</h2>
          <p className="text-gray-600">Redirecting to proposal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Proposal</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
          {/* WO-146: Title field with character count */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={200}
              className={`w-full px-4 py-2 border rounded-lg ${errors.title ? 'border-red-500' : ''}`}
              placeholder="Enter proposal title"
            />
            <div className="flex justify-between items-center mt-1">
              {errors.title && <span className="text-red-500 text-sm">{errors.title}</span>}
              <span className={`text-sm ${formData.title.length > 180 ? 'text-red-500' : 'text-gray-500'} ml-auto`}>
                {formData.title.length}/200
              </span>
            </div>
          </div>

          {/* WO-146: Description field with character count */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              maxLength={5000}
              rows={10}
              className={`w-full px-4 py-2 border rounded-lg ${errors.description ? 'border-red-500' : ''}`}
              placeholder="Enter detailed proposal description"
            />
            <div className="flex justify-between items-center mt-1">
              {errors.description && <span className="text-red-500 text-sm">{errors.description}</span>}
              <span className={`text-sm ${formData.description.length > 4800 ? 'text-red-500' : 'text-gray-500'} ml-auto`}>
                {formData.description.length}/5000
              </span>
            </div>
          </div>

          {/* WO-146: Proposal type selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Proposal Type</label>
            <select
              value={formData.proposalType}
              onChange={(e) => setFormData({ ...formData, proposalType: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="GENERAL">General</option>
              <option value="PARAMETER_CHANGE">Parameter Change</option>
              <option value="TREASURY_ALLOCATION">Treasury Allocation</option>
              <option value="PROTOCOL_UPGRADE">Protocol Upgrade</option>
              <option value="EMERGENCY_ACTION">Emergency Action</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Voting Period (days)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={formData.votingPeriodDays}
              onChange={(e) => setFormData({ ...formData, votingPeriodDays: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          {/* Error message */}
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{errors.submit}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Proposal'}
            </button>
            
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



