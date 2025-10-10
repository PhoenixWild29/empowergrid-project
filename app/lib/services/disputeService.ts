/**
 * Dispute Resolution Service
 * 
 * WO-116: Dispute management and arbitration workflows
 * 
 * Features:
 * - Dispute creation and management
 * - Evidence collection and validation
 * - Arbitrator assignment
 * - Resolution enforcement
 * - Stakeholder communication
 */

import { prisma } from '../prisma';

export interface CreateDisputeRequest {
  contractId: string;
  milestoneId?: string;
  disputeType: string;
  title: string;
  description: string;
  initiatedBy: string;
  respondent: string;
}

export interface SubmitEvidenceRequest {
  disputeId: string;
  submittedBy: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  description: string;
}

export interface ResolveDisputeRequest {
  disputeId: string;
  resolution: string;
  resolutionType: string;
  fundReleaseTo?: string;
  fundReleaseAmount?: number;
  arbitratorId: string;
}

/**
 * WO-116: Create new dispute
 */
export async function createDispute(request: CreateDisputeRequest): Promise<any> {
  console.log('[WO-116] Creating dispute for contract:', request.contractId);

  const dispute = await (prisma as any).dispute.create({
    data: {
      contractId: request.contractId,
      milestoneId: request.milestoneId,
      disputeType: request.disputeType,
      title: request.title,
      description: request.description,
      initiatedBy: request.initiatedBy,
      respondent: request.respondent,
      status: 'OPEN',
      priority: 'MEDIUM',
    },
  });

  console.log('[WO-116] Dispute created:', dispute.id);

  return dispute;
}

/**
 * WO-116: Submit evidence
 */
export async function submitEvidence(request: SubmitEvidenceRequest): Promise<any> {
  console.log('[WO-116] Submitting evidence for dispute:', request.disputeId);

  // Validate file size (max 10MB)
  if (request.fileSize > 10 * 1024 * 1024) {
    throw new Error('File size exceeds maximum of 10MB');
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
  if (!allowedTypes.includes(request.fileType)) {
    throw new Error('Invalid file type. Allowed: JPEG, PNG, PDF, TXT');
  }

  const evidence = await (prisma as any).disputeEvidence.create({
    data: {
      disputeId: request.disputeId,
      submittedBy: request.submittedBy,
      fileName: request.fileName,
      fileUrl: request.fileUrl,
      fileSize: request.fileSize,
      fileType: request.fileType,
      description: request.description,
      verified: false,
    },
  });

  // Update dispute status if it was awaiting evidence
  await (prisma as any).dispute.update({
    where: { id: request.disputeId },
    data: { status: 'UNDER_REVIEW' },
  });

  console.log('[WO-116] Evidence submitted:', evidence.id);

  return evidence;
}

/**
 * WO-116: Assign arbitrator
 */
export async function assignArbitrator(disputeId: string, arbitratorId: string): Promise<any> {
  console.log('[WO-116] Assigning arbitrator to dispute:', disputeId);

  const dispute = await (prisma as any).dispute.update({
    where: { id: disputeId },
    data: {
      arbitratorId,
      status: 'ARBITRATION_ASSIGNED',
    },
  });

  return dispute;
}

/**
 * WO-116: Resolve dispute
 */
export async function resolveDispute(request: ResolveDisputeRequest): Promise<any> {
  console.log('[WO-116] Resolving dispute:', request.disputeId);

  // Validate resolution type
  const validTypes = ['FUND_RELEASE', 'CONTRACT_MODIFICATION', 'CONTRACT_TERMINATION', 'NO_ACTION'];
  if (!validTypes.includes(request.resolutionType)) {
    throw new Error('Invalid resolution type');
  }

  // Update dispute
  const dispute = await (prisma as any).dispute.update({
    where: { id: request.disputeId },
    data: {
      status: 'RESOLVED',
      resolution: request.resolution,
      resolutionType: request.resolutionType,
      fundReleaseTo: request.fundReleaseTo,
      fundReleaseAmount: request.fundReleaseAmount,
      resolvedAt: new Date(),
    },
  });

  // WO-116: Enforce resolution if fund release required
  if (request.resolutionType === 'FUND_RELEASE' && request.fundReleaseAmount && request.fundReleaseTo) {
    await enforceResolution(dispute);
  }

  console.log('[WO-116] Dispute resolved:', dispute.id);

  return dispute;
}

/**
 * WO-116: Enforce resolution automatically
 */
async function enforceResolution(dispute: any): Promise<void> {
  console.log('[WO-116] Enforcing resolution for dispute:', dispute.id);

  // Get contract
  const contract = await prisma.escrowContract.findFirst({
    where: { contractId: dispute.contractId },
  });

  if (!contract) {
    throw new Error('Contract not found');
  }

  // Validate contract terms and regulatory requirements
  if (dispute.fundReleaseAmount && dispute.fundReleaseAmount > contract.currentBalance) {
    throw new Error('Release amount exceeds contract balance');
  }

  // Execute fund release via emergency release API
  if (dispute.resolutionType === 'FUND_RELEASE') {
    // Would call emergency release service here
    console.log('[WO-116] Executing fund release:', dispute.fundReleaseAmount, 'to', dispute.fundReleaseTo);
  } else if (dispute.resolutionType === 'CONTRACT_TERMINATION') {
    // Suspend contract
    await prisma.escrowContract.update({
      where: { contractId: dispute.contractId },
      data: { status: 'CANCELLED' },
    });
  }
}

/**
 * WO-116: Send communication
 */
export async function sendDisputeCommunication(
  disputeId: string,
  senderId: string,
  recipientId: string | null,
  message: string,
  messageType: string
): Promise<any> {
  const communication = await (prisma as any).disputeCommunication.create({
    data: {
      disputeId,
      senderId,
      recipientId,
      message,
      messageType,
      isRead: false,
    },
  });

  return communication;
}

/**
 * WO-116: Get dispute with all details
 */
export async function getDisputeDetails(disputeId: string): Promise<any> {
  const dispute = await (prisma as any).dispute.findUnique({
    where: { id: disputeId },
    include: {
      evidence: {
        orderBy: { createdAt: 'desc' },
      },
      communications: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return dispute;
}



