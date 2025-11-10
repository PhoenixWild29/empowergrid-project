# EmpowerGrid 2.0 · Information Architecture & User Flows

_Last updated: 2025-11-08_

## 1. Global Navigation Framework

### 1.1 Top-Level Header (Web & Mobile)

| Zone | Elements | Notes |
| --- | --- | --- |
| Branding Bar | EmpowerGrid logomark → "Community-Powered Renewable Energy" tagline | Sticky on scroll, links to / |
| Primary Nav | Marketplace, Impact Dashboard, For Developers, Governance, Help | On mobile becomes slide-out drawer |
| Utility Area | Connect Wallet pill (stateful), Language selector, Notifications bell, Profile avatar menu | Wallet pill shows wallet avatar + quick actions when connected |

### 1.2 Authenticated Sidebar (Dashboard Context)

`
Home Overview
├── My Portfolio
├── Milestone Updates
├── Transactions
├── Impact Report
├── Settings & Security
└── Help & Support
`

Developer accounts see additional modules:
`
Developer Console
├── My Projects
├── Create Project Wizard
├── Verification Hub
└── Governance Actions
`

### 1.3 Footer Utilities

Terms of Use · Privacy · Transparency Reports (IPFS) · Carbon Accounting Methodology · API Docs · GitHub · Careers.

## 2. Primary Personas & Flows

| Persona | Goal | Entry Point |
| --- | --- | --- |
| Community Investor | Discover credible projects and track impact returns | Marketplace listing, shared project link |
| Project Developer | Launch & steward a renewable project | Developer onboarding CTA |
| Validator/Auditor | Verify milestone outcomes | Invitation email → Verification Hub |

## 3. Core User Journeys

### 3.1 Investor Journey

1. **Discovery**
   - Land on Marketplace (list/grid view).
   - Apply filters (Energy Type, Location, Risk Level, Funding Status, Impact Focus).
   - View cards with funding progress, ROI, impact metrics.
   - Optional: Save/Favourite projects (requires lightweight account).

2. **Due Diligence**
   - Open Project Detail page.
   - Review overview, team bios, impact stats, risk band.
   - Interact with Milestone Timeline (completed vs pending vs future).
   - Inspect Fund Status visualization (Raised · Locked · Disbursed).
   - Expand "Advanced Details" for blockchain data (contract address, auditor reports).

3. **Wallet Connection**
   - Click Invest → Wallet onboarding overlay.
   - Choose: Phantom, Solflare, Ledger, or Custodial support.
   - Guided security tips, explain fees.

4. **Investment Transaction**
   - Stepper modal: Amount → Review → Confirm.
   - Real-time fee estimation; fallback for off-ramp.
   - Post-confirmation: success state with receipt and share prompts.

5. **Portfolio Tracking**
   - Dashboard highlights total investment, returns, environmental impact.
   - Milestone feed via real-time notifications.
   - Access detailed breakdown per project, withdraw returns, set auto-invest.

### 3.2 Developer Journey

1. **Onboarding**
   - Choose "For Developers" → Onboarding wizard.
   - Complete KYB checks, link validator partners.

2. **Project Proposal Wizard**
   - 5-step wizard (Basics → Impact → Milestones → Team → Review).
   - AI-assisted milestone suggestions, validation of budgets.

3. **Milestone Definition**
   - Gantt-style builder, assign validators, attach verification criteria.
   - Automatic escrow allocation visualization.

4. **Fundraising Phase**
   - Campaign preview, share tools, monitor funding progress.
   - Engage with investor questions via community tab.

5. **Milestone Verification & Fund Release**
   - Upload evidence, trigger oracle feeds, request validator sign-off.
   - After approval, funds released to developer wallet with notifications.

### 3.3 Validator Journey (Secondary)

1. **Invitation Acceptance** → Wallet verification → Access Verification Hub.
2. **Milestone Queue** → Review evidence → Sign verification transaction.
3. **Audit Trail** → Generate reports, flag discrepancies.

## 4. Navigation-to-Flow Mapping

| Module | Key Screens | Supporting APIs/Services |
| --- | --- | --- |
| Marketplace | Listing, Filters, Saved Projects | Project Catalog API, Redis cache, ML Recommendations |
| Project Detail | Overview, Milestone Timeline, Fund Visualization | Project Detail API, Switchboard Oracle events |
| Portfolio Dashboard | Summary, Activity Feed, Impact Visuals | Portfolio API, WebSocket notifications |
| Developer Console | Proposal Wizard, Milestone Hub | Project CRUD API, IPFS uploads, Validation workflow |
| Governance | DAO Voting, Proposal History | Realms integration, On-chain vote status |
| Help Center | Knowledge base, Support tickets | CMS, Intercom integration |

## 5. Progressive Disclosure Strategy

- Default UI focuses on plain language (e.g., "Funds Locked" instead of "Escrow Balance").
- "Advanced" toggles reveal transaction hashes, smart contract metadata, risk analytics.
- Contextual tooltips link to explainers and documentation.

## 6. Accessibility & Localization Notes

- Navigation supports keyboard focus order and ARIA landmarks.
- All charts must include textual summaries.
- Prepare copy for multi-language support (starting with EN, ES, FR).

---

### Next Steps
1. Align stakeholders on IA with clickable prototype (Figma).
2. Begin component inventory mapping to design system.
3. Proceed to Section 2: Key Screen Design Specifications.
