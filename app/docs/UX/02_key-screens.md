# EmpowerGrid 2.0 · Key Screen Specifications

_Last updated: 2025-11-08_

## Overview
This document defines the UX intent, core components, and functional requirements for the primary screens described in Section 1. Each screen should map directly to reusable design-system components and will inform both Figma mockups and implementation tickets.

---

## 1. Project Marketplace (Discovery)

### 1.1 Objectives
- Inspire new investors with clear, impact-led storytelling.
- Provide powerful yet approachable filtering to match projects to user values.
- Support quick, low-friction comparison across projects (ROI + impact + milestone health).

### 1.2 Layout Blueprint (Desktop)
`
┌────────────────────────────────────────────────────────────────────┐
│ Hero Banner: "Invest in Community Energy" – CTA: Explore Projects │
├────────────────────────────────────────────────────────────────────┤
│ [Filter Bar]                                                       │
│ Search | Energy Type ▾ | Location ▾ | Risk ▾ | Funding Status ▾   │
│ Impact Focus ▾ | Sort: Trending ▾                                 │
├────────────────────────────────────────────────────────────────────┤
│ [Recommendation Carousel] – personalized picks (optional)         │
├────────────────────────────────────────────────────────────────────┤
│ [Projects Grid – 3 columns desktop / 1 column mobile]             │
│ Card consists of:                                                  │
│   • Hero image/video thumbnail                                     │
│   • Funding badge (e.g., 72% funded, 18 days left)                 │
│   • Project title + location + tags                                │
│   • KPI summary row: ROI/APY · Risk level · Impact metric          │
│   • Dual progress bars: Funding progress & Milestone completion    │
│   • Validator badge (audited by …) + social proof (investor count) │
│   • Primary CTA: View Project · Secondary: Follow ♥                │
└────────────────────────────────────────────────────────────────────┘
`

### 1.3 Functional Notes
- **Filters** persist via query params; mobile uses bottom drawer.
- **Personalized recommendations** use TensorFlow.js; surface after initial user activity.
- **Hover states** show mini milestone timeline preview.
- **Empty state** (no matches): “Try broadening filters” + curated picks.

---

## 2. Project Detail Page (Pitch & Conversion)

### 2.1 Objectives
- Build trust through transparency: highlight team credibility, impact metrics, verification partners.
- Make milestone escrow mechanics tangible via visual timeline.
- Convert visitors by framing both financial + environmental ROI.

### 2.2 Layout Blueprint (Desktop)
`
┌───────────────────────────────────────────────────────────────┐
│ Hero Media (image/video) with overlay metrics:                 │
│   • Funding progress circle                                    │
│   • CTA button: Invest Now                                     │
│   • Impact badges (CO₂ offset, households powered)             │
├───────────────────────────────────────────────────────────────┤
│ Left Column (60% width)           │ Right Column (40% width)   │
│ -------------------------------- │ -------------------------- │
│ Tabs: Overview / Team / Impact   │ Investment Module:          │
│ • Project Summary                 │ - Amount input + ROI calc   │
│ • Community Benefits              │ - Fee breakdown             │
│ • FAQs / Updates                  │ - Security badges           │
│                                   │ Fund Status Visualization:  │
│ Milestone Timeline (interactive)  │ - Donut chart (Raised/      │
│ • Nodes for each milestone        │   Locked/Disbursed/Pending) │
│ • Expand for details & docs       │ Validator & Auditor cards   │
│                                   │ Escrow Terms summary        │
│ Impact Analytics                  │ CTA: Download pitch deck    │
│ • Charts (kWh, CO₂ offsets, SDG)  │ Secondary actions: Share,   │
│                                   │ Save, Report                │
└───────────────────────────────────────────────────────────────┘
`

### 2.3 Interaction Notes
- Milestone nodes animate to indicate current phase; clicking reveals verification evidence (photo galleries, reports, sensor charts).
- Investment module calculates expected returns and impact credits dynamically.
- Disclosure drawer: transaction hash, smart contract address, audit logs.
- Community updates area with rich media, validator comments.

---

## 3. Investor Portfolio Dashboard

### 3.1 Objectives
- Deliver at-a-glance understanding of financial + impact performance.
- Encourage continued engagement (auto-invest, referral, governance participation).
- Provide real-time milestone notifications and transaction clarity.

### 3.2 Layout Blueprint
`
┌────────────────────────────────────────────────────────────┐
│ Header: “Welcome back, [Name]”                             │
│ KPI tiles: Total Invested | Est. Returns | CO₂ offset |    │
│   Households powered                                       │
├────────────────────────────────────────────────────────────┤
│ Impact Visualization: dual-axis chart (kWh vs CO₂ saved)   │
├────────────────────────────────────────────────────────────┤
│ Milestone Feed (real-time, Socket.io)                      │
│ • Project X Milestone 3 verified ✅ (details)               │
│ • Project Y Milestone delayed ⚠️ (take action)             │
├────────────────────────────────────────────────────────────┤
│ Portfolio Table                                            │
│ Project | Invested | Status | Next Milestone | Escrow | ROI │
│ Inline actions: View Detail, Withdraw, Increase investment  │
├────────────────────────────────────────────────────────────┤
│ Transactions Drawer                                        │
│ • List with status tags (Pending/Succeeded/Failed)         │
│ • Each has simple description + advanced details button    │
└────────────────────────────────────────────────────────────┘
`

### 3.3 Functional Notes
- Socket notifications update tiles instantly (avoid manual refresh).
- Users can toggle “Monetary” vs “Impact” views (persist via settings).
- Export impact report (PDF) with summary for tax/incentive purposes.

---

## 4. Project Creation Wizard (Developer View)

### 4.1 Objectives
- Demystify complex escrow/milestone setup.
- Ensure budgets, timelines, validators meet platform guidelines.
- Provide real-time validation and educational tips.

### 4.2 Step Breakdown & UI Elements
1. **Project Basics**
   - Form grid with inline validation.
   - Checklist side panel (“What information do investors expect?”).

2. **Impact & Community**
   - Impact metric fields (kWh/year, CO₂ offset) with calculators.
   - Narrative prompts with examples; attach evidence (IPFS upload progress bars).

3. **Milestones & Budgets**
   - Timeline builder (drag/drop).
   - Milestone cards: title, description, target date, funds, validator, verification criteria.
   - Escrow visualization bar warns if allocations exceed totals.

4. **Team & Validators**
   - Add team members with bios, LinkedIn, past projects.
   - Assign validator(s) from marketplace or request new.
   - Show validator response time SLAs.

5. **Review & Submit**
   - Read-only summary with edit shortcuts.
   - Self-audit checklist + compliance acknowledgment.
   - Submit button triggers review workflow.

### 4.3 Additional Considerations
- Auto-save drafts (localStorage + backend). Show last saved timestamp.
- Collaborative mode (invite teammates via email, real-time presence indicators).
- Post-submission tracking: status badge (Under review → Approved → Live).

---

## 5. Secondary Screens (Brief)
- **Milestone Verification Hub (Validators):** queue list, evidence viewer, approve/reject actions, audit logs export.
- **Impact Dashboard (Public):** aggregated CO₂ offsets, communities served, live map of projects.
- **Governance Portal:** proposal list, voting interface, results timeline.
- **Help Center:** searchable knowledge base, chatbot integration, ticket submission.

---

## 6. Component & Design System Alignment
- Create Figma component set for cards, tables, timelines, wizards, notification toasts.
- Document states (default, hover, active, disabled, empty).
- Ensure color usage follows Section 4 palette guidelines.

---

### Next Steps
1. Convert layouts into high-fidelity wireframes (Figma) referencing this spec.
2. Define responsive breakpoints and component variants.
3. Align with engineering on data contracts for each screen (GraphQL/REST schemas).
4. Proceed to Section 3 (Web3 UX Best Practices implementation notes).
