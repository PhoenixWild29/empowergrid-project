# Transaction Feedback Patterns

## Objectives
- Give investors immediate clarity on the lifecycle of their blockchain transactions.
- Provide actionable guidance when issues arise (insufficient SOL, RPC outages, wallet disconnects).
- Maintain a historical feed so users can audit past deposits, withdrawals, and governance actions.

## Messaging Framework
1. **Submission** – “Escrow deposit submitted” with pending badge and short description.
2. **Confirmation** – Promote to success with human language (“Funds locked in escrow”).
3. **Failure** – Explain the reason in plain English and direct the user to retry or view details.
4. **Explorer Link** – Available under “Advanced details” for power users who need raw signatures.

## UI Components
- Toast notifications for immediate feedback.
- Persistent Transaction Center panel listing status, timestamps, and explorer shortcuts.
- Status pills (Pending, Confirmed, Failed) mapped to brand colors for quick scanning.
- Optional advanced drawer exposing RPC endpoint, signature hash, and commitment level.

## Interaction Design
- Queue multiple transactions; newest appear at top of the panel.
- Auto-collapse older confirmed items but keep them accessible for review.
- Allow users to clear completed entries while failures remain until resolved.

## Implementation Notes
- Wrap the app with `TransactionFeedbackProvider` to expose context.
- Use `trackTransaction` to register optimistic pending state and monitor confirmation.
- Default RPC endpoint respects `NEXT_PUBLIC_SOLANA_RPC`, falling back to devnet for staging.
- Accommodate simulation mode for UI-triggered flows during development or tests.
