/**
 * Contract Administration Service
 * 
 * WO-105: Comprehensive contract administration data retrieval
 * 
 * Features:
 * - Governance information aggregation
 * - Approval workflow tracking
 * - Modification history
 * - Pending operations status
 * - Stakeholder roles and permissions
 */

import { prisma } from '../prisma';

// WO-105: Contract Administration Data Types
export interface SignatureRequirements {
  currentThreshold: number;
  totalSigners: number;
  requiredSignatures: number;
  authorizedSigners: string[];
  pendingApprovals: number;
}

export interface PendingModification {
  id: string;
  type: 'PARAMETER_UPDATE' | 'MILESTONE_CHANGE' | 'ORACLE_UPDATE' | 'EMERGENCY_RELEASE';
  description: string;
  proposedBy: string;
  proposedAt: string;
  requiredApprovals: number;
  currentApprovals: number;
  approvers: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  expiresAt?: string;
  data: any;
}

export interface AdministrativeHistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  authorizedBy: string;
  details: string;
  changeType: 'CONTRACT_CREATED' | 'PARAMETER_UPDATED' | 'MILESTONE_MODIFIED' | 'EMERGENCY_ACTION' | 'STATUS_CHANGED';
  beforeState?: any;
  afterState?: any;
}

export interface PendingOperation {
  id: string;
  type: string;
  description: string;
  status: 'QUEUED' | 'IN_PROGRESS' | 'TIME_LOCKED' | 'AWAITING_APPROVAL';
  expectedCompletionTime?: string;
  requiredApprovals: string[];
  currentApprovals: string[];
  createdAt: string;
}

export interface ContractGovernanceInfo {
  governanceModel: 'MULTI_SIG' | 'DAO' | 'HYBRID';
  votingThreshold: number;
  proposalMinimum: number;
  executionDelay: number;
  stakeholders: Array<{
    address: string;
    role: 'CREATOR' | 'FUNDER' | 'VERIFIER' | 'ADMIN';
    votingPower: number;
  }>;
}

export interface ApprovalWorkflow {
  workflowId: string;
  workflowType: string;
  currentStage: string;
  totalStages: number;
  completedStages: number;
  requiredApprovals: number;
  receivedApprovals: number;
  approvalHistory: Array<{
    approver: string;
    approved: boolean;
    timestamp: string;
    comment?: string;
  }>;
  nextApprovers: string[];
  deadlines: {
    proposed: string;
    expires: string;
    executionWindow?: string;
  };
}

export interface ModificationTracking {
  totalModifications: number;
  pendingModifications: number;
  approvedModifications: number;
  rejectedModifications: number;
  recentChanges: AdministrativeHistoryEntry[];
  changesByType: Record<string, number>;
}

export interface ContractAdministrationData {
  contractId: string;
  projectId: string;
  signatureRequirements: SignatureRequirements;
  pendingModifications: PendingModification[];
  administrativeHistory: AdministrativeHistoryEntry[];
  governanceInfo: ContractGovernanceInfo;
  approvalWorkflows: ApprovalWorkflow[];
  modificationTracking: ModificationTracking;
  pendingOperations: PendingOperation[];
  metadata: {
    lastAdminAction: string;
    adminActionCount: number;
    contractAge: number;
    securityLevel: 'STANDARD' | 'ENHANCED' | 'CRITICAL';
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  actionType?: string;
  dateFrom?: string;
  dateTo?: string;
  authorizedBy?: string;
  status?: string;
}

/**
 * WO-105: Retrieve comprehensive contract administration data
 */
export async function getContractAdministrationData(
  contractId: string,
  userId: string,
  pagination?: PaginationParams,
  filters?: FilterParams
): Promise<ContractAdministrationData> {
  // Fetch escrow contract with all relations
  const contract = await prisma.escrowContract.findUnique({
    where: { contractId },
    include: {
      project: {
        include: {
          creator: {
            select: { id: true, username: true, walletAddress: true },
          },
        },
      },
      deposits: {
        select: {
          id: true,
          depositorId: true,
          depositorWallet: true,
          amount: true,
          transactionStatus: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });
  
  // Fetch fund releases separately if contract exists
  let releases: any[] = [];
  if (contract) {
    try {
      releases = await (prisma as any).fundRelease.findMany({
        where: { escrowContractId: contract.id },
        select: {
          id: true,
          milestoneId: true,
          amount: true,
          transactionHash: true,
          releasedAt: true,
        },
        orderBy: { releasedAt: 'desc' },
        take: 10,
      });
    } catch (error) {
      console.log('[WO-105] FundRelease query not available, using empty array');
      releases = [];
    }
  }

  if (!contract) {
    throw new Error('Contract not found');
  }

  // WO-105: Build signature requirements
  const signatureRequirements: SignatureRequirements = {
    currentThreshold: contract.requiredSignatures,
    totalSigners: Array.isArray(contract.signers) ? (contract.signers as any[]).length : 0,
    requiredSignatures: contract.requiredSignatures,
    authorizedSigners: Array.isArray(contract.signers) ? (contract.signers as any[]) : [],
    pendingApprovals: 0, // Would be calculated from pending modifications
  };

  // WO-105: Fetch pending modifications (placeholder - would query from ContractParameterHistory)
  const pendingModifications: PendingModification[] = [];

  // WO-105: Build administrative history from various sources
  const administrativeHistory: AdministrativeHistoryEntry[] = [];

  // Add contract creation
  administrativeHistory.push({
    id: contract.id,
    timestamp: contract.createdAt.toISOString(),
    action: 'Contract Created',
    authorizedBy: contract.createdBy,
    details: `Escrow contract created for project ${contract.projectId}`,
    changeType: 'CONTRACT_CREATED',
    afterState: {
      fundingTarget: contract.fundingTarget,
      status: contract.status,
      signers: contract.signers,
    },
  });

  // Add deposits to history
  contract.deposits.forEach((deposit: any) => {
    administrativeHistory.push({
      id: deposit.id,
      timestamp: deposit.createdAt.toISOString(),
      action: 'Funds Deposited',
      authorizedBy: deposit.depositorId,
      details: `Deposit of ${deposit.amount} USDC from ${deposit.depositorWallet}`,
      changeType: 'STATUS_CHANGED',
    });
  });

  // Add fund releases to history
  releases.forEach((release: any) => {
    administrativeHistory.push({
      id: release.id,
      timestamp: release.releasedAt.toISOString(),
      action: 'Funds Released',
      authorizedBy: 'system', // Would be actual user from release record
      details: `Released ${release.amount} USDC for milestone ${release.milestoneId}`,
      changeType: 'EMERGENCY_ACTION',
    });
  });

  // Sort by timestamp (most recent first)
  administrativeHistory.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Apply pagination to history
  const page = pagination?.page || 1;
  const limit = pagination?.limit || 50;
  const startIndex = (page - 1) * limit;
  const paginatedHistory = administrativeHistory.slice(startIndex, startIndex + limit);

  // WO-105: Build governance information
  const governanceInfo: ContractGovernanceInfo = {
    governanceModel: contract.requiredSignatures > 1 ? 'MULTI_SIG' : 'MULTI_SIG',
    votingThreshold: contract.requiredSignatures,
    proposalMinimum: 1,
    executionDelay: 0, // Would come from config
    stakeholders: [
      {
        address: contract.project.creator.walletAddress,
        role: 'CREATOR',
        votingPower: 1,
      },
      ...(Array.isArray(contract.signers) ? (contract.signers as any[]).map((signer: string) => ({
        address: signer,
        role: 'ADMIN' as const,
        votingPower: 1,
      })) : []),
    ],
  };

  // WO-105: Build approval workflows (placeholder)
  const approvalWorkflows: ApprovalWorkflow[] = [];

  // WO-105: Build modification tracking
  const modificationTracking: ModificationTracking = {
    totalModifications: administrativeHistory.length,
    pendingModifications: pendingModifications.length,
    approvedModifications: administrativeHistory.filter(h => 
      h.changeType === 'PARAMETER_UPDATED' || h.changeType === 'MILESTONE_MODIFIED'
    ).length,
    rejectedModifications: 0,
    recentChanges: paginatedHistory.slice(0, 10),
    changesByType: administrativeHistory.reduce((acc, entry) => {
      acc[entry.changeType] = (acc[entry.changeType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  // WO-105: Build pending operations
  const pendingOperations: PendingOperation[] = [];

  // Check for pending deposits
  const pendingDeposits = contract.deposits.filter(
    (d: any) => d.transactionStatus === 'PENDING'
  );
  pendingDeposits.forEach((deposit: any) => {
    pendingOperations.push({
      id: deposit.id,
      type: 'DEPOSIT',
      description: `Deposit of ${deposit.amount} USDC`,
      status: 'IN_PROGRESS',
      requiredApprovals: [],
      currentApprovals: [],
      createdAt: deposit.createdAt.toISOString(),
    });
  });

  // WO-105: Build metadata
  const contractAge = Math.floor(
    (Date.now() - contract.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  const metadata = {
    lastAdminAction: administrativeHistory[0]?.timestamp || contract.createdAt.toISOString(),
    adminActionCount: administrativeHistory.length,
    contractAge,
    securityLevel: (contract.requiredSignatures > 2 ? 'ENHANCED' : 
                    contract.requiredSignatures > 1 ? 'STANDARD' : 
                    'STANDARD') as 'STANDARD' | 'ENHANCED' | 'CRITICAL',
  };

  return {
    contractId: contract.contractId,
    projectId: contract.projectId,
    signatureRequirements,
    pendingModifications,
    administrativeHistory: paginatedHistory,
    governanceInfo,
    approvalWorkflows,
    modificationTracking,
    pendingOperations,
    metadata,
  };
}

/**
 * WO-105: Check if user is authorized to access administration data
 */
export async function isAuthorizedForAdministration(
  contractId: string,
  userId: string
): Promise<boolean> {
  const contract = await prisma.escrowContract.findUnique({
    where: { contractId },
    include: {
      project: {
        select: { creatorId: true },
      },
    },
  });

  if (!contract) {
    return false;
  }

  // User is authorized if they are:
  // 1. Contract creator
  if (contract.createdBy === userId) {
    return true;
  }

  // 2. Project creator
  if (contract.project.creatorId === userId) {
    return true;
  }

  // 3. One of the authorized signers
  if (Array.isArray(contract.signers)) {
    const signers = contract.signers as any[];
    // Would need to check wallet address, but we only have userId
    // This would require querying user table
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true },
    });
    
    if (user && signers.includes(user.walletAddress)) {
      return true;
    }
  }

  return false;
}

/**
 * WO-105: Get filtered administrative history
 */
export async function getFilteredAdministrativeHistory(
  contractId: string,
  filters: FilterParams,
  pagination: PaginationParams
): Promise<{
  data: AdministrativeHistoryEntry[];
  total: number;
  page: number;
  totalPages: number;
}> {
  // This would apply filters to the administrative history
  // For now, we'll use the full data and filter in memory
  const data = await getContractAdministrationData(contractId, '', pagination, filters);
  
  let filteredHistory = data.administrativeHistory;

  // Apply filters
  if (filters.actionType) {
    filteredHistory = filteredHistory.filter(h => h.changeType === filters.actionType);
  }

  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom);
    filteredHistory = filteredHistory.filter(h => 
      new Date(h.timestamp) >= fromDate
    );
  }

  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo);
    filteredHistory = filteredHistory.filter(h => 
      new Date(h.timestamp) <= toDate
    );
  }

  if (filters.authorizedBy) {
    filteredHistory = filteredHistory.filter(h => 
      h.authorizedBy === filters.authorizedBy
    );
  }

  if (filters.status) {
    // Would filter by status if applicable
  }

  const page = pagination.page || 1;
  const limit = pagination.limit || 50;
  const total = filteredHistory.length;
  const totalPages = Math.ceil(total / limit);

  return {
    data: filteredHistory,
    total,
    page,
    totalPages,
  };
}



