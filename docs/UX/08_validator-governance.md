# Validator & Governance Tooling

## Objectives
- Give validators a dedicated hub for reviewing milestones, raising flags, and publishing approvals.
- Provide governance leads with a lightweight console to queue proposals, tally votes, and surface risk alerts.
- Maintain a transparent audit trail that feeds investor-facing impact dashboards.

## Core Personas
- **Validator Lead** – triages incoming milestone submissions, assigns reviewers, pushes approvals/holds.
- **Community Validator** – receives assignments, uploads findings, escalates anomalies.
- **Governance Steward** – manages treasury & policy proposals, monitors quorum participation.

## Verification Hub Flow
1. **Inbox Overview**
   - Tabs: `Awaiting Review`, `Needs Info`, `Completed`.
   - Summary tiles (pending milestones, average SLA, open disputes).
2. **Milestone Detail Drawer**
   - Project snapshot, requested payout, validator history.
   - Evidence gallery (files, links, oracle feeds).
   - Action panel: Approve, Request Changes, Flag for Arbitration.
3. **Assignment Manager**
   - Auto-suggest validator pools by expertise & load.
   - Manual override with reason capture.
   - SLA timer with color-coded warnings.
4. **Decision Log**
   - Timeline of comments, decisions, and attached evidence.
   - Export to JSON/CSV for compliance checks.

## Governance Console Flow
1. **Proposal Board**
   - Filters: `Funding`, `Policy`, `Emergency`.
   - Status pills: Draft, Active, Passed, Failed, Queued.
2. **Proposal Composer**
   - Form sections: metadata, rationale, action items, on-chain payload preview.
   - Live quorum requirements + risk warnings (e.g., insufficient validator participation).
3. **Voting Matrix**
   - Snapshot of validator house, community house, investor advisory votes.
   - Real-time quorum %, outcome projection, voting deadlines.
4. **Execution Tracker**
   - Shows queued instructions, operator notes, execution receipts.

## Data Visualization & Alerts
- SLA breach heatmap, dispute rate trend, validator load balance.
- Governance health indicators (proposal throughput, participation delta, treasury utilization).
- Alert tiers: Info, Warning, Critical with Slack/Webhook destinations.

## Technical Notes
- API routes: `/api/validators/milestones`, `/api/validators/assignments`, `/api/governance/proposals`.
- React Query for inbox lists, optimistic updates on decision submit.
- Socket channel `validator-events` for real-time assignment updates.
- Persist decision logs in `ValidatorDecision` table; proposals in `GovernanceProposal` table.
- Feature flags: `VALIDATOR_HUB_ENABLED`, `GOVERNANCE_CONSOLE_ENABLED`.

## Success Metrics
- Validator review SLA ≤ 48h.
- <5% milestones flagged for missing evidence after first submission.
- Governance proposal quorum reached within 72h on 90% of proposals.
