import React, { useState } from 'react';
import { GovernanceDashboard } from '../components/governance/GovernanceDashboard';
import { CreateProposalModal } from '../components/governance/CreateProposalModal';
import { useAuth } from '../contexts/AuthContext';

const GovernancePage: React.FC = () => {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);

  const handleCreateProposal = () => {
    setShowCreateModal(true);
  };

  const handleViewProposal = (proposalId: string) => {
    setSelectedProposalId(proposalId);
    // TODO: Navigate to proposal detail page
  };

  const handleProposalCreated = () => {
    // Refresh the dashboard
    window.location.reload();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600">Please connect your wallet to access governance features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GovernanceDashboard
          onCreateProposal={handleCreateProposal}
          onViewProposal={handleViewProposal}
        />

        <CreateProposalModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleProposalCreated}
        />
      </div>
    </div>
  );
};

export default GovernancePage;