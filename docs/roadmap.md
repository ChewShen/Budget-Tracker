# Roadmap & Idea Backlog

Ideas discussed but not built yet, so they aren't lost. Roughly most useful first within each group.
When one is picked up, move it to `docs/changelog.md` under the version that ships it.

---

## Next up (agreed order, as of v0.21.0)

1. **Automated tests in CI.** Make the throwaway checks used so far permanent, so every PR runs them:
   - **Database (PGlite):** replay every migration in `scripts/migrations/` in order on a real Postgres with a stand-in `auth` schema; check each person sees and changes only their own rows (categories/tags, expenses, bills, budgets, goals, savings, tokens, Inbox, rules), and that references to another person's tag/category/goal are refused. Include the migrations' own checks (e.g. savings before/after, auto-add skipping plans outside their months).
   - **Parsing (`src/lib/ingest.ts`):** TnG history receipts and success screens in both reading orders (placeholder names, never real ones), transfers, banner-hidden amounts, payment time vs the status-bar clock, merchant keys and rules.
   - **Endpoint (`/api/ingest`):** tokens (missing, revoked, cut short, header forms), double-taps and repeats, the 500-item cap, notification messages.
   - **Logic:** forecast and budgets (`analytics.ts`, `budgets.ts`), instalments (`instalments.ts`), reminders (`reminders.ts`), savings snapshots and legacy conversion (`savings.ts`), the "Same as last entry" date rule.
   - Later: Playwright browser tests of the main flows (add expense, Inbox confirm, record balances).
2. **Manage merchant rules** (Settings → Automation): list what the Inbox has learned (e.g. MENG → Lunch, TEALIVE → Coffee), change a rule's tag, delete a rule. Today a wrong rule can only be fixed in the database.
3. **Other income:** log bonuses, side income, refunds and money received, so the savings rate and the untracked-cash check stay right (only the fixed salary counts today). Transfers *in* could later arrive through the Inbox.
4. **Bank alerts by email:** forward Maybank/CIMB card and DuitNow alert emails to a private address (needs an email-receiving service, e.g. Cloudflare Email Routing → a worker → `/api/ingest`), so card and online spending the TnG double-tap misses lands in the Inbox too.

---

## Savings analytics

- **12-month projection**: "At your average saving of RM X/month plus interest, you'd have about RM Y by <month next year>". State the assumptions; only show with at least 2 recorded months.
- **Interest summary**: Estimated interest earned so far this year, and a nudge when money is sitting at 0% (e.g. "RM 500 in checking would earn about RM 17.75/year in GXBank at 3.55%").
- **Untracked cash history**: The monthly "untracked" amount over time, to see whether unlogged spending is a pattern or a one-off.
- **Reorder savings accounts**: Accounts are listed in the order they were added; let them be moved up and down in Settings → Savings accounts.

## Budgeting

- **Salary history**: Salary changes apply to all months today; keep a dated history so past savings rates stay correct.

## Faster entry

- **Offline adding**: Service worker + queue so the installed app opens without signal and syncs expenses later.
- **Duplicate warning**: Ask before saving the same tag, amount and date twice within a minute.
- **Tune TnG parsing** with real TnG success screens and notifications (the Inbox's "original" text shows what was read).
- **Bank statement CSV import**: Match against logged expenses and suggest anything missing.
- **Rename from the bill form**: A "Rename" field in Settings → Monthly bills that renames the underlying tag.

## Robustness

- **Recharts v3**: v2 is deprecated.

## Data housekeeping

- **Keep real data out of git**: `*.xlsm`, `*.xlsx`, `scripts/seed_data.sql` and `private/` are gitignored, and local git hooks (pre-commit, commit-msg, pre-push, using a gitignored list in `private/guard/`) block commits and pushes containing real personal data. Hooks live only in `.git/hooks`: when cloning elsewhere, copy `private/` and reinstall them. The earlier private repository (with the original, unscrubbed history) is archived and no longer used.

- Check August 2026 balances from the Excel import (Main checking RM 0, EPF RM 10 look wrong).
- Once the new savings accounts look right, `monthly_savings` (kept as a backup by `2026-09-30_savings_accounts.sql`) can be dropped.

## Later, bigger

- **Local-first native app** (discussed, not started): an Expo (React Native) app with the data in SQLite on the phone, so nothing is readable by whoever runs the server, it works offline, and reminders become on-device notifications (no VAPID, cron or service-role key). The pure logic in `src/lib/` carries over as is; the screens and the data layer would be rewritten. Optional end-to-end encrypted sync later for multiple devices (PowerSync / ElectricSQL or encrypted backups). First step whenever it's picked up: put the data layer behind an interface (load, save expense, save balances…) with Supabase and local storage as two implementations.
- **Optional end-to-end encryption** for accounts that want privacy from the database owner, accepting that server features (nightly reminders, auto-add) wouldn't work for them.
