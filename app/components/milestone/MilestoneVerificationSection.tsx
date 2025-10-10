/**
 * Milestone Verification Section
 * 
 * WO-113: Main container for milestone verification UI
 * 
 * Features:
 * - File upload for verification evidence
 * - External link submission
 * - Verification status display
 * - Oracle status communication
 * - Detailed feedback display
 * - Evidence guidance
 */

import React, { useState } from 'react';
import MilestoneEvidenceUpload from './MilestoneEvidenceUpload';
import MilestoneEvidenceLinkInput from './MilestoneEvidenceLinkInput';
import MilestoneVerificationButton from './MilestoneVerificationButton';
import MilestoneStatusDisplay from './MilestoneStatusDisplay';
import MilestoneOracleStatus from './MilestoneOracleStatus';
import MilestoneFeedbackDisplay from './MilestoneFeedbackDisplay';
import MilestoneGuidance from './MilestoneGuidance';

interface MilestoneVerificationSectionProps {
  milestone: any;
  projectId: string;
  escrowContractId: string;
}

export default function MilestoneVerificationSection({
  milestone,
  projectId,
  escrowContractId,
}: MilestoneVerificationSectionProps) {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [evidenceLinks, setEvidenceLinks] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // WO-113: Handle verification submission
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/milestones/${milestone.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationProof: {
            files: uploadedFiles,
            links: evidenceLinks,
          },
          evidenceFiles: uploadedFiles,
          evidenceLinks,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setVerificationResult(data.verification);
      } else {
        alert(data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('[WO-113] Verification error:', error);
      alert('Failed to submit verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* WO-113: Milestone Status */}
      <MilestoneStatusDisplay milestone={milestone} />

      {/* WO-113: Guidance */}
      <MilestoneGuidance milestoneType={milestone.type || 'ENERGY_PRODUCTION'} />

      {/* WO-113: Evidence Collection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Verification Evidence</h3>
        
        <div className="space-y-6">
          <MilestoneEvidenceUpload
            onFilesUploaded={(files) => setUploadedFiles(files)}
          />

          <MilestoneEvidenceLinkInput
            onLinksAdded={(links) => setEvidenceLinks(links)}
          />

          <MilestoneVerificationButton
            onSubmit={handleSubmit}
            isDisabled={isSubmitting || (uploadedFiles.length === 0 && evidenceLinks.length === 0)}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>

      {/* WO-113: Oracle Status (if oracle verification is used) */}
      {escrowContractId && (
        <MilestoneOracleStatus
          escrowContractId={escrowContractId}
          milestoneId={milestone.id}
        />
      )}

      {/* WO-113: Verification Feedback */}
      {verificationResult && (
        <MilestoneFeedbackDisplay result={verificationResult} />
      )}
    </div>
  );
}



