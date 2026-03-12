use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!(&quot;Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS&quot;);

#[program]
pub mod escrow {
    use super::*;

    pub fn initialize_escrow(ctx: Context&lt;InitializeEscrow&gt;, milestones: Vec&lt;Milestone&gt;, deadline: i64) -&gt; Result&lt;()&gt; {
        let escrow = &amp;mut ctx.accounts.escrow;
        require!(milestones.len() &gt; 0, ErrorCode::NoMilestones);
        require!(milestones.len() &lt;= 10, ErrorCode::TooManyMilestones);
        escrow.funder = ctx.accounts.funder.key();
        escrow.recipient = ctx.accounts.recipient.key();
        escrow.milestones = milestones;
        escrow.current_milestone = 0;
        escrow.total_funded = 0;
        escrow.total_released = 0;
        escrow.status = Status::Initialized;
        escrow.deadline = deadline;
        escrow.bump = ctx.bumps.escrow;
        Ok(())
    }

    pub fn fund_escrow(ctx: Context&lt;FundEscrow&gt;, amount: u64) -&gt; Result&lt;()&gt; {
        let escrow = &amp;mut ctx.accounts.escrow;
        require!(escrow.status == Status::Initialized, ErrorCode::InvalidStatus);
        require!(amount &gt; 0, ErrorCode::InvalidAmount);
        let cpi_accounts = Transfer {
            from: ctx.accounts.funder.to_account_info(),
            to: ctx.accounts.escrow.to_account_info(),
        };
        let cpi_program = ctx.accounts.system_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts).with_signer(&amp;[&amp;ctx.accounts.escrow_seeds()]);
        transfer(cpi_ctx, amount)?;
        escrow.total_funded += amount;
        escrow.status = Status::Funded;
        Ok(())
    }

    pub fn approve_milestone(ctx: Context&lt;ApproveMilestone&gt;, milestone_idx: u8) -&gt; Result&lt;()&gt; {
        let escrow = &amp;mut ctx.accounts.escrow;
        require!(escrow.status == Status::Funded || escrow.status == Status::Active, ErrorCode::InvalidStatus);
        require!(milestone_idx as usize == escrow.current_milestone as usize, ErrorCode::InvalidIndex);
        require!(milestone_idx as usize &lt; escrow.milestones.len(), ErrorCode::InvalidIndex);
        escrow.current_milestone += 1;
        if escrow.current_milestone as usize == escrow.milestones.len() {
            escrow.status = Status::Completed;
        } else {
            escrow.status = Status::Active;
        }
        Ok(())
    }

    pub fn release_funds(ctx: Context&lt;ReleaseFunds&gt;) -&gt; Result&lt;()&gt; {
        let escrow = &amp;mut ctx.accounts.escrow;
        require!(escrow.status == Status::Active || escrow.status == Status::Completed, ErrorCode::InvalidStatus);
        let mut to_release = 0u64;
        for i in 0..escrow.current_milestone as usize {
            to_release += escrow.milestones[i].amount;
        }
        require!(to_release &gt; escrow.total_released, ErrorCode::NothingToRelease);
        let remaining = to_release.saturating_sub(escrow.total_released);
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow.to_account_info(),
            to: ctx.accounts.recipient.to_account_info(),
        };
        let cpi_program = ctx.accounts.system_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts).with_signer(&amp;[&amp;ctx.accounts.escrow_seeds()]);
        transfer(cpi_ctx, remaining)?;
        escrow.total_released += remaining;
        Ok(())
    }

    pub fn cancel_escrow(ctx: Context&lt;CancelEscrow&gt;) -&gt; Result&lt;()&gt; {
        let escrow = &amp;mut ctx.accounts.escrow;
        require!(escrow.status != Status::Completed, ErrorCode::CannotCancelCompleted);
        require!(Clock::get()?.unix_timestamp &lt; escrow.deadline, ErrorCode::DeadlinePassed);
        let refund_amount = escrow.total_funded.saturating_sub(escrow.total_released);
        if refund_amount &gt; 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.escrow.to_account_info(),
                to: ctx.accounts.funder.to_account_info(),
            };
            let cpi_program = ctx.accounts.system_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts).with_signer(&amp;[&amp;ctx.accounts.escrow_seeds()]);
            transfer(cpi_ctx, refund_amount)?;
        }
        escrow.status = Status::Cancelled;
        Ok(())
    }

    pub fn refund_after_deadline(ctx: Context&lt;RefundAfterDeadline&gt;) -&gt; Result&lt;()&gt; {
        let escrow = &amp;mut ctx.accounts.escrow;
        require!(escrow.status != Status::Completed &amp;&amp; escrow.status != Status::Cancelled, ErrorCode::InvalidStatus);
        require!(Clock::get()?.unix_timestamp &gt; escrow.deadline, ErrorCode::DeadlineNotPassed);
        let refund_amount = escrow.total_funded.saturating_sub(escrow.total_released);
        if refund_amount &gt; 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.escrow.to_account_info(),
                to: ctx.accounts.funder.to_account_info(),
            };
            let cpi_program = ctx.accounts.system_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts).with_signer(&amp;[&amp;ctx.accounts.escrow_seeds()]);
            transfer(cpi_ctx, refund_amount)?;
        }
        escrow.status = Status::Cancelled;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction()]
pub struct InitializeEscrow&lt;&#39;info&gt; {
    #[account(
        init,
        payer = funder,
        space = 8 + 1024,
        seeds = [b&quot;escrow&quot;, funder.key().as_ref(), recipient.key().as_ref()],
        bump
    )]
    pub escrow: Account&lt;&#39;info, Escrow&gt;,
    #[account(mut)]
    pub funder: Signer&lt;&#39;info&gt;,
    /// CHECK: recipient pubkey checked in seeds
    pub recipient: AccountInfo&lt;&#39;info&gt;,
    pub system_program: Program&lt;&#39;info, System&gt;,
}

#[derive(Accounts)]
pub struct FundEscrow&lt;&#39;info&gt; {
    #[account(mut, seeds = [b&quot;escrow&quot;, escrow.funder.as_ref(), escrow.recipient.as_ref()], bump = escrow.bump)]
    pub escrow: Account&lt;&#39;info, Escrow&gt;,
    #[account(mut)]
    pub funder: Signer&lt;&#39;info&gt;,
    pub system_program: Program&lt;&#39;info, System&gt;,
}

#[derive(Accounts)]
pub struct ApproveMilestone&lt;&#39;info&gt; {
    #[account(mut, seeds = [b&quot;escrow&quot;, funder.key().as_ref(), escrow.recipient.as_ref()], bump = escrow.bump)]
    pub escrow: Account&lt;&#39;info, Escrow&gt;,
    pub funder: Signer&lt;&#39;info&gt;,
}

#[derive(Accounts)]
pub struct ReleaseFunds&lt;&#39;info&gt; {
    #[account(mut, seeds = [b&quot;escrow&quot;, escrow.funder.as_ref(), recipient.key().as_ref()], bump = escrow.bump)]
    pub escrow: Account&lt;&#39;info, Escrow&gt;,
    #[account(mut)]
    pub recipient: Signer&lt;&#39;info&gt;,
    pub system_program: Program&lt;&#39;info, System&gt;,
}

#[derive(Accounts)]
pub struct CancelEscrow&lt;&#39;info&gt; {
    #[account(mut, seeds = [b&quot;escrow&quot;, funder.key().as_ref(), escrow.recipient.as_ref()], bump = escrow.bump)]
    pub escrow: Account&lt;&#39;info, Escrow&gt;,
    #[account(mut)]
    pub funder: Signer&lt;&#39;info&gt;,
    pub system_program: Program&lt;&#39;info, System&gt;,
}

#[derive(Accounts)]
pub struct RefundAfterDeadline&lt;&#39;info&gt; {
    #[account(mut, seeds = [b&quot;escrow&quot;, funder.key().as_ref(), escrow.recipient.as_ref()], bump = escrow.bump)]
    pub escrow: Account&lt;&#39;info, Escrow&gt;,
    #[account(mut)]
    pub funder: Signer&lt;&#39;info&gt;,
    pub system_program: Program&lt;&#39;info, System&gt;,
}

#[account]
pub struct Escrow {
    pub funder: Pubkey,
    pub recipient: Pubkey,
    pub milestones: Vec&lt;Milestone&gt;,
    pub current_milestone: u8,
    pub total_funded: u64,
    pub total_released: u64,
    pub status: Status,
    pub deadline: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct Milestone {
    pub amount: u64,
    pub description: Option&lt;String&gt;,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum Status {
    Initialized,
    Funded,
    Active,
    Completed,
    Cancelled,
}

impl Escrow {
    pub fn escrow_seeds(&amp;self) -&gt; [&amp;[u8]; 4] {
        [
            b&quot;escrow&quot;,
            self.funder.as_ref(),
            self.recipient.as_ref(),
            &amp;[self.bump],
        ]
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg(&quot;Invalid status&quot;)]
    InvalidStatus,
    #[msg(&quot;Invalid milestone index&quot;)]
    InvalidIndex,
    #[msg(&quot;No milestones provided&quot;)]
    NoMilestones,
    #[msg(&quot;Too many milestones (max 10)&quot;)]
    TooManyMilestones,
    #[msg(&quot;Invalid amount&quot;)]
    InvalidAmount,
    #[msg(&quot;Nothing to release&quot;)]
    NothingToRelease,
    #[msg(&quot;Cannot cancel completed escrow&quot;)]
    CannotCancelCompleted,
    #[msg(&quot;Deadline has passed&quot;)]
    DeadlinePassed,
    #[msg(&quot;Deadline not yet passed&quot;)]
    DeadlineNotPassed,
}