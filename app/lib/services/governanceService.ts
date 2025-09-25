import { PublicKey } from '@solana/web3.js';
import {
  Proposal,
  ProposalType,
  ProposalStatus,
  Vote,
  VoteOption,
  VoterInfo,
  GovernanceStats,
  GovernanceConfig,
  VotingPowerMethod,
  CreateProposalRequest,
  UpdateProposalRequest,
  CastVoteRequest,
  GovernanceEvent,
  GovernanceEventType,
  GovernanceNotification,
  GovernanceNotificationType,
} from '../../types/governance';
import { databaseService } from './databaseService';
import { logger } from '../logging/logger';
import { errorTracker, ErrorSeverity, ErrorCategory } from '../monitoring/errorTracker';

export class GovernanceService {
  private static instance: GovernanceService;
  private config: GovernanceConfig;

  private constructor() {
    this.config = {
      proposalThreshold: 1000, // Minimum tokens/reputation
      quorumThreshold: 0.1, // 10% participation
      approvalThreshold: 0.5, // 50% approval
      votingPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
      executionDelay: 2 * 24 * 60 * 60 * 1000, // 2 days

      votingPowerMethod: VotingPowerMethod.HYBRID,
      minimumVotingPower: 1,

      emergencyQuorumThreshold: 0.05, // 5% for emergency
      emergencyApprovalThreshold: 0.75, // 75% for emergency
      emergencyVotingPeriod: 24 * 60 * 60 * 1000, // 24 hours

      treasuryAllocationLimit: 0.1, // 10% of treasury max
    };
  }

  static getInstance(): GovernanceService {
    if (!GovernanceService.instance) {
      GovernanceService.instance = new GovernanceService();
    }
    return GovernanceService.instance;
  }

  // Configuration management
  getConfig(): GovernanceConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<GovernanceConfig>): void {
    Object.assign(this.config, updates);
    logger.info('Updated governance configuration', { updates });
  }

  // Proposal management
  async createProposal(request: CreateProposalRequest, proposerAddress: string): Promise<Proposal> {
    try {
      // Validate proposer has sufficient voting power
      const proposerVotingPower = await this.calculateVotingPower(proposerAddress);
      if (proposerVotingPower < this.config.proposalThreshold) {
        throw new Error(`Insufficient voting power: ${proposerVotingPower} < ${this.config.proposalThreshold}`);
      }

      const proposal: Proposal = {
        id: this.generateProposalId(),
        type: request.type,
        title: request.title,
        description: request.description,
        proposer: new PublicKey(proposerAddress),
        proposerAddress,

        targetContract: request.targetContract,
        targetFunction: request.targetFunction,
        parameters: request.parameters,

        projectId: request.projectId,
        milestoneId: request.milestoneId,
        fundingAmount: request.fundingAmount,

        startTime: new Date(),
        endTime: new Date(Date.now() + this.getVotingPeriod(request.type)),
        status: ProposalStatus.ACTIVE,

        votes: {
          yes: 0,
          no: 0,
          abstain: 0,
        },
        totalVotingPower: 0,
        quorumReached: false,

        createdAt: new Date(),
        updatedAt: new Date(),
        tags: request.tags || [],
        discussionUrl: request.discussionUrl,
      };

      // Store in database (would be implemented)
      await this.storeProposal(proposal);

      // Emit event
      await this.emitEvent(GovernanceEventType.PROPOSAL_CREATED, proposal.id, { proposal });

      // Create notification for all users
      await this.createNotificationForAllUsers({
        type: GovernanceNotificationType.PROPOSAL_CREATED,
        proposalId: proposal.id,
        title: `New Proposal: ${proposal.title}`,
        message: `A new ${proposal.type} proposal has been created`,
        actionUrl: `/governance/proposals/${proposal.id}`,
      });

      logger.info('Created new proposal', {
        proposalId: proposal.id,
        type: proposal.type,
        proposer: proposerAddress,
      });

      return proposal;
    } catch (error) {
      logger.error('Failed to create proposal', { error: (error as Error).message, request });
      throw error;
    }
  }

  async updateProposal(proposalId: string, updates: UpdateProposalRequest, updaterAddress: string): Promise<Proposal> {
    try {
      const proposal = await this.getProposal(proposalId);
      if (!proposal) {
        throw new Error('Proposal not found');
      }

      // Only proposer can update draft/active proposals
      if (proposal.proposerAddress !== updaterAddress) {
        throw new Error('Only proposer can update proposal');
      }

      if (proposal.status !== ProposalStatus.DRAFT && proposal.status !== ProposalStatus.ACTIVE) {
        throw new Error('Cannot update proposal in current status');
      }

      Object.assign(proposal, updates, { updatedAt: new Date() });

      await this.storeProposal(proposal);

      await this.emitEvent(GovernanceEventType.PROPOSAL_UPDATED, proposalId, { updates });

      return proposal;
    } catch (error) {
      logger.error('Failed to update proposal', { error: (error as Error).message, proposalId });
      throw error;
    }
  }

  async cancelProposal(proposalId: string, cancellerAddress: string): Promise<void> {
    try {
      const proposal = await this.getProposal(proposalId);
      if (!proposal) {
        throw new Error('Proposal not found');
      }

      // Only proposer or admin can cancel
      if (proposal.proposerAddress !== cancellerAddress) {
        // TODO: Check admin permissions
        throw new Error('Only proposer can cancel proposal');
      }

      proposal.status = ProposalStatus.CANCELLED;
      proposal.updatedAt = new Date();

      await this.storeProposal(proposal);

      await this.emitEvent(GovernanceEventType.PROPOSAL_CANCELLED, proposalId);

      logger.info('Cancelled proposal', { proposalId, canceller: cancellerAddress });
    } catch (error) {
      logger.error('Failed to cancel proposal', { error: (error as Error).message, proposalId });
      throw error;
    }
  }

  // Voting
  async castVote(request: CastVoteRequest, voterAddress: string): Promise<Vote> {
    try {
      const proposal = await this.getProposal(request.proposalId);
      if (!proposal) {
        throw new Error('Proposal not found');
      }

      if (proposal.status !== ProposalStatus.ACTIVE) {
        throw new Error('Proposal is not active for voting');
      }

      if (new Date() > proposal.endTime) {
        throw new Error('Voting period has ended');
      }

      // Check if user already voted
      const existingVote = await this.getVote(request.proposalId, voterAddress);
      if (existingVote) {
        throw new Error('User has already voted on this proposal');
      }

      const votingPower = await this.calculateVotingPower(voterAddress);
      if (votingPower < this.config.minimumVotingPower) {
        throw new Error('Insufficient voting power to vote');
      }

      const vote: Vote = {
        id: this.generateVoteId(),
        proposalId: request.proposalId,
        voter: new PublicKey(voterAddress),
        voterAddress,
        option: request.option,
        votingPower,
        reason: request.reason,
        timestamp: new Date(),
      };

      // Update proposal vote counts
      proposal.votes[request.option] += votingPower;
      proposal.totalVotingPower += votingPower;
      proposal.updatedAt = new Date();

      // Check if quorum reached
      const totalEligibleVotingPower = await this.getTotalEligibleVotingPower();
      proposal.quorumReached = proposal.totalVotingPower >= (totalEligibleVotingPower * this.config.quorumThreshold);

      await this.storeVote(vote);
      await this.storeProposal(proposal);

      await this.emitEvent(GovernanceEventType.VOTE_CAST, request.proposalId, {
        vote,
        proposalVotes: proposal.votes,
      });

      // Notify proposal creator
      await this.createNotification(proposal.proposerAddress, {
        type: GovernanceNotificationType.VOTE_RECEIVED,
        proposalId: proposal.id,
        title: `New vote on your proposal`,
        message: `Someone voted ${request.option} on "${proposal.title}"`,
        actionUrl: `/governance/proposals/${proposal.id}`,
      });

      logger.info('Cast vote', {
        proposalId: request.proposalId,
        voter: voterAddress,
        option: request.option,
        votingPower,
      });

      return vote;
    } catch (error) {
      logger.error('Failed to cast vote', { error: (error as Error).message, request });
      throw error;
    }
  }

  // Proposal resolution
  async processProposalOutcomes(): Promise<void> {
    try {
      const activeProposals = await this.getActiveProposals();

      for (const proposal of activeProposals) {
        if (new Date() > proposal.endTime) {
          await this.resolveProposal(proposal);
        }
      }
    } catch (error) {
      logger.error('Failed to process proposal outcomes', { error: (error as Error).message });
    }
  }

  private async resolveProposal(proposal: Proposal): Promise<void> {
    try {
      const totalVotes = proposal.votes.yes + proposal.votes.no;
      const approvalRate = totalVotes > 0 ? proposal.votes.yes / totalVotes : 0;

      const quorumReached = proposal.quorumReached;
      const approvalThreshold = this.isEmergencyProposal(proposal) ?
        this.config.emergencyApprovalThreshold : this.config.approvalThreshold;

      if (quorumReached && approvalRate >= approvalThreshold) {
        proposal.status = ProposalStatus.SUCCEEDED;

        // Schedule for execution
        setTimeout(() => {
          this.executeProposal(proposal.id);
        }, this.config.executionDelay);

        await this.createNotificationForAllUsers({
          type: GovernanceNotificationType.PROPOSAL_SUCCEEDED,
          proposalId: proposal.id,
          title: `Proposal Succeeded: ${proposal.title}`,
          message: `Proposal passed with ${Math.round(approvalRate * 100)}% approval`,
          actionUrl: `/governance/proposals/${proposal.id}`,
        });

      } else {
        proposal.status = ProposalStatus.DEFEATED;

        await this.createNotificationForAllUsers({
          type: GovernanceNotificationType.PROPOSAL_DEFEATED,
          proposalId: proposal.id,
          title: `Proposal Defeated: ${proposal.title}`,
          message: `Proposal failed with ${Math.round(approvalRate * 100)}% approval`,
          actionUrl: `/governance/proposals/${proposal.id}`,
        });
      }

      proposal.updatedAt = new Date();
      await this.storeProposal(proposal);

      await this.emitEvent(GovernanceEventType.PROPOSAL_EXPIRED, proposal.id, {
        finalVotes: proposal.votes,
        approvalRate,
        quorumReached,
        status: proposal.status,
      });

      logger.info('Resolved proposal', {
        proposalId: proposal.id,
        status: proposal.status,
        approvalRate,
        quorumReached,
      });

    } catch (error) {
      logger.error('Failed to resolve proposal', {
        error: (error as Error).message,
        proposalId: proposal.id,
      });
    }
  }

  private async executeProposal(proposalId: string): Promise<void> {
    try {
      const proposal = await this.getProposal(proposalId);
      if (!proposal || proposal.status !== ProposalStatus.SUCCEEDED) {
        return;
      }

      // Execute based on proposal type
      switch (proposal.type) {
        case ProposalType.PROJECT_FUNDING:
          await this.executeProjectFunding(proposal);
          break;
        case ProposalType.MILESTONE_APPROVAL:
          await this.executeMilestoneApproval(proposal);
          break;
        case ProposalType.PARAMETER_CHANGE:
          await this.executeParameterChange(proposal);
          break;
        case ProposalType.TREASURY_ALLOCATION:
          await this.executeTreasuryAllocation(proposal);
          break;
        case ProposalType.EMERGENCY_ACTION:
          await this.executeEmergencyAction(proposal);
          break;
      }

      proposal.status = ProposalStatus.EXECUTED;
      proposal.executedAt = new Date();
      proposal.updatedAt = new Date();

      await this.storeProposal(proposal);

      await this.emitEvent(GovernanceEventType.PROPOSAL_EXECUTED, proposalId);

      logger.info('Executed proposal', { proposalId, type: proposal.type });

    } catch (error) {
      logger.error('Failed to execute proposal', {
        error: (error as Error).message,
        proposalId,
      });
    }
  }

  // Voting power calculation
  private async calculateVotingPower(address: string): Promise<number> {
    try {
      // Get user data from database
      const user = await databaseService.getUserByWallet(address);
      if (!user) {
        return 0;
      }

      let votingPower = 0;

      switch (this.config.votingPowerMethod) {
        case VotingPowerMethod.TOKEN_BALANCE:
          // TODO: Get token balance from blockchain
          votingPower = 1000; // Mock value
          break;

        case VotingPowerMethod.REPUTATION_BASED:
          votingPower = user.reputation;
          break;

        case VotingPowerMethod.STAKE_BASED:
          // TODO: Get staked tokens
          votingPower = Math.min(user.reputation, 1000); // Mock value
          break;

        case VotingPowerMethod.HYBRID:
          // Combination of reputation and token balance
          const tokenBalance = 1000; // Mock value
          votingPower = (user.reputation * 0.7) + (tokenBalance * 0.3);
          break;
      }

      return Math.max(votingPower, 0);
    } catch (error) {
      logger.error('Failed to calculate voting power', { error: (error as Error).message, address });
      return 0;
    }
  }

  private async getTotalEligibleVotingPower(): Promise<number> {
    // TODO: Calculate total eligible voting power across all users
    return 100000; // Mock value
  }

  // Helper methods
  private generateProposalId(): string {
    return `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateVoteId(): string {
    return `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getVotingPeriod(type: ProposalType): number {
    return type === ProposalType.EMERGENCY_ACTION ?
      this.config.emergencyVotingPeriod :
      this.config.votingPeriod;
  }

  private isEmergencyProposal(proposal: Proposal): boolean {
    return proposal.type === ProposalType.EMERGENCY_ACTION;
  }

  // Database operations (mock implementations)
  private async storeProposal(proposal: Proposal): Promise<void> {
    // TODO: Implement database storage
    logger.debug('Storing proposal', { proposalId: proposal.id });
  }

  private async getProposalFromDb(proposalId: string): Promise<Proposal | null> {
    // TODO: Implement database retrieval
    logger.debug('Retrieving proposal', { proposalId });
    return null;
  }

  private async getActiveProposals(): Promise<Proposal[]> {
    // TODO: Implement database query
    return [];
  }

  private async storeVote(vote: Vote): Promise<void> {
    // TODO: Implement database storage
    logger.debug('Storing vote', { voteId: vote.id });
  }

  private async getVote(proposalId: string, voterAddress: string): Promise<Vote | null> {
    // TODO: Implement database retrieval
    return null;
  }

  // Execution methods
  private async executeProjectFunding(proposal: Proposal): Promise<void> {
    // TODO: Implement project funding execution
    logger.info('Executing project funding', { proposalId: proposal.id });
  }

  private async executeMilestoneApproval(proposal: Proposal): Promise<void> {
    // TODO: Implement milestone approval execution
    logger.info('Executing milestone approval', { proposalId: proposal.id });
  }

  private async executeParameterChange(proposal: Proposal): Promise<void> {
    // TODO: Implement parameter change execution
    logger.info('Executing parameter change', { proposalId: proposal.id });
  }

  private async executeTreasuryAllocation(proposal: Proposal): Promise<void> {
    // TODO: Implement treasury allocation execution
    logger.info('Executing treasury allocation', { proposalId: proposal.id });
  }

  private async executeEmergencyAction(proposal: Proposal): Promise<void> {
    // TODO: Implement emergency action execution
    logger.info('Executing emergency action', { proposalId: proposal.id });
  }

  // Event emission
  private async emitEvent(type: GovernanceEventType, proposalId?: string, data: Record<string, any> = {}): Promise<void> {
    const event: GovernanceEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      proposalId,
      data,
      timestamp: new Date(),
    };

    // TODO: Store event and emit to listeners
    logger.info('Emitted governance event', { type, proposalId });
  }

  // Notifications
  private async createNotification(userId: string, notification: Omit<GovernanceNotification, 'id' | 'userId' | 'read' | 'createdAt'>): Promise<void> {
    // TODO: Implement notification creation
    logger.debug('Creating notification', { userId, type: notification.type });
  }

  private async createNotificationForAllUsers(notification: Omit<GovernanceNotification, 'id' | 'userId' | 'read' | 'createdAt'>): Promise<void> {
    // TODO: Implement bulk notification creation
    logger.debug('Creating notification for all users', { type: notification.type });
  }

  // Public query methods
  async getProposals(filters?: {
    status?: ProposalStatus;
    type?: ProposalType;
    proposer?: string;
    limit?: number;
    offset?: number;
  }): Promise<Proposal[]> {
    // TODO: Implement proposal querying
    return [];
  }

  async getProposal(proposalId: string): Promise<Proposal | null> {
    try {
      return await this.getProposalFromDb(proposalId);
    } catch (error) {
      logger.error('Failed to get proposal', { proposalId, error });
      throw error;
    }
  }

  async getVoterInfo(proposalId: string, voterAddress: string): Promise<VoterInfo | null> {
    try {
      const votingPower = await this.calculateVotingPower(voterAddress);
      const vote = await this.getVote(proposalId, voterAddress);

      // TODO: Get additional user data
      return {
        address: new PublicKey(voterAddress),
        votingPower,
        hasVoted: !!vote,
        voteOption: vote?.option,
        lastVoteTime: vote?.timestamp,
        reputation: 50, // Mock value
        tokenBalance: 1000, // Mock value
        delegatedPower: 0,
      };
    } catch (error) {
      logger.error('Failed to get voter info', { error: (error as Error).message, proposalId, voterAddress });
      return null;
    }
  }

  async getGovernanceStats(): Promise<GovernanceStats> {
    // TODO: Calculate real statistics
    return {
      totalProposals: 0,
      activeProposals: 0,
      totalVotes: 0,
      averageParticipation: 0,
      treasuryBalance: 0,
      totalValueLocked: 0,
      uniqueVoters: 0,
    };
  }
}

// Export singleton instance
export const governanceService = GovernanceService.getInstance();