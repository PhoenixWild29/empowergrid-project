/**
 * Contract Upgrade Management
 * 
 * WO-109: Upgradeable contract system with migration support
 * 
 * Features:
 * - Version management
 * - State preservation during upgrades
 * - Backward compatibility validation
 * - Rollback capabilities
 * - Upgrade history tracking
 */

use anchor_lang::prelude::*;

// WO-109: Contract Version Information
#[account]
#[derive(Default)]
pub struct ContractVersion {
    /// Current version number
    pub version: u64,
    
    /// Upgrade authority (who can initiate upgrades)
    pub upgrade_authority: Pubkey,
    
    /// Previous version program ID (for rollback)
    pub previous_version: Option<Pubkey>,
    
    /// Last upgrade timestamp
    pub last_upgrade: i64,
    
    /// Upgrade count
    pub upgrade_count: u64,
    
    /// Is upgrade in progress
    pub upgrade_in_progress: bool,
    
    /// Migration status
    pub migration_complete: bool,
    
    /// PDA bump
    pub bump: u8,
}

impl ContractVersion {
    pub const LEN: usize = 8 +      // discriminator
        8 +                          // version (u64)
        32 +                         // upgrade_authority (Pubkey)
        1 + 32 +                     // previous_version (Option<Pubkey>)
        8 +                          // last_upgrade (i64)
        8 +                          // upgrade_count (u64)
        1 +                          // upgrade_in_progress (bool)
        1 +                          // migration_complete (bool)
        1;                           // bump (u8)
}

// WO-109: Upgrade History Record
#[account]
#[derive(Default)]
pub struct UpgradeHistory {
    /// Version info reference
    pub version_account: Pubkey,
    
    /// Version upgraded from
    pub from_version: u64,
    
    /// Version upgraded to
    pub to_version: u64,
    
    /// Who authorized the upgrade
    pub authorized_by: Pubkey,
    
    /// Upgrade timestamp
    pub upgraded_at: i64,
    
    /// Migration data hash (for verification)
    pub migration_hash: [u8; 32],
    
    /// Rollback performed
    pub rollback: bool,
    
    /// Rollback timestamp
    pub rolled_back_at: Option<i64>,
    
    /// PDA bump
    pub bump: u8,
}

impl UpgradeHistory {
    pub const LEN: usize = 8 +      // discriminator
        32 +                         // version_account (Pubkey)
        8 +                          // from_version (u64)
        8 +                          // to_version (u64)
        32 +                         // authorized_by (Pubkey)
        8 +                          // upgraded_at (i64)
        32 +                         // migration_hash ([u8; 32])
        1 +                          // rollback (bool)
        1 + 8 +                      // rolled_back_at (Option<i64>)
        1;                           // bump (u8)
}

// WO-109: Migration State for preserving data
#[account]
#[derive(Default)]
pub struct MigrationState {
    /// Original contract data
    pub original_contract: Pubkey,
    
    /// New contract version
    pub new_contract: Pubkey,
    
    /// Migration started
    pub migration_started: i64,
    
    /// Migration completed
    pub migration_completed: Option<i64>,
    
    /// State snapshot hash
    pub state_hash: [u8; 32],
    
    /// Validation passed
    pub validation_passed: bool,
    
    /// Stakeholders notified
    pub stakeholders_notified: bool,
    
    /// Approvals received
    pub approval_count: u8,
    
    /// Required approvals
    pub required_approvals: u8,
    
    /// PDA bump
    pub bump: u8,
}

impl MigrationState {
    pub const LEN: usize = 8 +      // discriminator
        32 +                         // original_contract (Pubkey)
        32 +                         // new_contract (Pubkey)
        8 +                          // migration_started (i64)
        1 + 8 +                      // migration_completed (Option<i64>)
        32 +                         // state_hash ([u8; 32])
        1 +                          // validation_passed (bool)
        1 +                          // stakeholders_notified (bool)
        1 +                          // approval_count (u8)
        1 +                          // required_approvals (u8)
        1;                           // bump (u8)
}

// WO-109: Helper methods for version management
impl ContractVersion {
    /// Check if upgrade is allowed
    pub fn can_upgrade(&self) -> bool {
        !self.upgrade_in_progress
    }
    
    /// Start upgrade process
    pub fn start_upgrade(&mut self) {
        self.upgrade_in_progress = true;
        self.migration_complete = false;
    }
    
    /// Complete upgrade
    pub fn complete_upgrade(&mut self, new_version: u64) {
        self.version = new_version;
        self.upgrade_count += 1;
        self.last_upgrade = Clock::get().unwrap().unix_timestamp;
        self.upgrade_in_progress = false;
        self.migration_complete = true;
    }
    
    /// Cancel upgrade
    pub fn cancel_upgrade(&mut self) {
        self.upgrade_in_progress = false;
    }
}

impl MigrationState {
    /// Check if migration is complete
    pub fn is_complete(&self) -> bool {
        self.migration_completed.is_some() && self.validation_passed
    }
    
    /// Check if all approvals received
    pub fn has_all_approvals(&self) -> bool {
        self.approval_count >= self.required_approvals
    }
    
    /// Add approval
    pub fn add_approval(&mut self) {
        self.approval_count += 1;
    }
}



