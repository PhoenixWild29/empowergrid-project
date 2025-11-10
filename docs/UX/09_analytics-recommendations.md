# Analytics & Recommendation Layer

## Objectives
- Deliver real-time feedback loops so investors, developers, and validators see the impact of their actions.
- Provide intelligent recommendations (projects, reinvestments, validator assignments) grounded in telemetry and user history.
- Surface anomalies early through notifications and dashboards without overwhelming users.

## Core Streams
1. **Activity Signals**
   - Funding events (escrow deposits, tranche releases, validator approvals)
   - Performance telemetry (energy production, uptime, CO₂ offset deviations)
   - Governance actions (votes cast, proposals queued/executed)
2. **Notification Destinations**
   - In-app bell + digest panel
   - Email/webhook for high-priority alerts
   - Optional Slack/Teams integration for validator teams
3. **Recommendation Targets**
   - Investor: projects to reinvest, auto-rollover suggestions, social proof highlights
   - Developer: validator pairing suggestions, milestone pacing tips
   - Validator: backlog reprioritisation, expertise-based assignment prompts

## Information Architecture
- `ActivityStreamContext` for real-time events + optimistic inserts
- `NotificationCenter` floating panel with filters (All, Funding, Ops, Governance)
- `RecommendationRail` component embedded in portfolio + marketplace
- API endpoints:
  - `GET /api/analytics/activity` (cursor pagination)
  - `POST /api/analytics/subscribe` (user channel prefs)
  - `GET /api/recommendations/overview` (personalised cards)

## Data Sources
- Prisma tables: `ActivityEvent`, `NotificationPreference`, `RecommendationSnapshot`
- On-chain hooks: scheduled job enriches `ActivityEvent` with confirmed Solana transactions
- ML feature store: `recommendation_features.snapshots` (TensorFlow.js scoring in worker)

## UX Patterns
- Timestamps rendered as relative time with tooltips for exact values
- Severity badges (`info`, `success`, `warning`, `critical`)
- Collapsible detail rows for richly formatted payloads (transaction hash, validator notes)
- Batched digest cards (“3 new validator approvals”, “Portfolio up 4.2% this week”)

## Technical Plan
1. **Documentation + Contracts** *(current step)*
   - Define event schema, notification payload structure, recommendation card interface.
2. **Implementation** *(next step)*
   - Activity feed UI, notification bell, recommendation API stubs with mock scoring.
   - React Query hooks: `useActivityStream`, `useNotifications`, `useRecommendations`.
   - Background worker (cron) to promote queued recommendations to live snapshots.
3. **Testing**
   - Unit tests for aggregation utilities (event grouping, severity thresholds).
   - Integration test for `/api/recommendations/overview` ensuring fallback suggestions.
   - Snapshot test for notification panel rendering of mixed severities.

## Success Metrics
- ≥90% of high-priority events acknowledged within 12h.
- Recommendation click-through ≥15% for active investors.
- <5% of notifications marked as “not relevant”.
