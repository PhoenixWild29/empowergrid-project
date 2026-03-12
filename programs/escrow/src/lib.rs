use anchor_lang::prelude::*;

declare_id!(&quot;Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS&quot;);

#[program]
pub mod escrow {
    use super::*;

    pub fn initialize(ctx: Context&lt;Initialize&gt;) -&gt; Result&lt;()&gt; {
        msg!(&quot;Initialize escrow&quot;);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize&lt;&#39;info&gt; {
    #[account(mut)]
    pub payer: Signer&lt;&#39;info&gt;,
    pub system_program: Program&lt;&#39;info, System&gt;,
}