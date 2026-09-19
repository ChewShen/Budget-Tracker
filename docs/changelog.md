# Changelog

All notable changes to the **Personal Budget & Wealth Tracker** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- [ ] Initialize Next.js 15 project structure with Tailwind CSS and shadcn/ui.
- [ ] Implement Supabase client and apply initial PostgreSQL schema.
- [ ] Create Python migration script to import historical transactions from `Monthly Budget.xlsm`.
- [ ] Mobile Quick-Add modal with tactile numpad and cascading tag picker.
- [ ] Interactive Month Cockpit with KPI summary cards.
- [ ] Salary & Malaysian Statutory Deductions engine (EPF, SOCSO, EIS).
- [ ] Digital bank daily compounded interest calculator (GXBank, Rize/RYT Bank).
- [ ] Recurring Bills Sentinel (tracking status: `Logged` vs `MISSING`).
- [ ] PWA service worker and manifest for native mobile installation.

---

## [0.1.0] - 2026-09-19

### Added
- Comprehensive architectural blueprint and migration specification from Excel (`.xlsm`) to Next.js + Supabase.
- Full PostgreSQL database schema definition with Row-Level Security (RLS) policies.
- Detailed engineering `README.md` with system design, mathematical formulas, and setup guide.
- Release engineering governance documents:
  - `changelog.md` (Changelog tracking standard)
  - `version-bump.md` (SemVer bumping protocol)
  - `release-flow.md` (Branching, CI/CD, and deployment lifecycle)

### Changed
- Transitioned architecture evaluation from a traditional container model (Render) to a true perpetual free-tier Serverless pattern (Vercel Edge + Supabase PostgreSQL).

### Verified
- Completed deep read-only inspection of source `Monthly Budget.xlsm`:
  - Validated 172 transactions spanning 2026-08-01 to 2026-09-19.
  - Verified digital bank compounding interest formulas (`DAY(EOMONTH(...))`).
  - Audited timeline slicer VBA macro logic (`Worksheet_PivotTableUpdate`).
  - Confirmed $100\%$ data integrity with zero modifications to source files.
