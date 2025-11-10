# Escrow Admin Console

## Purpose
- Enable operations teams to manage SOL/USDC escrow endpoints without editing environment files directly.
- Surface real-time balances for audit readiness and incident response.
- Provide optional API-key gating so production environments stay protected.

## Features
1. **Configuration Editor**
   - SOL escrow public key
   - USDC mint & escrow token account
   - USDC decimals (defaults to 6)
   - Optional `x-admin-key` header for API requests
2. **On-Chain Analytics**
   - Fetch SOL balance (lamports → SOL)
   - Fetch USDC token balance via `getTokenAccountBalance`
   - Explorer deep links for both accounts
   - Alert badges when balances fall below configured thresholds
3. **Safety Rails**
   - Updates runtime store only (reminds operators to persist env vars)
   - Simulated fallback when required fields absent
   - Respects `ADMIN_API_KEY` if present

## API Endpoints
- `GET /api/admin/escrow` – return current config
- `POST /api/admin/escrow` – update config (requires `x-admin-key` when `ADMIN_API_KEY` is set)

## Environment Variables
```
NEXT_PUBLIC_ESCROW_WALLET
NEXT_PUBLIC_USDC_MINT
NEXT_PUBLIC_ESCROW_USDC_ACCOUNT
NEXT_PUBLIC_USDC_DECIMALS
NEXT_PUBLIC_ESCROW_SOL_THRESHOLD (defaults to 1 SOL)
NEXT_PUBLIC_ESCROW_USDC_THRESHOLD (defaults to 1000 USDC)
ADMIN_API_KEY (optional)
NEXT_PUBLIC_SOLANA_CLUSTER (defaults to devnet)
NEXT_PUBLIC_SOLANA_RPC
NEXT_PUBLIC_SOLANA_EXPLORER
```

## Usage Notes
- Dashboard available at `/admin/escrow`.
- Balances use `confirmed` commitment; consider background monitoring for production thresholds.
- Updates persist until the server restarts—persist to database or secrets manager for long-term storage.
