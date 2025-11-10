# Developer Wizard Enhancements

## Objectives
- Reduce abandonment by guiding developers through each decision with validation, helper copy, and inline previews.
- Ensure milestones and budgets are audit-ready before submission.
- Capture the additional metadata needed downstream (evidence, due dates, energy specs).

## Workflow Overview
1. **Project Blueprint** (details)
   - Title, impact statement, category, tags, geographic metadata
   - Real-time character counters & validation copy
2. **Energy Profile**
   - Capacity slider, energy mix presets, certifications
   - Side panel explains recommended ranges per asset type
3. **Funding Strategy**
   - Toggle between SOL / USDC targets
   - Dynamic ROI hints, duration helper, warning when outside policy ranges
4. **Milestone Builder**
   - Auto-distribute budgets, but allow manual override
   - For each milestone: name, due date, success criteria, evidence requirements, payout amount
   - Validation that sums match target and dates are chronological
5. **Review & Submit**
   - Collapsible sections with completeness indicators
   - Download JSON draft / copy to clipboard

## Key UX Patterns
- Sticky guidance column with contextual tips and policy links
- Inline warnings (non-blocking) vs blocking errors (highlighted red)
- Auto-save draft to localStorage every 2 seconds after change
- “Test milestone plan” button simulates payouts using current distribution

## Validation Rules
- Title ≥ 10 chars, description ≥ 150 chars
- Target amount min/max configurable via env (default 1k–10M USD equivalent)
- Milestones 1–10; sum of milestone payouts = target
- Each milestone needs due date ≥ today + 7d, verification criteria ≥ 25 chars

## Technical Notes
- Draft stored as JSON in `localStorage(project_draft)`
- Budget distribution via utility `distributeMilestoneBudgets(total, count)`
- Env overrides:
  - `WIZARD_MIN_TARGET_USD`
  - `WIZARD_MAX_TARGET_USD`
  - `WIZARD_MIN_DURATION_DAYS`
  - `WIZARD_MAX_DURATION_DAYS`

## Future Ideas
- Invite validator for pre-review
- Upload evidence templates (PDF)
- Real-time currency conversion (pulling from Switchboard oracle)
