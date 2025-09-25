import { PublicKey } from '@solana/web3.js';

// Governance proposal types
export enum ProposalType {
  PROJECT_FUNDING = 'project_funding',
  MILESTONE_APPROVAL = 'milestone_approval',
  PARAMETER_CHANGE = 'parameter_change',
  TREASURY_ALLOCATION = 'treasury_allocation',
  EMERGENCY_ACTION = 'emergency_action',
}

// Proposal status
export enum ProposalStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  SUCCEEDED = 'succeeded',
  DEFEATED = 'defeated',
  QUEUED = 'queued',
  EXECUTED = 'executed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

// Vote options
export enum VoteOption {
  YES = 'yes',
  NO = 'no',
  ABSTAIN = 'abstain',
}

// Voting power calculation methods
export enum VotingPowerMethod {
  TOKEN_BALANCE = 'token_balance',
  REPUTATION_BASED = 'reputation_based',
  STAKE_BASED = 'stake_based',
  HYBRID = 'hybrid',
}

// Governance parameters
export interface GovernanceConfig {
  // Proposal settings
  proposalThreshold: number; // Minimum tokens/reputation to create proposal
  quorumThreshold: number; // Minimum participation for valid vote
  approvalThreshold: number; // Minimum approval percentage
  votingPeriod: number; // Voting duration in blocks/seconds
  executionDelay: number; // Delay before execution in blocks/seconds

  // Voting power
  votingPowerMethod: VotingPowerMethod;
  minimumVotingPower: number;

  // Emergency settings
  emergencyQuorumThreshold: number;
  emergencyApprovalThreshold: number;
  emergencyVotingPeriod: number;

  // Treasury settings
  treasuryAllocationLimit: number; // Max percentage of treasury per proposal
}

// Proposal interface
export interface Proposal {
  id: string;
  type: ProposalType;
  title: string;
  description: string;
  proposer: PublicKey;
  proposerAddress: string;

  // Content
  targetContract?: PublicKey;
  targetFunction?: string;
  parameters?: Record<string, any>;

  // Project-specific fields
  projectId?: string;
  milestoneId?: string;
  fundingAmount?: number;

  // Voting
  startTime: Date;
  endTime: Date;
  status: ProposalStatus;

  // Results
  votes: {
    yes: number;
    no: number;
    abstain: number;
  };
  totalVotingPower: number;
  quorumReached: boolean;

  // Execution
  executedAt?: Date;
  executionTx?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  discussionUrl?: string;
}

// Vote interface
export interface Vote {
  id: string;
  proposalId: string;
  voter: PublicKey;
  voterAddress: string;
  option: VoteOption;
  votingPower: number;
  reason?: string;
  timestamp: Date;
  txHash?: string;
}

// Voter information
export interface VoterInfo {
  address: PublicKey;
  votingPower: number;
  hasVoted: boolean;
  voteOption?: VoteOption;
  lastVoteTime?: Date;
  reputation: number;
  tokenBalance: number;
  delegatedPower: number;
}

// Governance statistics
export interface GovernanceStats {
  totalProposals: number;
  activeProposals: number;
  totalVotes: number;
  averageParticipation: number;
  treasuryBalance: number;
  totalValueLocked: number;
  uniqueVoters: number;
}

// Milestone approval specific
export interface MilestoneApproval {
  milestoneId: string;
  projectId: string;
  title: string;
  description: string;
  deliverables: string[];
  budget: number;
  timeline: {
    startDate: Date;
    endDate: Date;
  };
  verificationMethod: 'oracle' | 'community' | 'automatic';
  requiredApprovals: number;
  currentApprovals: number;
  approvers: PublicKey[];
}

// Treasury allocation
export interface TreasuryAllocation {
  recipient: PublicKey;
  amount: number;
  purpose: string;
  justification: string;
  expectedImpact: string;
}

// Parameter change
export interface ParameterChange {
  parameter: string;
  currentValue: any;
  proposedValue: any;
  rationale: string;
  impact: string;
}

// Emergency action
export interface EmergencyAction {
  action: string;
  justification: string;
  immediate: boolean;
  affectedUsers: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// Proposal creation request
export interface CreateProposalRequest {
  type: ProposalType;
  title: string;
  description: string;
  targetContract?: PublicKey;
  targetFunction?: string;
  parameters?: Record<string, any>;

  // Type-specific data
  projectId?: string;
  milestoneId?: string;
  fundingAmount?: number;
  milestoneApproval?: MilestoneApproval;
  treasuryAllocation?: TreasuryAllocation;
  parameterChange?: ParameterChange;
  emergencyAction?: EmergencyAction;

  tags?: string[];
  discussionUrl?: string;
}

// Proposal update request
export interface UpdateProposalRequest {
  title?: string;
  description?: string;
  tags?: string[];
  discussionUrl?: string;
}

// Vote request
export interface CastVoteRequest {
  proposalId: string;
  option: VoteOption;
  reason?: string;
}

// Governance events
export enum GovernanceEventType {
  PROPOSAL_CREATED = 'proposal_created',
  PROPOSAL_UPDATED = 'proposal_updated',
  VOTE_CAST = 'vote_cast',
  PROPOSAL_EXECUTED = 'proposal_executed',
  PROPOSAL_CANCELLED = 'proposal_cancelled',
  PROPOSAL_EXPIRED = 'proposal_expired',
}

export interface GovernanceEvent {
  id: string;
  type: GovernanceEventType;
  proposalId?: string;
  voterAddress?: string;
  data: Record<string, any>;
  timestamp: Date;
  txHash?: string;
}

// Notification types for governance
export enum GovernanceNotificationType {
  PROPOSAL_CREATED = 'proposal_created',
  PROPOSAL_ENDING_SOON = 'proposal_ending_soon',
  PROPOSAL_SUCCEEDED = 'proposal_succeeded',
  PROPOSAL_DEFEATED = 'proposal_defeated',
  VOTE_RECEIVED = 'vote_received',
  PROPOSAL_EXECUTED = 'proposal_executed',
}

export interface GovernanceNotification {
  id: string;
  type: GovernanceNotificationType;
  userId: string;
  proposalId?: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}