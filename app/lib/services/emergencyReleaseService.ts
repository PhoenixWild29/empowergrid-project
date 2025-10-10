/**
 * Emergency Release Service
 * 
 * WO-99: Emergency fund release with time-locked execution
 * 
 * Features:
 * - Emergency release initiation
 * - Multi-signature approval tracking
 * - Time-lock management
 * - Partial and full releases
 * - Contract suspension
 * - Dispute arbitration integration
 */

import { prisma } from '../prisma';
import { createTimeLock, isTimeLockMatured } from './timeLockService';

export interface EmergencyReleaseRequest {
  contractId: string;
  releaseType: 'PARTIAL_RELEASE' | 'FULL_RELEASE' | 'CONTRACT_SUSPENSION' | 'DISPUTE_RESOLUTION';
  amount?: number;
  recipient: string;
  reason: string;
  proposer: string;
  timeLockDelaySeconds?: number;
}

/**
 * WO-99: Initiate emergency fund release
 */
export async function initiateEmergencyRelease(
  request: EmergencyReleaseRequest
): Promise<any> {
  console.log('[WO-99] Initiating emergency release for contract:', request.contractId);

  // Fetch contract to get signature requirements
  const contract = await prisma.escrowContract.findUnique({
    where: { contractId: request.contractId },
    select: {
      id: true,
      contractId: true,
      requiredSignatures: true,
      signers: true,
      currentBalance: true,
      status: true,
    },
  });

  if (!contract) {
    throw new Error('Contract not found');
  }

  // Validate request
  if (request.releaseType === 'PARTIAL_RELEASE' && !request.amount) {
    throw new Error('Amount is required for partial release');
  }

  if (request.amount && request.amount > contract.currentBalance) {
    throw new Error(`Release amount (${request.amount}) exceeds contract balance (${contract.currentBalance})`);
  }

  // Calculate time-lock delay (default 24 hours)
  const timeLockDelay = request.timeLockDelaySeconds || 24 * 60 * 60;
  const canExecuteAt = new Date(Date.now() + timeLockDelay * 1000);

  // Create time-lock
  const timeLock = await createTimeLock(
    request.contractId,
    'EMERGENCY_RELEASE',
    request.proposer,
    {
      releaseType: request.releaseType,
      amount: request.amount,
      recipient: request.recipient,
      reason: request.reason,
    },
    timeLockDelay
  );

  // Create emergency release record
  const emergencyRelease = await (prisma as any).emergencyRelease.create({
    data: {
      contractId: contract.contractId,
      releaseType: request.releaseType,
      amount: request.amount,
      recipient: request.recipient,
      reason: request.reason,
      proposedBy: request.proposer,
      approvers: [],
      requiredApprovals: contract.requiredSignatures,
      currentApprovals: 0,
      timeLockId: timeLock.id,
      timeLockDelay,
      canExecuteAt,
      status: 'PENDING',
    },
  });

  console.log('[WO-99] Emergency release created:', emergencyRelease.id);

  return {
    releaseId: emergencyRelease.id,
    timeLockId: timeLock.id,
    canExecuteAt: canExecuteAt.toISOString(),
    requiredApprovals: contract.requiredSignatures,
    currentApprovals: 0,
    status: 'PENDING',
  };
}

/**
 * WO-99: Approve emergency release
 */
export async function approveEmergencyRelease(
  releaseId: string,
  approver: string
): Promise<{
  approved: boolean;
  currentApprovals: number;
  requiredApprovals: number;
}> {
  const release = await (prisma as any).emergencyRelease.findUnique({
    where: { id: releaseId },
  });

  if (!release) {
    throw new Error('Emergency release not found');
  }

  if (release.status !== 'PENDING' && release.status !== 'APPROVED') {
    throw new Error(`Cannot approve release with status: ${release.status}`);
  }

  // Check if approver already approved
  const approvers = Array.isArray(release.approvers) ? release.approvers : [];
  if (approvers.includes(approver)) {
    throw new Error('Approver has already approved this release');
  }

  // Add approver
  approvers.push(approver);
  const currentApprovals = approvers.length;
  const approved = currentApprovals >= release.requiredApprovals;

  // Update release
  await (prisma as any).emergencyRelease.update({
    where: { id: releaseId },
    data: {
      approvers,
      currentApprovals,
      status: approved ? 'APPROVED' : 'PENDING',
    },
  });

  console.log('[WO-99] Emergency release approved by:', approver, 
    `(${currentApprovals}/${release.requiredApprovals})`);

  return {
    approved,
    currentApprovals,
    requiredApprovals: release.requiredApprovals,
  };
}

/**
 * WO-99: Execute emergency release
 */
export async function executeEmergencyRelease(
  releaseId: string,
  executor: string
): Promise<{
  executed: boolean;
  transactionHash: string;
  amount: number;
}> {
  const release = await (prisma as any).emergencyRelease.findUnique({
    where: { id: releaseId },
    include: {
      contract: true,
    },
  });

  if (!release) {
    throw new Error('Emergency release not found');
  }

  // Verify status
  if (release.status !== 'APPROVED' && release.status !== 'READY_TO_EXECUTE') {
    throw new Error(`Cannot execute release with status: ${release.status}`);
  }

  // Verify approvals
  if (release.currentApprovals < release.requiredApprovals) {
    throw new Error(`Insufficient approvals (${release.currentApprovals}/${release.requiredApprovals})`);
  }

  // Verify time-lock has matured
  if (release.timeLockId && !isTimeLockMatured(release.timeLockId)) {
    throw new Error('Time-lock has not matured yet');
  }

  // Execute release (simulate blockchain transaction)
  const transactionHash = `emergency_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Update release record
  await (prisma as any).emergencyRelease.update({
    where: { id: releaseId },
    data: {
      status: 'EXECUTED',
      executedAt: new Date(),
      transactionHash,
    },
  });

  // Update contract balance if partial release
  if (release.releaseType === 'PARTIAL_RELEASE' && release.amount) {
    await prisma.escrowContract.update({
      where: { contractId: release.contractId },
      data: {
        currentBalance: {
          decrement: release.amount,
        },
      },
    });
  } else if (release.releaseType === 'FULL_RELEASE') {
    // Set balance to 0 for full release
    await prisma.escrowContract.update({
      where: { contractId: release.contractId },
      data: {
        currentBalance: 0,
        status: 'COMPLETED',
      },
    });
  } else if (release.releaseType === 'CONTRACT_SUSPENSION') {
    // Suspend contract
    await prisma.escrowContract.update({
      where: { contractId: release.contractId },
      data: {
        status: 'EMERGENCY_STOPPED',
      },
    });
  }

  console.log('[WO-99] Emergency release executed:', releaseId, 'tx:', transactionHash);

  return {
    executed: true,
    transactionHash,
    amount: release.amount || release.contract?.currentBalance || 0,
  };
}

/**
 * WO-99: Cancel emergency release
 */
export async function cancelEmergencyRelease(
  releaseId: string,
  canceller: string,
  reason: string
): Promise<void> {
  const release = await (prisma as any).emergencyRelease.findUnique({
    where: { id: releaseId },
  });

  if (!release) {
    throw new Error('Emergency release not found');
  }

  if (release.status === 'EXECUTED') {
    throw new Error('Cannot cancel executed release');
  }

  await (prisma as any).emergencyRelease.update({
    where: { id: releaseId },
    data: {
      status: 'CANCELLED',
      metadata: {
        cancelledBy: canceller,
        cancellationReason: reason,
        cancelledAt: new Date().toISOString(),
      },
    },
  });

  console.log('[WO-99] Emergency release cancelled:', releaseId, 'by:', canceller);
}

/**
 * WO-99: Get emergency release status
 */
export async function getEmergencyReleaseStatus(releaseId: string): Promise<any> {
  const release = await (prisma as any).emergencyRelease.findUnique({
    where: { id: releaseId },
  });

  if (!release) {
    throw new Error('Emergency release not found');
  }

  return release;
}



