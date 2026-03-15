# EGRID-003: Milestone-Gated Release with Multi-Party Approval

## Sprint Spec — Technical Implementation Guide

**Sprint:** EGRID-003
**Status:** Spec Ready — Awaiting Implementation
**Author:** Claude Code (reviewed by phoenixwild)
**Date:** 2026-03-13

---

## 1. Overview

Extend the existing escrow program to support **multi-party milestone approval** with a governance threshold before funds are released. Currently, only the funder can approve milestones (single-signer). EGRID-003 adds:

- A `MilestoneConfig` PDA per escrow that defines approvers and threshold
- Per-milestone approval tracking (who approved, when)
- Threshold-gated release (e.g., 2-of-3 approvers required)
- Dispute/rejection flow with on-chain state

## 2. Architecture Decision: Extend Existing Program (Not CPI)

After reviewing the codebase, the existing escrow program is compact (~230 lines) and the milestone logic is tightly coupled to escrow state (`current_milestone`, `status`, `milestones` vec). **Extend the existing program** rather than creating a separate milestone program with CPI, because:

1. The `Escrow` account already owns milestone data — splitting would require duplicating or cross-referencing state
2. CPI adds compute budget overhead (~25k CU per invocation) and complexity for minimal separation benefit
3. The escrow program is not yet deployed to mainnet — no backwards-compatibility constraint

## 3. Account Structures

### 3.1 New: `MilestoneConfig` PDA

```rust
#[account]
pub struct MilestoneConfig {
    pub escrow: Pubkey,           // Parent escrow PDA
    pub approvers: Vec<Pubkey>,   // Up to 5 approver pubkeys
    pub threshold: u8,            // Required approvals (e.g., 2 of 3)
    pub bump: u8,
}

// Seeds: [b"milestone_config", escrow.key().as_ref()]
// Space: 8 + 32 + (4 + 32*5) + 1 + 1 = 206
```

### 3.2 New: `MilestoneApproval` PDA (per milestone index)

```rust
#[account]
pub struct MilestoneApproval {
    pub escrow: Pubkey,              // Parent escrow
    pub milestone_idx: u8,           // Which milestone
    pub approvals: Vec<ApprovalRecord>,
    pub status: MilestoneStatus,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ApprovalRecord {
    pub approver: Pubkey,
    pub approved_at: i64,         // Unix timestamp
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum MilestoneStatus {
    Pending,
    Approved,       // Threshold met
    Rejected,
    Disputed,
}

// Seeds: [b"milestone_approval", escrow.key().as_ref(), &[milestone_idx]]
// Space: 8 + 32 + 1 + (4 + (32+8)*5) + 1 + 1 = 247
```

### 3.3 Modified: `Escrow` Account

Add one field to existing Escrow:

```rust
pub struct Escrow {
    // ... existing fields ...
    pub has_multi_approval: bool,  // If true, use MilestoneConfig instead of funder-only approval
}
```

> **Space impact:** +1 byte. Current allocation is `8 + 1024` which has ~600 bytes of headroom. No realloc needed.

## 4. New Instructions

### 4.1 `configure_milestones`

Sets up multi-party approval for an escrow. Must be called by the funder after `initialize_escrow` but before `fund_escrow`.

```rust
pub fn configure_milestones(
    ctx: Context<ConfigureMilestones>,
    approvers: Vec<Pubkey>,
    threshold: u8,
) -> Result<()> {
    require!(approvers.len() >= 2 && approvers.len() <= 5, ErrorCode::InvalidApproverCount);
    require!(threshold >= 2 && threshold as usize <= approvers.len(), ErrorCode::InvalidThreshold);
    // Ensure no duplicate approvers
    let mut seen = std::collections::BTreeSet::new();
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
```

**Accounts:**
```rust
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
        space = 206,
        seeds = [b"milestone_config", escrow.key().as_ref()],
        bump,
    )]
    pub milestone_config: Account<'info, MilestoneConfig>,
    #[account(mut)]
    pub funder: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

### 4.2 `approve_milestone_multi`

Replaces single-signer `approve_milestone` when `has_multi_approval` is true. Each approver calls this individually.

```rust
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

    // Record approval
    approval.approvals.push(ApprovalRecord {
        approver,
        approved_at: Clock::get()?.unix_timestamp,
    });

    // Check if threshold met
    if approval.approvals.len() >= config.threshold as usize {
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
```

**Accounts:**
```rust
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
        space = 247,
        seeds = [b"milestone_approval", escrow.key().as_ref(), &[milestone_idx]],
        bump,
    )]
    pub milestone_approval: Account<'info, MilestoneApproval>,
    #[account(mut)]
    pub approver: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

### 4.3 `reject_milestone`

Any approver can reject. Moves milestone to `Rejected` status, blocks further approvals. Funder can then cancel or renegotiate off-chain.

```rust
pub fn reject_milestone(
    ctx: Context<RejectMilestone>,
    milestone_idx: u8,
    reason: String,  // Max 128 chars, stored in event only (not on-chain state)
) -> Result<()> {
    require!(reason.len() <= 128, ErrorCode::ReasonTooLong);
    let config = &ctx.accounts.milestone_config;
    let approval = &mut ctx.accounts.milestone_approval;
    let approver = ctx.accounts.approver.key();

    require!(config.approvers.contains(&approver), ErrorCode::NotApprover);
    require!(approval.status == MilestoneStatus::Pending, ErrorCode::MilestoneAlreadyFinalized);

    approval.status = MilestoneStatus::Rejected;

    emit!(MilestoneRejected {
        escrow: ctx.accounts.escrow.key(),
        milestone_idx,
        rejector: approver,
        reason,
    });

    Ok(())
}
```

### 4.4 `dispute_milestone`

Either funder or recipient can dispute a rejected milestone. Moves to `Disputed` — signals off-chain arbitration needed.

```rust
pub fn dispute_milestone(
    ctx: Context<DisputeMilestone>,
    milestone_idx: u8,
) -> Result<()> {
    let approval = &mut ctx.accounts.milestone_approval;
    require!(
        approval.status == MilestoneStatus::Rejected,
        ErrorCode::CanOnlyDisputeRejected
    );
    approval.status = MilestoneStatus::Disputed;

    emit!(MilestoneDisputed {
        escrow: ctx.accounts.escrow.key(),
        milestone_idx,
        disputer: ctx.accounts.disputer.key(),
    });

    Ok(())
}
```

### 4.5 `release_milestone_funds`

Modified release that works per-milestone (not cumulative). Only callable when a milestone is in `Approved` status.

```rust
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

    // Transfer SOL from escrow PDA to recipient
    let escrow_info = escrow.to_account_info();
    let recipient_info = ctx.accounts.recipient.to_account_info();
    **escrow_info.try_borrow_mut_lamports()? -= amount;
    **recipient_info.try_borrow_mut_lamports()? += amount;

    escrow.total_released += amount;

    emit!(MilestoneFundsReleased {
        escrow: escrow.key(),
        milestone_idx,
        amount,
        recipient: ctx.accounts.recipient.key(),
    });

    Ok(())
}
```

> **Note:** Uses direct lamport manipulation instead of CPI `system_program::transfer` for PDA-to-account transfers. This is the standard Anchor pattern since the escrow PDA owns the lamports.

## 5. Events

```rust
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
```

## 6. New Error Codes

```rust
// Add to existing ErrorCode enum:
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
#[msg("Milestone not approved")]
MilestoneNotApproved,
#[msg("Reason too long (max 128 chars)")]
ReasonTooLong,
#[msg("Can only dispute rejected milestones")]
CanOnlyDisputeRejected,
```

## 7. Security Considerations

### 7.1 Critical Checks
- **Double-approval prevention:** `approval.approvals.iter().any(|a| a.approver == approver)` — must check before push
- **Approver authorization:** Always validate `config.approvers.contains(&approver)` — never trust the signer alone
- **Double-release prevention:** After releasing, mark the milestone amount as 0 or track released milestones in a bitfield to prevent replaying `release_milestone_funds`
- **Account ownership:** All PDA seed derivations must include the escrow key to prevent cross-escrow attacks
- **Signer checks:** Anchor's `Signer<'info>` handles this, but verify constraint annotations are correct

### 7.2 Compute Budget
- `approve_milestone_multi` with 5 approvers: ~50k CU (well within 200k default)
- `init_if_needed` on `MilestoneApproval`: first approver pays rent, subsequent calls skip init

### 7.3 Integer Safety
- All arithmetic uses `u64` with `saturating_sub` for balance calculations
- Milestone amounts are set at init time and immutable — no overflow risk on approval

### 7.4 Upgrade Safety
- Adding `has_multi_approval: bool` to `Escrow` is backwards-compatible (defaults to `false`)
- Existing single-signer `approve_milestone` continues to work when `has_multi_approval` is false
- New accounts (`MilestoneConfig`, `MilestoneApproval`) are only created when multi-approval is configured

## 8. Backwards Compatibility

The existing `approve_milestone` instruction MUST continue to work for escrows without multi-approval. Add a guard:

```rust
pub fn approve_milestone(ctx: Context<ApproveMilestone>, milestone_idx: u8) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    require!(!escrow.has_multi_approval, ErrorCode::UseMultiApproval);
    // ... existing logic unchanged ...
}
```

Add error code:
```rust
#[msg("This escrow uses multi-approval — use approve_milestone_multi")]
UseMultiApproval,
```

## 9. Test Plan

### Unit Tests (Rust)
1. `configure_milestones` — valid 2-of-3, 3-of-5 configs
2. `configure_milestones` — reject: threshold > approvers, threshold < 2, duplicate approvers
3. `configure_milestones` — reject: called after funding (wrong status)

### Integration Tests (TypeScript)
1. **Happy path:** init → configure(3 approvers, threshold=2) → fund → approve×2 → release → verify balances
2. **Partial approval:** 1-of-2 approvals → verify milestone stays `Pending`, funds locked
3. **Rejection flow:** approve×1 → reject → verify `Rejected` status, no release possible
4. **Dispute flow:** reject → dispute → verify `Disputed` status
5. **Backwards compat:** init (no configure) → fund → single-signer approve → release (old flow still works)

### Security Tests
1. **Non-approver tries to approve** → `NotApprover` error
2. **Same approver tries twice** → `AlreadyApproved` error
3. **Release before threshold met** → `MilestoneNotApproved` error
4. **Double release same milestone** → `NothingToRelease` error
5. **Cross-escrow attack** — use MilestoneApproval PDA from escrow A on escrow B → seed mismatch, Anchor rejects

### Performance Tests
1. Max config (5 approvers, threshold=5) — verify compute budget
2. All 10 milestones approved sequentially — verify state transitions

## 10. Implementation Order

1. **Add account structs** — `MilestoneConfig`, `MilestoneApproval`, `ApprovalRecord`, `MilestoneStatus`
2. **Add `has_multi_approval` to `Escrow`** — update space comment, default false
3. **Add `configure_milestones` instruction** — with account validation
4. **Add `approve_milestone_multi`** — with threshold check and auto-advance
5. **Add guard to existing `approve_milestone`** — reject if multi-approval enabled
6. **Add `reject_milestone` and `dispute_milestone`** — with events
7. **Add `release_milestone_funds`** — per-milestone release with double-release guard
8. **Add events and error codes**
9. **Write tests** — follow test plan above
10. **Run `anchor build` and `anchor test`** — verify everything compiles and passes

## 11. Files to Modify

- `programs/escrow/src/lib.rs` — All new instructions, accounts, structs, errors
- `tests/escrow.test.ts` — New test cases
- `Anchor.toml` — No changes needed (same program)

---

**IMPORTANT FOR AGENT:** Use `&&` not `;&` for chaining shell commands. First read the repo structure before making changes. Run `anchor build` after each major change to catch errors early.
