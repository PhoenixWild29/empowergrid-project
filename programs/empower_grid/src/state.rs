/**
 * Solana Escrow Smart Contract Data Structures
 * 
 * WO-90: Core blockchain data structures using Anchor framework
 * 
 * Structures:
 * - EscrowAccount: Main escrow account for project funding
 * - MilestoneData: Milestone tracking and verification
 * - EscrowStatus: Contract status enum
 * - MilestoneStatus: Milestone status enum
 */

use anchor_lang::prelude::*;

// WO-90: EscrowAccount Structure
#[account]
#[derive(Default)]
pub struct EscrowAccount {
    /// Project identifier (String stored as bytes)
    pub project_id: String,
    
    /// Creator's wallet address
    pub creator: Pubkey,
    
    /// Total amount deposited (in USDC lamports - 6 decimals)
    pub total_amount: u64,
    
    /// Amount released so far (in USDC lamports)
    pub released_amount: u64,
    
    /// Total number of milestones
    pub milestone_count: u8,
    
    /// Number of completed milestones
    pub completed_milestones: u8,
    
    /// Contract status
    pub status: EscrowStatus,
    
    /// Oracle authority for verification
    pub oracle_authority: Pubkey,
    
    /// Creation timestamp (Unix timestamp)
    pub created_at: i64,
    
    /// PDA bump seed
    pub bump: u8,
}

impl EscrowAccount {
    /// Calculate space needed for account
    pub const LEN: usize = 8 + // discriminator
        32 +                    // project_id (max 32 bytes for String)
        32 +                    // creator (Pubkey)
        8 +                     // total_amount (u64)
        8 +                     // released_amount (u64)
        1 +                     // milestone_count (u8)
        1 +                     // completed_milestones (u8)
        1 +                     // status (enum = u8)
        32 +                    // oracle_authority (Pubkey)
        8 +                     // created_at (i64)
        1;                      // bump (u8)
}

// WO-90: MilestoneData Structure
#[account]
#[derive(Default)]
pub struct MilestoneData {
    /// Reference to parent escrow account
    pub escrow_account: Pubkey,
    
    /// Milestone index (0-based)
    pub milestone_index: u8,
    
    /// Target amount for this milestone (USDC lamports)
    pub target_amount: u64,
    
    /// Energy production target in kWh (micro units: kWh * 1,000,000)
    pub energy_target: u64,
    
    /// Due date for milestone completion (Unix timestamp)
    pub due_date: i64,
    
    /// Milestone status
    pub status: MilestoneStatus,
    
    /// Verification hash from oracle (32-byte hash)
    pub verification_hash: [u8; 32],
    
    /// Optional completion timestamp
    pub completed_at: Option<i64>,
    
    /// PDA bump seed
    pub bump: u8,
}

impl MilestoneData {
    /// Calculate space needed for account
    pub const LEN: usize = 8 + // discriminator
        32 +                    // escrow_account (Pubkey)
        1 +                     // milestone_index (u8)
        8 +                     // target_amount (u64)
        8 +                     // energy_target (u64)
        8 +                     // due_date (i64)
        1 +                     // status (enum = u8)
        32 +                    // verification_hash ([u8; 32])
        1 + 8 +                 // completed_at (Option<i64>)
        1;                      // bump (u8)
}

// WO-90: EscrowStatus Enum
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum EscrowStatus {
    /// Contract initialized but no funds deposited
    Initialized,
    
    /// Contract is active and accepting deposits
    Active,
    
    /// All milestones completed and funds released
    Completed,
    
    /// Contract has been disputed
    Disputed,
    
    /// Emergency stop activated
    EmergencyStopped,
}

impl Default for EscrowStatus {
    fn default() -> Self {
        EscrowStatus::Initialized
    }
}

// WO-90: MilestoneStatus Enum
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum MilestoneStatus {
    /// Milestone not yet started
    Pending,
    
    /// Milestone work in progress
    InProgress,
    
    /// Milestone completed and verified
    Completed,
    
    /// Milestone verification failed
    Failed,
    
    /// Milestone is disputed
    Disputed,
}

impl Default for MilestoneStatus {
    fn default() -> Self {
        MilestoneStatus::Pending
    }
}

// WO-90: Helper methods for account validation
impl EscrowAccount {
    /// Check if escrow can accept more deposits
    pub fn can_accept_deposits(&self) -> bool {
        matches!(self.status, EscrowStatus::Active | EscrowStatus::Initialized)
    }
    
    /// Check if all milestones are completed
    pub fn all_milestones_completed(&self) -> bool {
        self.completed_milestones == self.milestone_count
    }
    
    /// Calculate remaining funds
    pub fn remaining_funds(&self) -> u64 {
        self.total_amount.saturating_sub(self.released_amount)
    }
    
    /// Get completion percentage
    pub fn completion_percentage(&self) -> u8 {
        if self.milestone_count == 0 {
            return 0;
        }
        ((self.completed_milestones as u16 * 100) / self.milestone_count as u16) as u8
    }
}

impl MilestoneData {
    /// Check if milestone is overdue
    pub fn is_overdue(&self, current_time: i64) -> bool {
        !matches!(self.status, MilestoneStatus::Completed) && current_time > self.due_date
    }
    
    /// Check if milestone can be verified
    pub fn can_verify(&self) -> bool {
        matches!(self.status, MilestoneStatus::InProgress)
    }
    
    /// Check if verification hash is set
    pub fn has_verification(&self) -> bool {
        self.verification_hash != [0u8; 32]
    }
}

// WO-110: Participant Account Structure
#[account]
#[derive(Default)]
pub struct Participant {
    /// Escrow contract reference
    pub escrow_contract: Pubkey,
    
    /// Participant wallet address
    pub wallet_address: Pubkey,
    
    /// Participant role
    pub role: ParticipantRole,
    
    /// Participation status
    pub status: ParticipantStatus,
    
    /// Amount contributed (for funders)
    pub contributed_amount: u64,
    
    /// Joined timestamp
    pub joined_at: i64,
    
    /// PDA bump seed
    pub bump: u8,
}

impl Participant {
    pub const LEN: usize = 8 +  // discriminator
        32 +                     // escrow_contract (Pubkey)
        32 +                     // wallet_address (Pubkey)
        1 +                      // role (enum = u8)
        1 +                      // status (enum = u8)
        8 +                      // contributed_amount (u64)
        8 +                      // joined_at (i64)
        1;                       // bump (u8)
}

// WO-110: Participant Role Enum
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ParticipantRole {
    /// Contract creator
    Client,
    
    /// Project executor/freelancer
    Freelancer,
    
    /// Dispute arbiter
    Arbiter,
    
    /// Funder/investor
    Funder,
}

impl Default for ParticipantRole {
    fn default() -> Self {
        ParticipantRole::Funder
    }
}

// WO-110: Participant Status Enum
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ParticipantStatus {
    /// Active participant
    Active,
    
    /// Withdrawn from contract
    Withdrawn,
    
    /// Suspended (e.g., dispute)
    Suspended,
}

impl Default for ParticipantStatus {
    fn default() -> Self {
        ParticipantStatus::Active
    }
}

// WO-110: Helper methods for Participant
impl Participant {
    /// Check if participant can contribute
    pub fn can_contribute(&self) -> bool {
        matches!(self.status, ParticipantStatus::Active) &&
        matches!(self.role, ParticipantRole::Funder)
    }
    
    /// Check if participant is active
    pub fn is_active(&self) -> bool {
        matches!(self.status, ParticipantStatus::Active)
    }
}


