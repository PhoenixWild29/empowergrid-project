import React from 'react';
import { useRouter } from 'next/router';
import { ProposalDetail } from '../../../components/governance/ProposalDetail';

const ProposalDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  const handleBack = () => {
    router.push('/governance');
  };

  if (!id || typeof id !== 'string') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Proposal ID</h1>
          <p className="text-gray-600">The proposal ID provided is not valid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ProposalDetail proposalId={id} onBack={handleBack} />
      </div>
    </div>
  );
};

export default ProposalDetailPage;