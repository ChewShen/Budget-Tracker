# Changelog

All notable changes to the **Personal Budget & Wealth Tracker** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- [ ] Flexible savings accounts (add, rename or remove accounts; per-account rate and liquid/locked type).
- [ ] Configure custom domain (optional).

---

## [0.10.0] - 2026-09-28

### Added
- **Month-end forecast**: "On pace for RM X by 30 Sep" under the month total, from everyday spending so far plus bills still to come.
- **Compared with usual**: Each category shows how it compares with its average over up to 3 earlier months (pro-rated to today for the current month).
- **Monthly spending trend**: Up to 6 months with an average line; the current month shows its forecast; tap a bar to open that month.
- **Insights**: Up to three plain-English highlights, such as tags above or below usual, no-spend days and weekend-heavy spending.
- **Fixed vs flexible**: The month split into everyday spending, bills and one-offs.
- **Spending calendar**: Days shaded by how much they cost; tap a day for its total.
- **Year to date**: Spent, saved, savings rate and average per month for the year so far.
- **Export menu**: This month, all expenses, savings balances, or a full JSON backup; the Transactions page exports exactly what's shown.

### Fixed
- CSV exports quote fields properly (notes with commas or quotes no longer break columns), open in Excel with the right encoding, and no longer get cut off at a "#".
- Text in exports that a spreadsheet would run as a formula is neutralised.

---

## [0.9.0] - 2026-09-28

### Added
- **Automatic bills**: Switch on "Add automatically" for a bill with an expected amount and due day, and its expense is added on the due day each month (noted "Auto-added monthly bill"), unless you've already logged it.
- Overview shows automatic bills as "Auto on <date>" and counts them separately; Settings marks them with an Auto badge.

### Database
- New migration `scripts/migrations/2026-09-28_auto_bills.sql` (run once in Supabase, needs the `pg_cron` extension): adds the per-bill switch, the `auto_log_bills()` function and a daily job at 00:05 Malaysia time.

---

## [0.8.0] - 2026-09-28

### Added
- **Editable monthly bills** (Settings → Monthly bills): choose which tags are monthly bills, with an optional expected amount and due day.
- **Bill due status** on Overview: Overdue, Due in N days, Due on a date, Missing or Logged, with an overdue count.

### Changed
- Bills are linked to the tag rather than its name, so renaming a tag keeps its bill.
- "Log unpaid bills" uses the expected amount on the due day when set, otherwise last month's payment.

### Fixed
- Renaming an imported category no longer resets its icon.
- Dates always use the same month format ("Sep", not sometimes "Sept").

### Database
- New migration `scripts/migrations/2026-09-28_monthly_bills.sql` (run once in Supabase): adds expected amount and due day to `recurring_sentinel`, one row per bill, and carries over the 8 existing bills.

---

## [0.7.0] - 2026-09-28

### Added
- **Categories & tags in Settings**: Add categories with an icon, add tags, rename either, and delete ones no expense uses. Items in use show how many expenses use them and can only be renamed.
- **"+ New tag" in Add expense**: Create a tag without leaving the sheet; it is selected straight away.

### Changed
- Categories are listed alphabetically.

### Database
- New migration `scripts/migrations/2026-09-28_manage_categories_tags.sql` (run once in Supabase): adds `categories.icon` and lets the signed-in owner add, rename and delete categories and tags.

---

## [0.6.1] - 2026-09-28

### Added
- **CI**: GitHub Actions workflow runs type-check, lint and the Excel formula parity test (`npm test`) on pull requests to `dev` and `main`.

### Changed
- Linting uses the ESLint CLI with a flat config (`eslint.config.mjs`), replacing the deprecated `next lint`.
- Release docs now match the real CI, tagging (normal vs folded releases) and backup options.

### Security
- Updated Next.js to 15.5.26 and forced its bundled PostCSS to 8.5.x, resolving the high-severity PostCSS advisories (`npm audit`: 0 vulnerabilities).

---

## [0.6.0] - 2026-09-28

### Added
- **Monthly savings check**: Compares how much liquid money grew with what you saved from salary, and explains the untracked difference (unlogged spending or income). Shown only for back-to-back recorded months.
- **Net worth over time**: Bar chart of recorded months; tapping a bar opens that month.
- **Update balances sheet**: Pre-filled from the latest earlier month (balances and interest rates), with the earlier value shown under each field and a live net worth total.

### Changed
- Balances are labelled as month-end ("Net worth on 30 Sep 2026"), with each account's share of the total.
- Months with no balances (including the all-zero rows from the Excel import) show "Not recorded yet" instead of RM 0.00; future months can't be recorded.

### Fixed
- Balance fields can be cleared and typed normally (no more snapping to 0 or "05"); non-numeric input is rejected.
- Closing the balances sheet with unsaved changes asks before discarding them.

---

## [0.5.0] - 2026-09-28

### Added
- **Edit expenses**: Tap any transaction to open it in the add sheet, pre-filled. Save changes updates it in place; Delete removes it with the 5-second Undo. Failed edits roll back with a Retry toast.
- **App icons**: Home-screen icons for iOS (`apple-icon.png`) and Android/manifest (192px, 512px, maskable), plus a browser favicon.

### Fixed
- The add sheet now always opens empty, so an amount or note typed earlier can't carry over into a new expense.

---

## [0.4.0] - 2026-09-28

### Added
- **Authentication**: Email + password sign-in at `/login` (no public sign-up), middleware redirect for signed-out visitors, and a sign-out button.
- **Owner-only database access**: `scripts/secure_rls.sql` assigns existing rows to the owner, defaults `user_id` to `auth.uid()`, and replaces every policy with owner-only RLS (including `recurring_sentinel`).
- **Editable salary**: Gross salary, EPF %, SOCSO and EIS can be edited from the Cash flow card and are stored in `user_profiles`.
- **Undo delete**: Deleting a transaction shows an Undo toast for 5 seconds before it reaches the database.
- **Faster entry**: Time-of-day meal tag default, Recent shortcuts (tag + last amount), keyboard amount entry on desktop, and one-tap logging of missing monthly bills with last month's amounts.
- **Light/dark theme toggle**, with dark as the default.
- **Settings page** (`/settings`): choose whether Add expense starts on today's date or the last entry's date (saved per device). Sign out moved here from the top bar.

### Changed
- **Refined dark redesign**: Neutral near-black surfaces with lime as an accent fill only, Inter font, spend hero with daily bar chart and month-over-month change, ranked category and tag lists (replacing the donut chart), transactions grouped by day, net worth hero on Savings, floating mobile nav and bottom-sheet quick add.
- The app opens on the current month instead of a fixed month.
- Data loads only after sign-in; the localStorage cache is used only in local-only mode (no Supabase configured).
- On mouse/trackpad devices, chip rows (Recent, categories, filters) wrap instead of scrolling sideways; touchscreens keep swipeable rows.

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
