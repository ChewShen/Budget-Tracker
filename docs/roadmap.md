# Roadmap & Idea Backlog

Ideas discussed but not built yet, so they aren't lost. Roughly most useful first within each group.
When one is picked up, move it to `docs/changelog.md` under the version that ships it.

---

## Savings analytics

- **12-month projection**: "At your average saving of RM X/month plus interest, you'd have about RM Y by <month next year>". State the assumptions; only show with at least 2 recorded months.
- **Interest summary**: Estimated interest earned so far this year, and a nudge when money is sitting at 0% (e.g. "RM 500 in checking would earn about RM 17.75/year in GXBank at 3.55%").
- **Untracked cash history**: The monthly "untracked" amount over time, to see whether unlogged spending is a pattern or a one-off.
- **Reorder savings accounts**: Accounts are listed in the order they were added; let them be moved up and down in Settings → Savings accounts.

## Budgeting

- **Other income**: Log bonuses and side income so the savings rate and untracked-cash check stay accurate (today only the fixed salary counts).
- **Salary history**: Salary changes apply to all months today; keep a dated history so past savings rates stay correct.

## Faster entry

- **Offline adding**: Service worker + queue so the installed app opens without signal and syncs expenses later.
- **Duplicate warning**: Ask before saving the same tag, amount and date twice within a minute.
- **Apple Pay auto-logging**: iPhone Shortcuts automation posting to an API endpoint (needs a secret key per user).
- **Bank statement CSV import**: Match against logged expenses and suggest anything missing.
- **Rename from the bill form**: A "Rename" field in Settings → Monthly bills that renames the underlying tag.

## Robustness

- **Automated tests**: Turn the ad-hoc browser checks into Playwright tests in CI, and add unit tests for `src/lib/analytics.ts`, `savings.ts` and `bills.ts`.
- **Recharts v3**: v2 is deprecated.

## Data housekeeping

- **Keep real data out of git**: `*.xlsm`, `*.xlsx`, `scripts/seed_data.sql` and `private/` are gitignored, and local git hooks (pre-commit, commit-msg, pre-push, using a gitignored list in `private/guard/`) block commits and pushes containing real personal data. Hooks live only in `.git/hooks`: when cloning elsewhere, copy `private/` and reinstall them. The earlier private repository (with the original, unscrubbed history) is archived and no longer used.

- Check August 2026 balances from the Excel import (Main checking RM 0, EPF RM 10 look wrong).
- Optionally delete the all-zero savings rows the import created for Sep–Dec 2026 (the app already treats them as "not recorded").
