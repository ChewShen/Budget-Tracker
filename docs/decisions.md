# Design Decisions

Why the app is built the way it is: the tools, the architecture and the trade-offs behind each feature.
Each entry covers what was chosen, why, and what it costs. For what changed and when, see [`changelog.md`](changelog.md); for ideas not built yet, see [`roadmap.md`](roadmap.md).

---

## 1. Platform & stack

### Web app installed as a PWA, not a native app
- **Why:** One codebase runs on iPhone, Android and desktop. "Add to Home Screen" gives a full-screen app icon without App Store or Play Store accounts, reviews or fees. Updates ship the moment Vercel deploys.
- **Trade-off:** Some iOS features are limited for web apps. Push notifications only work from the Home Screen app (iOS 16.4+), and the layout has to handle the notch and status bar itself (`viewportFit: "cover"`, safe-area padding, `statusBarStyle: "black"`).

### Next.js 15 (App Router) + React 19 + TypeScript
- **Why:** Next.js covers the pages and the small amount of server code the app needs (the reminder API routes and the login middleware) in one project, and Vercel hosts it with no configuration. TypeScript catches data-shape mistakes early, which matters when the same records come from Supabase, localStorage or generated demo data.
- **Trade-off:** Most pages are client components, because the data lives in one client-side store (see [Data layer](#2-data)). Server rendering is barely used, which is fine for a personal app behind a login.

### Tailwind CSS with design tokens
- **Why:** Colours are HSL tokens in `globals.css` (`--primary`, `--danger`, …), so the dark theme (default) and the light theme are the same classes with different values. Lime is an accent fill only; lime-ish text uses `text-highlight`, which is darkened in light mode so it stays readable.
- **Also:** A custom `pointer-fine` variant tells mouse from touch: scroll arrows and hover states for desktop, swipe for phones.

### Recharts, date-fns, lucide-react
- **Recharts** for the trend and savings charts, because it's declarative React and good enough for a handful of charts. Simple visuals (category bars, the spending calendar) are plain HTML/CSS, which is lighter and more accessible. Recharts v2 is deprecated; the upgrade is on the roadmap.
- **date-fns** for month maths (days in month, due dates clamped to the month's end, "3 days to expiry"). It's tree-shakeable and works on plain `Date`s.
- **lucide-react** for icons: consistent stroke style, and only the icons used get bundled. Category icons are stored as keys (`categories.icon`) so they survive renames.

### Supabase (Postgres + Auth)
- **Why:** A real relational database with auth, row-level security and scheduled jobs (`pg_cron`) on a free tier, with no backend server to maintain. The spreadsheet this app replaced was already relational (transactions → categories → tags).
- **Trade-off:** Security depends on RLS policies being right (see [Security](#3-security--privacy)), and schema changes are hand-written SQL migrations run in the SQL Editor.

### Vercel hosting
- **Why:** Deploys on every push to `main` with preview builds for PRs, runs the API routes, and provides the daily cron for reminders. All on the free tier.
- **Trade-off:** On the free plan the cron can run up to about an hour late, so reminders say "around 8pm".

---

## 2. Data

### One client-side store with optimistic updates (`src/lib/budget-context.tsx`)
- **Why:** One person's data is small (thousands of rows), so the app loads it all once and every page computes from memory. Adding, editing and deleting update the screen immediately, then save in the background. If a save fails, the change rolls back and the toast offers **Retry**. Deletes have a 5-second **Undo**.
- **Trade-off:** The context file is large, and it would need paging or server-side queries if the data grew a lot.

### Three data modes: cloud, local, guest
- **Cloud:** Supabase configured and signed in. The real app.
- **Local:** Supabase not configured (placeholder `.env.local`). Data is kept in `localStorage`, so the app can be developed and demoed without a database.
- **Guest:** "Continue without an account" on the login page. Generated demo data in memory only: no database requests and nothing in `localStorage`, so a refresh starts fresh. RLS would block a guest anyway; guest mode just avoids the requests.
- **Why:** A portfolio visitor can try the full app without an account, and nothing they do can touch real data.

### Demo data is generated, not real
- **Why:** `src/lib/mock-data.ts` generates plausible months of spending relative to today from a seeded random generator, so the demo always looks current and is the same on every load. Real figures were removed from the codebase and from git history (see [Privacy](#real-data-never-in-the-repo)).

### Migrations as dated, re-runnable SQL files
- **Why:** `scripts/migrations/YYYY-MM-DD_name.sql`, run once in the Supabase SQL Editor in date order. Every file uses `IF NOT EXISTS` / `DROP … IF EXISTS`, so running one twice is harmless, and each ends with a check query that shows it worked.
- **Missing tables are tolerated:** Optional features (bills, goals, budgets, reminders) keep the rest of the app working if their migration hasn't been run yet, and the error message names the file to run.
- **Trade-off:** No migration tool tracks what has run. For one database, maintained by one person, this is simpler than setting up a migration CLI.

### Categories and tags are data, not code, and per account
- **Why:** They started hard-coded from the spreadsheet. They now live in tables that can be edited in Settings, and renaming keeps every past expense linked, because expenses reference ids, not names.
- **Per account:** With one user they were shared lookup tables. Once friends could have accounts, sharing meant anyone could rename or delete everyone's categories, so each account now owns its own (names unique per account). New accounts get a default set from a database trigger, so they can log an expense straight away.
- **References are checked, not just rows:** RLS also checks that an expense, bill or budget points at the account's *own* category and tag, so ids from another account can't be used even if known.
- **Known gap:** A few features still match by name (the "Food" card, meal-time tag defaults). Moving those to ids is on the roadmap.

---

## 3. Security & privacy

### Email + password sign-in, no public sign-up
- **Why:** Magic-link (email OTP) sign-in needed a custom SMTP server to be reliable. Email + password works on Supabase's defaults.
- **Accounts are added by hand:** Public sign-up stays off, because the site is public as a portfolio and anyone could otherwise create accounts on the free-tier database. Friends are added in the Supabase dashboard with a temporary password (Supabase's built-in email only reaches the project team, so invite emails wouldn't arrive) and change it in Settings → Account.

### Row-Level Security on every table
- **Why:** The anon key is public: it's in the JavaScript bundle by design. What keeps other people out is RLS. Every table has an owner-only policy (`user_id = auth.uid()`), and `user_id` defaults to `auth.uid()`, so the app never sends it.
- **Middleware is only a convenience:** it redirects signed-out visitors to `/login`, but the data is protected by RLS, not by the redirect. API routes skip the redirect and check auth themselves.

### Real data never in the repo
- **Why:** The repository is public as a portfolio piece. Real finances were in the history of an earlier repository, so the public repo was rebuilt with a scrubbed history (`git filter-repo`), and the old one was made private and retired.
- **Guards:** The Excel file, seed SQL and `private/` are gitignored. Local git hooks (pre-commit, commit-msg, pre-push) block commits and pushes that contain markers of real data. The hooks live in `.git/hooks` and aren't committed, so they have to be reinstalled on a new clone.

### Server secrets stay server-side
- `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS), `VAPID_PRIVATE_KEY` and `CRON_SECRET` are only read in `src/lib/push-server.ts` and the API routes, and are never `NEXT_PUBLIC_`. Because the service role bypasses RLS, every query in the reminder job filters by `user_id` explicitly.

---

## 4. Features

### Salary and interest maths match the spreadsheet
- **Why:** The app replaced an Excel workbook, so EPF/SOCSO/EIS deductions and daily-compounded interest must give the same numbers. `npm test` (`scripts/test_formulas.mjs`) checks them against the Excel results, and CI runs it on every PR.

### Month-end forecast: stretch only everyday spending
- **Why:** A naive "spent so far ÷ days × month" makes the 1st of the month look terrible after rent. Bills and one-off purchases count once as they are, plus bills still to come. Only everyday spending is projected forward. The Budgets card uses the same rule (`src/lib/budgets.ts`).

### Monthly bills are tags
- **Why:** A bill (Netflix, electricity) is already a tag on its expenses, so a bill is just "this tag, monthly, with an optional amount and due day". Whether it's been paid this month is simply whether an expense with that tag exists this month. There's no separate payment record to keep in sync.

### Auto-add bills with `pg_cron`, in the database
- **Why:** Fixed bills should appear on their due day even if the app isn't opened. A Postgres function run daily by `pg_cron` (00:05 Malaysia time) does it next to the data, with no external scheduler. In local mode the app runs the same rule on load.

### Goals net of trade-in and vouchers
- **Why:** What you actually need to save for a new phone is its price minus the old phone's trade-in value and any vouchers still valid. Expired vouchers stop counting automatically. **Bought it** logs the real price as a one-off expense, so the goal and the spending stay consistent.

### Budgets are one row per category
- **Why:** A monthly limit per category (`UNIQUE (user_id, category_id)`) covers the common need without the complexity of per-month or rollover budgets. At-risk uses the same forecast rule as the Overview, so the two never disagree.

### Reminders: Web Push + Vercel Cron, rules shared with the UI
- **Web Push (VAPID):** Works on iPhone (Home Screen app), Android and desktop with no third-party notification service or per-message cost. The `web-push` library signs messages on the server.
- **Vercel Cron → `/api/reminders`:** Sending a push needs the VAPID private key and an HTTP call from Node. That's simple in a Next.js route and awkward from `pg_cron`. The route is guarded by `CRON_SECRET`.
- **Shared rules (`src/lib/reminders.ts`):** Pure functions used by both the job and the Settings "Tonight" preview, so what the preview shows is exactly what gets sent.
- **Sent once:** `reminder_log` stores a key per occurrence (e.g. `budget:<category>:2026-09:over`), so a budget warns once when it passes 80% and once when it goes over, not every evening. Devices that have unsubscribed (HTTP 404/410) are removed automatically.
- **Service worker handles push only:** No offline caching, so the app always loads fresh and a stale cache can't cause bugs. Offline use is on the roadmap as its own piece of work.

---

## 5. Process & tooling

### Branches: `chewshen` → `dev` → `main`
- Work happens on `chewshen`, gets integrated on `dev`, and `main` is what Vercel deploys. See [`release-flow.md`](release-flow.md).

### One commit per feature, Conventional Commits
- `feat(scope): …`, `fix(scope): …`, `docs: …`, `chore(release): …`. Each commit builds on its own, so history is easy to read and any commit can be reverted cleanly.

### Semantic versioning, changelog and annotated tags
- `npm version <patch|minor> --no-git-tag-version`, a changelog entry, a `chore(release)` commit and an annotated `vX.Y.Z` tag. See [`version-bump.md`](version-bump.md).

### CI runs only what Vercel doesn't
- **Why:** Vercel already builds every push. GitHub Actions (`.github/workflows/ci.yml`) adds type-check, lint and the formula test on PRs to `dev` and `main`.
- **Checks run on a clean checkout:** Before pushing, checks run in a separate worktree, so leftover local files (a running dev server's `.next`, uncommitted changes) can't hide a broken commit.
