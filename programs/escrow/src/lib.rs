use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use std::collections::BTreeSet;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

// ── Events ──────────────────────────────────────────────────────

#[event]
pub struct MilestoneApprovedEvent {
    pub escrow: Pubkey,
    pub milestone_idx: u8,
    pub approver: Pubkey,
    pub approvals_so_far: u8,
    pub threshold_met: bool,
}

#[event]
pub struct MilestoneRejected {
    pub escrow: Pubkey,
    pub milestone_idx: u8,
    pub rejector: Pubkey,
    pub reason: String,
}

#[event]
pub struct MilestoneDisputed {
    pub escrow: Pubkey,
    pub milestone_idx: u8,
    pub disputer: Pubkey,
}

#[event]
pub struct MilestoneFundsReleased {
    pub escrow: Pubkey,
    pub milestone_idx: u8,
    pub amount: u64,
    pub recipient: Pubkey,
}

// ── Program ─────────────────────────────────────────────────────

#[program]
pub mod escrow {
    use super::*;

    pub fn initialize_escrow(ctx: Context<InitializeEscrow>, milestones: Vec<Milestone>, deadline: i64) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(milestones.len() > 0, ErrorCode::NoMilestones);
        require!(milestones.len() <= 10, ErrorCode::TooManyMilestones);
        escrow.funder = ctx.accounts.funder.key();
        escrow.recipient = ctx.accounts.recipient.key();
        escrow.milestones = milestones;
        escrow.current_milestone = 0;
        escrow.total_funded = 0;
        escrow.total_released = 0;
        escrow.status = Status::Initialized;
        escrow.deadline = deadline;
        escrow.bump = ctx.bumps.escrow;
        escrow.has_multi_approval = false;
        Ok(())
    }

    pub fn configure_milestones(
        ctx: Context<ConfigureMilestones>,
        approvers: Vec<Pubkey>,
        threshold: u8,
    ) -> Result<()> {
        require!(approvers.len() >= 2 && approvers.len() <= 5, ErrorCode::InvalidApproverCount);
        require!(threshold >= 2 && threshold as usize <= approvers.len(), ErrorCode::InvalidThreshold);

        // Ensure no duplicate approvers
        let mut seen = BTreeSet::new();
        for a in &approvers {
            require!(seen.insert(a), ErrorCode::DuplicateApprover);
        }

        let config = &mut ctx.accounts.milestone_config;
        config.escrow = ctx.accounts.escrow.key();
        config.approvers = approvers;
        config.threshold = threshold;
        config.bump = ctx.bumps.milestone_config;

        let escrow = &mut ctx.accounts.escrow;
        escrow.has_multi_approval = true;
        Ok(())
    }

    pub fn fund_escrow(ctx: Context<FundEscrow>, amount: u64) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.status == Status::Initialized, ErrorCode::InvalidStatus);
        require!(amount > 0, ErrorCode::InvalidAmount);
        let cpi_accounts = Transfer {
            from: ctx.accounts.funder.to_account_info(),
            to: ctx.accounts.escrow.to_account_info(),
        };
        let cpi_program = ctx.accounts.system_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts).with_signer(&[&ctx.accounts.escrow_seeds()]);
        transfer(cpi_ctx, amount)?;
        escrow.total_funded = escrow.total_funded.checked_add(amount).ok_or(ErrorCode::Overflow)?;
        escrow.status = Status::Funded;
        Ok(())
    }

    /// Single-signer milestone approval (original flow). Blocked if multi-approval is configured.
    pub fn approve_milestone(ctx: Context<ApproveMilestone>, milestone_idx: u8) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(!escrow.has_multi_approval, ErrorCode::UseMultiApproval);
        require!(escrow.status == Status::Funded || escrow.status == Status::Active, ErrorCode::InvalidStatus);
        require!(milestone_idx as usize == escrow.current_milestone as usize, ErrorCode::InvalidIndex);
        require!(milestone_idx as usize < escrow.milestones.len(), ErrorCode::InvalidIndex);
        escrow.current_milestone += 1;
        if escrow.current_milestone as usize == escrow.milestones.len() {
            escrow.status = Status::Completed;
        } else {
            escrow.status = Status::Active;
        }
        Ok(())
    }

    /// Multi-party milestone approval. Each approver calls this individually.
    pub fn approve_milestone_multi(
        ctx: Context<ApproveMilestoneMulti>,
        milestone_idx: u8,
    ) -> Result<()> {
        let config = &ctx.accounts.milestone_config;
        let approval = &mut ctx.accounts.milestone_approval;
        let escrow = &mut ctx.accounts.escrow;
        let approver = ctx.accounts.approver.key();

        // Validate approver is in the config
        require!(config.approvers.contains(&approver), ErrorCode::NotApprover);

        // Validate milestone index
        require!(milestone_idx as usize == escrow.current_milestone as usize, ErrorCode::InvalidIndex);
        require!(approval.status == MilestoneStatus::Pending, ErrorCode::MilestoneAlreadyFinalized);

        // Check not already approved by this signer
        require!(
            !approval.approvals.iter().any(|a| a.approver == approver),
            ErrorCode::AlreadyApproved
        );

        // Initialize approval fields if first approver
        if approval.approvals.is_empty() {
            approval.escrow = escrow.key();
            approval.milestone_idx = milestone_idx;
        }

        // Record approval
        approval.approvals.push(ApprovalRecord {
            approver,
            approved_at: Clock::get()?.unix_timestamp,
        });

        let threshold_met = approval.approvals.len() >= config.threshold as usize;

        emit!(MilestoneApprovedEvent {
            escrow: escrow.key(),
            milestone_idx,
            approver,
            approvals_so_far: approval.approvals.len() as u8,
            threshold_met,
        });

        // Check if threshold met
        if threshold_met {
            approval.status = MilestoneStatus::Approved;
            escrow.current_milestone += 1;
            if escrow.current_milestone as usize == escrow.milestones.len() {
                escrow.status = Status::Completed;
            } else {
                escrow.status = Status::Active;
            }
        }

        Ok(())
    }

    /// Any approver can reject a pending milestone.
    pub fn reject_milestone(
        ctx: Context<RejectMilestone>,
        milestone_idx: u8,
        reason: String,
    ) -> Result<()> {
        require!(reason.len() <= 128, ErrorCode::ReasonTooLong);
        let config = &ctx.accounts.milestone_config;
        let approval = &mut ctx.accounts.milestone_approval;
        let approver = ctx.accounts.approver.key();

        require!(config.approvers.contains(&approver), ErrorCode::NotApprover);
        require!(approval.status == MilestoneStatus::Pending, ErrorCode::MilestoneAlreadyFinalized);

        // Initialize if first interaction
        if approval.approvals.is_empty() {
            approval.escrow = ctx.accounts.escrow.key();
            approval.milestone_idx = milestone_idx;
        }

        approval.status = MilestoneStatus::Rejected;

        emit!(MilestoneRejected {
            escrow: ctx.accounts.escrow.key(),
            milestone_idx,
            rejector: approver,
            reason: reason.chars().take(128).collect(),
        });

        Ok(())
    }

    /// Funder or recipient can dispute a rejected milestone.
    pub fn dispute_milestone(
        ctx: Context<DisputeMilestone>,
        _milestone_idx: u8,
    ) -> Result<()> {
        let approval = &mut ctx.accounts.milestone_approval;
        require!(
            approval.status == MilestoneStatus::Rejected,
            ErrorCode::CanOnlyDisputeRejected
        );
        approval.status = MilestoneStatus::Disputed;

        emit!(MilestoneDisputed {
            escrow: ctx.accounts.escrow.key(),
            milestone_idx: approval.milestone_idx,
            disputer: ctx.accounts.disputer.key(),
        });

        Ok(())
    }

    pub fn resolve_dispute(ctx: Context<ResolveDispute>, milestone_idx: u8) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let approval = &mut ctx.accounts.milestone_approval;
        require!(approval.status == MilestoneStatus::Disputed, ErrorCode::NotDisputed);
        require!(ctx.accounts.resolver.key() == escrow.funder, ErrorCode::UnauthorizedResolve); // Only funder can resolve by refunding
        let refund_amount = escrow.total_funded.saturating_sub(escrow.total_released);
        if refund_amount > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.escrow.to_account_info(),
                to: ctx.accounts.funder.to_account_info(),
            };
            let cpi_program = ctx.accounts.system_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts).with_signer(&[&ctx.accounts.escrow_seeds()]);
            transfer(cpi_ctx, refund_amount)?;
        }
        escrow.status = Status::Cancelled;
        approval.status = MilestoneStatus::Resolved;
        Ok(())
    }

    /// Release funds for an approved milestone.
    pub fn release_milestone_funds(
        ctx: Context<ReleaseMilestoneFunds>,
        milestone_idx: u8,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let approval = &ctx.accounts.milestone_approval;

        require!(approval.status == MilestoneStatus::Approved, ErrorCode::MilestoneNotApproved);
        require!((milestone_idx as usize) < escrow.milestones.len(), ErrorCode::InvalidIndex);

        let amount = escrow.milestones[milestone_idx as usize].amount;
        require!(amount > 0, ErrorCode::NothingToRelease);

        // Check sufficient funds
        let escrow_lamports = escrow.to_account_info().lamports();
        require!(escrow_lamports >= amount, ErrorCode::InsufficientFunds);

        // Transfer SOL from escrow PDA to recipient via direct lamport manipulation
        let escrow_info = escrow.to_account_info();
        let recipient_info = ctx.accounts.recipient.to_account_info();
        **escrow_info.try_borrow_mut_lamports()? -= amount;
        **recipient_info.try_borrow_mut_lamports()? += amount;

        escrow.total_released = escrow.total_released.checked_add(amount).ok_or(ErrorCode::Overflow)?;

        emit!(MilestoneFundsReleased {
            escrow: escrow.key(),
            milestone_idx,
            amount,
            recipient: ctx.accounts.recipient.key(),
        });

        Ok(())
    }

    pub fn release_funds(ctx: Context<ReleaseFunds>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.status == Status::Active || escrow.status == Status::Completed, ErrorCode::InvalidStatus);
        let mut to_release = 0u64;
        for i in 0..escrow.current_milestone as usize {
            to_release = to_release.checked_add(escrow.milestones[i].amount).ok_or(ErrorCode::Overflow)?;
        }
        require!(to_release > escrow.total_released, ErrorCode::NothingToRelease);
        let remaining = to_release.saturating_sub(escrow.total_released);
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow.to_account_info(),
            to: ctx.accounts.recipient.to_account_info(),
        };
        let cpi_program = ctx.accounts.system_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts).with_signer(&[&ctx.accounts.escrow_seeds()]);
        transfer(cpi_ctx, remaining)?;
        escrow.total_released = escrow.total_released.checked_add(remaining).ok_or(ErrorCode::Overflow)?;
        Ok(())
    }

    pub fn cancel_escrow(ctx: Context<CancelEscrow>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.status != Status::Completed, ErrorCode::CannotCancelCompleted);
        require!(Clock::get()?.unix_timestamp < escrow.deadline, ErrorCode::DeadlinePassed);
        let refund_amount = escrow.total_funded.saturating_sub(escrow.total_released);
        if refund_amount > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.escrow.to_account_info(),
                to: ctx.accounts.funder.to_account_info(),
            };
            let cpi_program = ctx.accounts.system_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts).with_signer(&[&ctx.accounts.escrow_seeds()]);
            transfer(cpi_ctx, refund_amount)?;
        }
        escrow.status = Status::Cancelled;
        Ok(())
    }

    pub fn refund_after_deadline(ctx: Context<RefundAfterDeadline>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.status != Status::Completed && escrow.status != Status::Cancelled, ErrorCode::InvalidStatus);
        require!(Clock::get()?.unix_timestamp > escrow.deadline, ErrorCode::DeadlineNotPassed);
        let refund_amount = escrow.total_funded.saturating_sub(escrow.total_released);
        if refund_amount > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.escrow.to_account_info(),
                to: ctx.accounts.funder.to_account_info(),
            };
            let cpi_program = ctx.accounts.system_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts).with_signer(&[&ctx.accounts.escrow_seeds()]);
            transfer(cpi_ctx, refund_amount)?;
        }
        escrow.status = Status::Cancelled;
        Ok(())
    }
}

// ── Original Account Validation Structs ─────────────────────────

#[derive(Accounts)]
#[instruction()]
pub struct InitializeEscrow<'info> {
    #[account(
        init,
        payer = funder,
        space = 8 + 1024,
        seeds = [b"escrow", funder.key().as_ref(), recipient.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub funder: Signer<'info>,
    /// CHECK: recipient pubkey checked in seeds
    pub recipient: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundEscrow<'info> {
    #[account(mut, seeds = [b"escrow", escrow.funder.as_ref(), escrow.recipient.as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub funder: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ApproveMilestone<'info> {
    #[account(mut, seeds = [b"escrow", funder.key().as_ref(), escrow.recipient.as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    pub funder: Signer<'info>,
}

#[derive(Accounts)]
pub struct ReleaseFunds<'info> {
    #[account(mut, seeds = [b"escrow", escrow.funder.as_ref(), recipient.key().as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub recipient: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelEscrow<'info> {
    #[account(mut, seeds = [b"escrow", funder.key().as_ref(), escrow.recipient.as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub funder: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RefundAfterDeadline<'info> {
    #[account(mut, seeds = [b"escrow", funder.key().as_ref(), escrow.recipient.as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub funder: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ── New Account Validation Structs (EGRID-003) ──────────────────

#[derive(Accounts)]
pub struct ConfigureMilestones<'info> {
    #[account(
        mut,
        seeds = [b"escrow", funder.key().as_ref(), escrow.recipient.as_ref()],
        bump = escrow.bump,
        constraint = escrow.status == Status::Initialized @ ErrorCode::InvalidStatus,
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(
        init,
        payer = funder,
        space = 8 + 32 + (4 + 32 * 5) + 1 + 1,  // 206 bytes
        seeds = [b"milestone_config", escrow.key().as_ref()],
        bump,
    )]
    pub milestone_config: Account<'info, MilestoneConfig>,
    #[account(mut)]
    pub funder: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(milestone_idx: u8)]
pub struct ApproveMilestoneMulti<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.funder.as_ref(), escrow.recipient.as_ref()],
        bump = escrow.bump,
        constraint = escrow.has_multi_approval @ ErrorCode::NotMultiApproval,
        constraint = escrow.status == Status::Funded || escrow.status == Status::Active @ ErrorCode::InvalidStatus,
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(
        seeds = [b"milestone_config", escrow.key().as_ref()],
        bump = milestone_config.bump,
    )]
    pub milestone_config: Account<'info, MilestoneConfig>,
    #[account(
        init_if_needed,
        payer = approver,
        space = 8 + 32 + 1 + (4 + (32 + 8) * 5) + 1 + 1,  // 247 bytes
        seeds = [b"milestone_approval", escrow.key().as_ref(), &[milestone_idx]],
        bump,
    )]
    pub milestone_approval: Account<'info, MilestoneApproval>,
    #[account(mut)]
    pub approver: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(milestone_idx: u8)]
pub struct RejectMilestone<'info> {
    #[account(
        seeds = [b"escrow", escrow.funder.as_ref(), escrow.recipient.as_ref()],
        bump = escrow.bump,
        constraint = escrow.has_multi_approval @ ErrorCode::NotMultiApproval,
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(
        seeds = [b"milestone_config", escrow.key().as_ref()],
        bump = milestone_config.bump,
    )]
    pub milestone_config: Account<'info, MilestoneConfig>,
    #[account(
        init_if_needed,
        payer = approver,
        space = 8 + 32 + 1 + (4 + (32 + 8) * 5) + 1 + 1,
        seeds = [b"milestone_approval", escrow.key().as_ref(), &[milestone_idx]],
        bump,
    )]
    pub milestone_approval: Account<'info, MilestoneApproval>,
    #[account(mut)]
    pub approver: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(milestone_idx: u8)]
pub struct DisputeMilestone<'info> {
    #[account(
        seeds = [b"escrow", escrow.funder.as_ref(), escrow.recipient.as_ref()],
        bump = escrow.bump,
        constraint = disputer.key() == escrow.funder || disputer.key() == escrow.recipient @ ErrorCode::UnauthorizedDispute,
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(
        mut,
        seeds = [b"milestone_approval", escrow.key().as_ref(), &[milestone_idx]],
        bump = milestone_approval.bump,
    )]
    pub milestone_approval: Account<'info, MilestoneApproval>,
    /// Funder or recipient can dispute
    pub disputer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(milestone_idx: u8)]
pub struct ResolveDispute<'info> {
    #[account(
        mut,
        seeds = [b"escrow", funder.key().as_ref(), escrow.recipient.as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(
        mut,
        seeds = [b"milestone_approval", escrow.key().as_ref(), &[milestone_idx]],
        bump = milestone_approval.bump,
    )]
    pub milestone_approval: Account<'info, MilestoneApproval>,
    #[account(mut)]
    pub funder: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(milestone_idx: u8)]
pub struct ReleaseMilestoneFunds<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.funder.as_ref(), recipient.key().as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(
        seeds = [b"milestone_approval", escrow.key().as_ref(), &[milestone_idx]],
        bump = milestone_approval.bump,
    )]
    pub milestone_approval: Account<'info, MilestoneApproval>,
    #[account(mut)]
    pub recipient: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ── Account Data Structs ────────────────────────────────────────

#[account]
pub struct Escrow {
    pub funder: Pubkey,
    pub recipient: Pubkey,
    pub milestones: Vec<Milestone>,
    pub current_milestone: u8,
    pub total_funded: u64,
    pub total_released: u64,
    pub status: Status,
    pub deadline: i64,
    pub bump: u8,
    pub has_multi_approval: bool,
}

#[account]
pub struct MilestoneConfig {
    pub escrow: Pubkey,
    pub approvers: Vec<Pubkey>,
    pub threshold: u8,
    pub bump: u8,
}

#[account]
pub struct MilestoneApproval {
    pub escrow: Pubkey,
    pub milestone_idx: u8,
    pub approvals: Vec<ApprovalRecord>,
    pub status: MilestoneStatus,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct Milestone {
    pub amount: u64,
    pub description: Option<String>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ApprovalRecord {
    pub approver: Pubkey,
    pub approved_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum Status {
    Initialized,
    Funded,
    Active,
    Completed,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum MilestoneStatus {
    Pending,
    Approved,
    Rejected,
    Disputed,
    Resolved,
}

impl Default for MilestoneStatus {
    fn default() -> Self {
        MilestoneStatus::Pending
    }
}

impl Escrow {
    pub fn escrow_seeds(&self) -> [&[u8]; 4] {
        [
            b"escrow",
            self.funder.as_ref(),
            self.recipient.as_ref(),
            &[self.bump],
        ]
    }
}

// ── Error Codes ─────────────────────────────────────────────────

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid status")]
    InvalidStatus,
    #[msg("Invalid milestone index")]
    InvalidIndex,
    #[msg("No milestones provided")]
    NoMilestones,
    #[msg("Too many milestones (max 10)")]
    TooManyMilestones,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Nothing to release")]
    NothingToRelease,
    #[msg("Cannot cancel completed escrow")]
    CannotCancelCompleted,
    #[msg("Deadline has passed")]
    DeadlinePassed,
    #[msg("Deadline not yet passed")]
    DeadlineNotPassed,
    #[msg("Invalid approver count (must be 2-5)")]
    InvalidApproverCount,
    #[msg("Invalid threshold")]
    InvalidThreshold,
    #[msg("Duplicate approver")]
    DuplicateApprover,
    #[msg("Signer is not an approver")]
    NotApprover,
    #[msg("Already approved by this signer")]
    AlreadyApproved,
    #[msg("Milestone already finalized")]
    MilestoneAlreadyFinalized,
    #[msg("Not configured for multi-approval")]
    NotMultiApproval,
    #[msg("This escrow uses multi-approval — use approve_milestone_multi")]
    UseMultiApproval,
    #[msg("Milestone not approved")]
    MilestoneNotApproved,
    #[msg("Reason too long (max 128 chars)")]
    ReasonTooLong,
    #[msg("Can only dispute rejected milestones")]
    CanOnlyDisputeRejected,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Insufficient funds in escrow")]
    InsufficientFunds,
    #[msg("Unauthorized dispute")]
    UnauthorizedDispute,
    #[msg("Milestone not disputed")]
    NotDisputed,
    #[msg("Unauthorized resolve")]
    UnauthorizedResolve,
}
