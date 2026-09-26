# Changelog

All notable changes to the **Personal Budget & Wealth Tracker** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- [ ] Trigger Vercel deployment of v0.4.0.
- [ ] Add PWA icons (`public/icon-192.png`, `public/icon-512.png`) referenced by the manifest.
- [ ] Configure custom domain (optional) and install PWA on mobile device.

---

## [0.4.0] - 2026-09-26

### Added
- **Authentication**: Email + password sign-in at `/login` (no public sign-up), middleware redirect for signed-out visitors, and a sign-out button.
- **Owner-only database access**: `scripts/secure_rls.sql` assigns existing rows to the owner, defaults `user_id` to `auth.uid()`, and replaces every policy with owner-only RLS (including `recurring_sentinel`).
- **Editable salary**: Gross salary, EPF %, SOCSO and EIS can be edited from the Cash flow card and are stored in `user_profiles`.
- **Undo delete**: Deleting a transaction shows an Undo toast for 5 seconds before it reaches the database.
- **Faster entry**: Time-of-day meal tag default, Recent shortcuts (tag + last amount), keyboard amount entry on desktop, and one-tap logging of missing monthly bills with last month's amounts.
- **Light/dark theme toggle**, with dark as the default.

### Changed
- **Refined dark redesign**: Neutral near-black surfaces with lime as an accent fill only, Inter font, spend hero with daily bar chart and month-over-month change, ranked category and tag lists (replacing the donut chart), transactions grouped by day, net worth hero on Savings, floating mobile nav and bottom-sheet quick add.
- The app opens on the current month instead of a fixed month.
- Data loads only after sign-in; the localStorage cache is used only in local-only mode (no Supabase configured).

### Fixed
- Failed saves no longer fail silently: the optimistic row is rolled back and a Retry toast is shown.
- Saving account balances no longer creates duplicate `monthly_savings` rows.
- Lime text was unreadable on light backgrounds, and `dark:` styles never applied, mixing light and dark colours.

### Security
- Previously all transactions and savings were readable and writable by anyone holding the public anon key. After running `secure_rls.sql`, anonymous requests return no rows and writes are rejected.

---

## [0.3.0] - 2026-09-20

### Added
- **Fintech Brand Redesign**: Redesigned app aesthetic to electric **Lime Spark (`#B6FF2E`)** and deep **Graphite (`#23262F`)** with high-contrast typography, neon chart highlights, and updated mobile PWA theme bars.
- **Architectural Layout Refactor**: Decoupled `layout.tsx` into a proper Server Component using Next.js 15 `metadata` and `viewport` exports, moving client state into `src/components/app-shell.tsx`.
- **Database & RLS Hardening**: Relaxed initial migration constraints on `user_id` and `recurring_sentinel`, and documented strict privacy policies for authenticated user data isolation.

### Fixed
- Resolved `ENOENT` page data collection error during Next.js build by separating client-side state from server-rendered root layout.

---

## [0.2.0] - 2026-09-20

### Added
- **Next.js 15 Web Application**: Scaffolded with TypeScript, Tailwind CSS, App Router, Lucide icons, and Recharts.
- **Mobile Fast-Entry (<5s)**: Created `QuickAddModal` with tactile numpad, category selector, cascading tag chips, and "One-off?" toggle.
- **Interactive Monthly Cockpit**:
  - `MonthSelector` component replacing Excel Timeline Slicers.
  - `KpiCards` (Total Spend, Food & Dining, Daily Average excluding one-offs, Peak Expense spotlight).
  - `CategoryChart` (Donut chart) & `TagsBarChart` (Horizontal bar chart).
  - `SalaryEngine` (Malaysian EPF 11%, SOCSO, EIS, Net Take-home, Net Cash Saved, Savings Rate progress bar).
  - `RecurringSentinel` (Automated checklist tracking Netflix, iCloud, Cuckoo, Water, Electric, Season Parking).
- **Full Transaction Ledger**: `LedgerTable` component with instant search, category filtering, and delete actions.
- **Savings & Asset Management**:
  - `SavingsPage` tracking Main Checking, GXBank, Rize/RYT Bank, and EPF locked balances.
  - Automated daily compounding interest calculator based on calendar month days.
- **Excel Ingestion & Data Seeding**:
  - Extracted 10 categories, 31 tags, 172 transactions, and 5 monthly savings snapshots from `Monthly Budget.xlsm`.
  - Generated `scripts/seed_data.sql` for instant Supabase SQL Editor execution.
  - Generated `src/lib/mock-data.ts` and `src/lib/budget-context.tsx` with offline LocalStorage persistence and Supabase sync.
- **Formula Verification Suite**: Added `scripts/test_formulas.mjs` validating salary deductions and GXBank interest against Excel ground truth.

---

## [0.1.0] - 2026-09-19

### Added
- Comprehensive architectural blueprint and migration specification from Excel (`.xlsm`) to Next.js + Supabase.
- Full PostgreSQL database schema definition with Row-Level Security (RLS) policies.
- Detailed engineering `README.md` with system design, mathematical formulas, and setup guide.
- Release engineering governance documents (`changelog.md`, `version-bump.md`, `release-flow.md`).
