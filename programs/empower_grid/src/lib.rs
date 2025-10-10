use anchor_lang::prelude::*;
use solana_program::{program::invoke, system_instruction};

// WO-90: Import escrow state data structures
pub mod state;
pub use state::*;

// WO-109: Import upgrade management structures
pub mod upgrade;
pub use upgrade::*;

declare_id!("YourProgramIdHereReplaceThisWithActualID");

/// EmpowerGRID is a milestone‑based escrow program for funding and deploying
/// renewable energy projects using native SOL.  Contributions are held in a
/// vault PDA until verified production and carbon‑offset milestones are met.
/// When the community governance PDA executes a milestone release, funds
/// are transferred to the installer/operator.
#[program]
pub mod empower_grid {
    use super::*;

    /// Initialize global state for the EmpowerGrid platform.  Records the
    /// platform authority and zeroes the project counter.  This must be
    /// called exactly once by the deployer.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.authority = *ctx.accounts.authority.key;
        state.project_count = 0;
        Ok(())
    }

    /// Create a new project.  This sets up a Project account and a
    /// corresponding Vault account for escrow.  The caller becomes the
    /// project creator.  A governance authority (Realms PDA) and oracle
    /// authority (Switchboard relayer/function) are also recorded.
    pub fn create_project(
        ctx: Context<CreateProject>,
        name: String,
        description: String,
        governance_authority: Pubkey,
        oracle_authority: Pubkey,
    ) -> Result<()> {
        require!(name.len() <= 64 && description.len() <= 256, ErrorCode::StringTooLong);

        let state = &mut ctx.accounts.state;
        let project = &mut ctx.accounts.project;
        state.project_count = state
            .project_count
            .checked_add(1)
            .ok_or(ErrorCode::NumericalOverflow)?;
        project.id = state.project_count;
        project.name = name;
        project.description = description;
        project.creator = *ctx.accounts.creator.key;
        project.governance_authority = governance_authority;
        project.oracle_authority = oracle_authority;
        project.vault = ctx.accounts.vault.key();
        project.vault_bump = *ctx.bumps.get("vault").unwrap();
        project.funded_amount = 0;
        project.kwh_total = 0;
        project.co2_total = 0;
        project.last_metrics_root = [0u8; 32];
        project.num_milestones = 0;
        Ok(())
    }

    /// Create or update a milestone for a project.  Milestones define
    /// thresholds for kWh and CO₂ offsets and specify the payout amount
    /// (in lamports) and payee.  Only the project creator or the
    /// governance authority may call this.
    pub fn create_milestone(
        ctx: Context<CreateMilestone>,
        index: u8,
        amount_lamports: u64,
        kwh_target: u64,
        co2_target: u64,
        payee: Pubkey,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;
        require!(
            ctx.accounts.creator.key() == project.creator
                || ctx.accounts.governance_authority.key() == project.governance_authority,
            ErrorCode::Unauthorized
        );

        let ms = &mut ctx.accounts.milestone;
        ms.project = project.key();
        ms.index = index;
        ms.amount_lamports = amount_lamports;
        ms.kwh_target = kwh_target;
        ms.co2_target = co2_target;
        ms.payee = payee;
        ms.released = false;
        if index + 1 > project.num_milestones {
            project.num_milestones = index + 1;
        }
        Ok(())
    }

    /// Fund a project by transferring SOL from the funder to the
    /// project's escrow vault.  Updates the funded_amount counter.
    pub fn fund_project(ctx: Context<FundProject>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        let ix = system_instruction::transfer(
            &ctx.accounts.funder.key(),
            &ctx.accounts.vault.key(),
            amount,
        );
        invoke(
            &ix,
            &[ctx.accounts.funder.to_account_info(), ctx.accounts.vault.to_account_info(), ctx.accounts.system_program.to_account_info()],
        )?;
        let project = &mut ctx.accounts.project;
        project.funded_amount = project
            .funded_amount
            .checked_add(amount)
            .ok_or(ErrorCode::NumericalOverflow)?;
        emit!(ProjectFunded {
            project: project.key(),
            funder: ctx.accounts.funder.key(),
            amount,
        });
        Ok(())
    }

    /// Called by the oracle authority to submit new production/offset
    /// metrics.  Optionally passes a new Merkle root for compressed
    /// readings.  Adds the deltas to running totals.
    pub fn submit_metrics(
        ctx: Context<SubmitMetrics>,
        kwh_delta: u64,
        co2_delta: u64,
        new_root: Option<[u8; 32]>,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;
        require_keys_eq!(project.oracle_authority, ctx.accounts.oracle_authority.key(), ErrorCode::Unauthorized);
        project.kwh_total = project
            .kwh_total
            .checked_add(kwh_delta)
            .ok_or(ErrorCode::NumericalOverflow)?;
        project.co2_total = project
            .co2_total
            .checked_add(co2_delta)
            .ok_or(ErrorCode::NumericalOverflow)?;
        if let Some(root) = new_root {
            project.last_metrics_root = root;
        }
        emit!(MetricsUpdated {
            project: project.key(),
            kwh_total: project.kwh_total,
            co2_total: project.co2_total,
        });
        Ok(())
    }

    /// Release a milestone if thresholds are met.  Only the governance
    /// authority (the Realms PDA) may call this.  Transfers SOL
    /// from the project's vault to the payee.
    pub fn release_milestone(ctx: Context<ReleaseMilestone>) -> Result<()> {
        let project = &mut ctx.accounts.project;
        require!(ctx.accounts.governance_authority.is_signer, ErrorCode::Unauthorized);
        require_keys_eq!(project.governance_authority, ctx.accounts.governance_authority.key(), ErrorCode::Unauthorized);
        let ms = &mut ctx.accounts.milestone;
        require!(!ms.released, ErrorCode::AlreadyReleased);
        require_keys_eq!(ms.project, project.key(), ErrorCode::InvalidMilestone);
        require!(project.kwh_total >= ms.kwh_target, ErrorCode::MetricThresholdNotMet);
        require!(project.co2_total >= ms.co2_target, ErrorCode::MetricThresholdNotMet);
        let vault_balance = ctx.accounts.vault.to_account_info().lamports();
        require!(vault_balance >= ms.amount_lamports, ErrorCode::InsufficientFunds);
        // transfer lamports to payee
        **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? = vault_balance
            .checked_sub(ms.amount_lamports)
            .ok_or(ErrorCode::NumericalOverflow)?;
        **ctx.accounts.payee.to_account_info().try_borrow_mut_lamports()? = ctx.accounts
            .payee
            .to_account_info()
            .lamports()
            .checked_add(ms.amount_lamports)
            .ok_or(ErrorCode::NumericalOverflow)?;
        ms.released = true;
        emit!(MilestoneReleased {
            project: project.key(),
            index: ms.index,
            amount: ms.amount_lamports,
            payee: ms.payee,
        });
        Ok(())
    }

    /// Change the governance authority for a project.  Useful if the DAO
    /// upgrades or migrates to a new treasury PDA.  Only callable by
    /// the current governance authority.
    pub fn set_project_authority(
        ctx: Context<SetProjectAuthority>,
        new_governance_authority: Pubkey,
    ) -> Result<()> {
        require!(ctx.accounts.current_governance_authority.is_signer, ErrorCode::Unauthorized);
        let project = &mut ctx.accounts.project;
        require_keys_eq!(project.governance_authority, ctx.accounts.current_governance_authority.key(), ErrorCode::Unauthorized);
        project.governance_authority = new_governance_authority;
        Ok(())
    }
}

// ---- Context structs ----

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + State::SIZE)]
    pub state: Account<'info, State>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name: String, description: String)]
pub struct CreateProject<'info> {
    #[account(mut, has_one = authority)]
    pub state: Account<'info, State>,
    #[account(
        init,
        payer = creator,
        space = 8 + Project::SIZE,
        seeds = [b"project", state.key().as_ref(), creator.key().as_ref(), &state.project_count.checked_add(1).unwrap().to_le_bytes()],
        bump,
    )]
    pub project: Account<'info, Project>,
    #[account(
        init,
        payer = creator,
        space = 8 + Vault::SIZE,
        seeds = [b"vault", project.key().as_ref()],
        bump,
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub authority: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateMilestone<'info> {
    #[account(mut)]
    pub project: Account<'info, Project>,
    #[account(
        init,
        payer = creator,
        space = 8 + Milestone::SIZE,
        seeds = [b"milestone", project.key().as_ref(), &[index]],
        bump,
    )]
    pub milestone: Account<'info, Milestone>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub governance_authority: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundProject<'info> {
    #[account(mut)]
    pub project: Account<'info, Project>,
    #[account(mut, seeds = [b"vault", project.key().as_ref()], bump = project.vault_bump)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub funder: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitMetrics<'info> {
    #[account(mut)]
    pub project: Account<'info, Project>,
    pub oracle_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ReleaseMilestone<'info> {
    #[account(mut)]
    pub project: Account<'info, Project>,
    #[account(mut, seeds = [b"vault", project.key().as_ref()], bump = project.vault_bump)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub milestone: Account<'info, Milestone>,
    #[account(mut)]
    pub payee: SystemAccount<'info>,
    pub governance_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetProjectAuthority<'info> {
    #[account(mut)]
    pub project: Account<'info, Project>,
    pub current_governance_authority: Signer<'info>,
}

// ---- Data structs ----

#[account]
pub struct State {
    pub authority: Pubkey,
    pub project_count: u64,
}
impl State {
    pub const SIZE: usize = 32 + 8;
}

#[account]
pub struct Vault {
    pub bump: u8,
}
impl Vault {
    pub const SIZE: usize = 1;
}

#[account]
pub struct Project {
    pub id: u64,
    pub name: String,
    pub description: String,
    pub creator: Pubkey,
    pub governance_authority: Pubkey,
    pub oracle_authority: Pubkey,
    pub vault: Pubkey,
    pub vault_bump: u8,
    pub funded_amount: u64,
    pub kwh_total: u64,
    pub co2_total: u64,
    pub last_metrics_root: [u8; 32],
    pub num_milestones: u8,
}
impl Project {
    pub const SIZE: usize = 8 + (4 + 64) + (4 + 256) + 32 + 32 + 32 + 32 + 1 + 8 + 8 + 8 + 32 + 1;
}

#[account]
pub struct Milestone {
    pub project: Pubkey,
    pub index: u8,
    pub amount_lamports: u64,
    pub kwh_target: u64,
    pub co2_target: u64,
    pub payee: Pubkey,
    pub released: bool,
}
impl Milestone {
    pub const SIZE: usize = 32 + 1 + 8 + 8 + 8 + 32 + 1;
}

// ---- Events ----

#[event]
pub struct ProjectFunded {
    pub project: Pubkey,
    pub funder: Pubkey,
    pub amount: u64,
}

#[event]
pub struct MetricsUpdated {
    pub project: Pubkey,
    pub kwh_total: u64,
    pub co2_total: u64,
}

#[event]
pub struct MilestoneReleased {
    pub project: Pubkey,
    pub index: u8,
    pub amount: u64,
    pub payee: Pubkey,
}

// ---- Errors ----

#[error_code]
pub enum ErrorCode {
    #[msg("Numerical overflow occurred.")]
    NumericalOverflow,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("String too long.")]
    StringTooLong,
    #[msg("Invalid milestone account.")]
    InvalidMilestone,
    #[msg("Metric threshold not met.")]
    MetricThresholdNotMet,
    #[msg("Insufficient funds in vault.")]
    InsufficientFunds,
    #[msg("Milestone already released.")]
    AlreadyReleased,
    #[msg("Invalid amount.")]
    InvalidAmount,
}