## API Endpoints
- `GET /api/admin/escrow` – return current config
- `POST /api/admin/escrow` – update config (requires `x-admin-key` when `ADMIN_API_KEY` is set)
- `GET|POST /api/cron/escrow-health` – cron-friendly endpoint that records a snapshot and triggers alerts when balances fall below thresholds

## Usage Notes
- Dashboard available at `/admin/escrow`.
- Balances use `confirmed` commitment; consider background monitoring for production thresholds (hit `/api/cron/escrow-health` on a schedule).
- Updates persist until the server restarts—persist to database or secrets manager for long-term storage.
