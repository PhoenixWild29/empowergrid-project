import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../lib/logging/logger';
import { ProposalType, CreateProposalRequest } from '../../types/governance';

interface CreateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateProposalModal: React.FC<CreateProposalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { walletAddress } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateProposalRequest>({
    type: ProposalType.PROJECT_FUNDING,
    title: '',
    description: '',
    tags: [],
  });

  const [targetContractStr, setTargetContractStr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletAddress) {
      setError('Wallet not connected');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!formData.title.trim() || !formData.description.trim()) {
        throw new Error('Title and description are required');
      }

      // Type-specific validation
      switch (formData.type) {
        case ProposalType.PROJECT_FUNDING:
          if (
            !formData.projectId ||
            !formData.fundingAmount ||
            formData.fundingAmount <= 0
          ) {
            throw new Error(
              'Project funding requires valid project ID and funding amount'
            );
          }
          break;
        case ProposalType.MILESTONE_APPROVAL:
          if (!formData.projectId || !formData.milestoneId) {
            throw new Error(
              'Milestone approval requires project ID and milestone ID'
            );
          }
          break;
        case ProposalType.PARAMETER_CHANGE:
          if (!formData.targetContract || !formData.targetFunction) {
            throw new Error(
              'Parameter change requires target contract and function'
            );
          }
          break;
        case ProposalType.TREASURY_ALLOCATION:
          if (!formData.fundingAmount || formData.fundingAmount <= 0) {
            throw new Error(
              'Treasury allocation requires valid funding amount'
            );
          }
          break;
      }

      // Prepare request data
      const requestData = { ...formData };
      if (targetContractStr) {
        // Add targetContract as string, service will handle conversion
        (requestData as any).targetContract = targetContractStr;
      }

      const response = await fetch('/api/governance/proposals/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress.toString(),
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create proposal');
      }

      const result = await response.json();

      logger.info('Proposal created successfully', {
        proposalId: result.data.id,
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      logger.error('Failed to create proposal', {
        error: (err as Error).message,
      });
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: ProposalType.PROJECT_FUNDING,
      title: '',
      description: '',
      tags: [],
    });
    setTargetContractStr('');
    setError(null);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case ProposalType.PROJECT_FUNDING:
        return (
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium mb-1'>
                Project ID
              </label>
              <input
                type='text'
                value={formData.projectId}
                onChange={e =>
                  setFormData({ ...formData, projectId: e.target.value })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md'
                placeholder='Enter project ID'
                required
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>
                Funding Amount (SOL)
              </label>
              <input
                type='number'
                value={formData.fundingAmount}
                onChange={e =>
                  setFormData({
                    ...formData,
                    fundingAmount: parseFloat(e.target.value) || 0,
                  })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md'
                placeholder='0.00'
                min='0'
                step='0.01'
                required
              />
            </div>
          </div>
        );

      case ProposalType.MILESTONE_APPROVAL:
        return (
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium mb-1'>
                Project ID
              </label>
              <input
                type='text'
                value={formData.projectId}
                onChange={e =>
                  setFormData({ ...formData, projectId: e.target.value })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md'
                placeholder='Enter project ID'
                required
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>
                Milestone ID
              </label>
              <input
                type='text'
                value={formData.milestoneId}
                onChange={e =>
                  setFormData({ ...formData, milestoneId: e.target.value })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md'
                placeholder='Enter milestone ID'
                required
              />
            </div>
          </div>
        );

      case ProposalType.PARAMETER_CHANGE:
        return (
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium mb-1'>
                Target Contract
              </label>
              <input
                type='text'
                value={targetContractStr}
                onChange={e => setTargetContractStr(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md'
                placeholder='Contract address or name'
                required
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>
                Target Function
              </label>
              <input
                type='text'
                value={formData.targetFunction}
                onChange={e =>
                  setFormData({ ...formData, targetFunction: e.target.value })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md'
                placeholder='Function name'
                required
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>
                Parameters (JSON)
              </label>
              <textarea
                value={JSON.stringify(formData.parameters, null, 2)}
                onChange={e => {
                  try {
                    const params = JSON.parse(e.target.value);
                    setFormData({ ...formData, parameters: params });
                  } catch {
                    // Invalid JSON, keep current value
                  }
                }}
                className='w-full px-3 py-2 border border-gray-300 rounded-md'
                placeholder='["param1", "param2"]'
                rows={3}
              />
            </div>
          </div>
        );

      case ProposalType.TREASURY_ALLOCATION:
        return (
          <div>
            <label className='block text-sm font-medium mb-1'>
              Allocation Amount (SOL)
            </label>
            <input
              type='number'
              value={formData.fundingAmount}
              onChange={e =>
                setFormData({
                  ...formData,
                  fundingAmount: parseFloat(e.target.value) || 0,
                })
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md'
              placeholder='0.00'
              min='0'
              step='0.01'
              required
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
        <div className='p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-xl font-semibold'>Create New Proposal</h2>
            <button
              onClick={handleClose}
              className='text-gray-500 hover:text-gray-700'
            >
              <X className='w-6 h-6' />
            </button>
          </div>

          <p className='text-gray-600 mb-6'>
            Create a governance proposal for the community to vote on.
          </p>

          <form onSubmit={handleSubmit} className='space-y-6'>
            {error && (
              <Alert>
                <AlertTriangle className='h-4 w-4' />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium mb-1'>
                  Proposal Type
                </label>
                <select
                  value={formData.type}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      type: e.target.value as ProposalType,
                    })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md'
                >
                  <option value={ProposalType.PROJECT_FUNDING}>
                    Project Funding
                  </option>
                  <option value={ProposalType.MILESTONE_APPROVAL}>
                    Milestone Approval
                  </option>
                  <option value={ProposalType.PARAMETER_CHANGE}>
                    Parameter Change
                  </option>
                  <option value={ProposalType.TREASURY_ALLOCATION}>
                    Treasury Allocation
                  </option>
                  <option value={ProposalType.EMERGENCY_ACTION}>
                    Emergency Action
                  </option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium mb-1'>Title</label>
                <input
                  type='text'
                  value={formData.title}
                  onChange={e =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md'
                  placeholder='Proposal title'
                  required
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium mb-1'>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md'
                placeholder='Detailed description of the proposal'
                rows={4}
                required
              />
            </div>

            {renderTypeSpecificFields()}

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium mb-1'>
                  Discussion URL (Optional)
                </label>
                <input
                  type='url'
                  value={formData.discussionUrl}
                  onChange={e =>
                    setFormData({ ...formData, discussionUrl: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md'
                  placeholder='https://forum.example.com/proposal'
                />
              </div>

              <div>
                <label className='block text-sm font-medium mb-1'>
                  Tags (Optional)
                </label>
                <input
                  type='text'
                  value={formData.tags?.join(', ') || ''}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      tags: e.target.value
                        .split(',')
                        .map(tag => tag.trim())
                        .filter(tag => tag),
                    })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md'
                  placeholder='tag1, tag2, tag3'
                />
              </div>
            </div>

            <div className='flex justify-end gap-3'>
              <Button
                type='button'
                variant='outline'
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={loading}>
                {loading && <Loader2 className='w-4 h-4 mr-2 animate-spin' />}
                Create Proposal
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
