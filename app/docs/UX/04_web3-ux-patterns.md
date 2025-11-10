# Web3 UX Patterns – Wallet & Transaction Experience

## Goals
- Reduce drop-off for first-time crypto users through guided wallet onboarding.
- Provide human-readable transaction feedback with clear next steps when issues occur.
- Offer progressive disclosure: simple summaries for newcomers, granular RPC details for power users.

## Wallet Onboarding Checklist
1. Detect extension (Phantom, Solflare) and show inline install steps if absent.
2. Highlight security reminders (never share seed phrase, verify URLs).
3. Run readiness checks before allowing investment:
   - Extension detected
   - Network reachable (RPC heartbeat)
   - Account balance available
4. Offer links to official download pages and help centre articles.

## Connection Flow Enhancements
- “Connect wallet” triggers readiness panel rather than a modal surprise.
- Show live status badges (`Checking RPC`, `Ready`, `Action required`).
- Auto-retry health probe after transient failures; provide manual retry button.
- Call out currently selected cluster (devnet / mainnet) and allow advanced view.

## Transaction Feedback Principles
- Always display human-readable summary (`“Escrow deposit pending…”`).
- Include checklist for common failure causes (insufficient SOL, network congestion).
- Persist transaction history in dashboard with timestamps and outcome badges.
- Provide copyable signature + explorer link under "Advanced details".

## Progressive Disclosure
- Default view: status pills, short explanations, primary CTA.
- Advanced drawer reveals RPC endpoint, cluster latency, last block height.
- Remember user preference (advanced expanded/collapsed) in localStorage.

## Next Steps
- Integrate readiness panel into `WalletConnect` component.
- Extend transaction toast system to surface real-time updates from Solana websockets.
- Hook investment mutations to the transaction feedback model.

## Implementation Notes
- Wrap the app with `TransactionFeedbackProvider` to expose context.
- Use `trackTransaction` to register optimistic pending state and monitor confirmation.
- Default RPC endpoint respects `NEXT_PUBLIC_SOLANA_RPC`, falling back to devnet for staging.
- Accommodate simulation mode for UI-triggered flows during development or tests.
- Configure native escrow target with `NEXT_PUBLIC_ESCROW_WALLET` (SOL) and stablecoin support with `NEXT_PUBLIC_USDC_MINT`, `NEXT_PUBLIC_ESCROW_USDC_ACCOUNT`, and optional `NEXT_PUBLIC_USDC_DECIMALS` (default 6).
