import { format, parse, subMonths } from "date-fns";
import { calculateMonthlyInterest } from "./formulas";
import type { LegacyMonthlySavings, SavingsAccount, SavingsBalance } from "./types";

// Balances are month-end values per account (savings_balances). A month is "recorded" when it
// has at least one balance. Pages work with Snapshots: every balance of one month, by account.

export interface Snapshot {
  month: string; // YYYY-MM-01
  balances: Record<string, { balance: number; rate: number }>; // by account id
}

export function buildSnapshots(balances: SavingsBalance[]): Snapshot[] {
  const byMonth = new Map<string, Snapshot>();
  for (const b of balances) {
    const month = `${b.month.slice(0, 7)}-01`;
    const snap = byMonth.get(month) ?? { month, balances: {} };
    snap.balances[b.account_id] = { balance: b.balance, rate: b.rate };
    byMonth.set(month, snap);
  }
  return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const isLocked = (accounts: SavingsAccount[], id: string) => accounts.find((a) => a.id === id)?.kind === "locked";

// Money you can use (everything except locked accounts such as EPF).
export const liquidOf = (s: Snapshot, accounts: SavingsAccount[]) =>
  round2(Object.entries(s.balances).reduce((sum, [id, b]) => (isLocked(accounts, id) ? sum : sum + b.balance), 0));

export const netWorthOf = (s: Snapshot) => round2(Object.values(s.balances).reduce((sum, b) => sum + b.balance, 0));

// Estimated interest this month on liquid accounts with a rate.
export const interestOf = (s: Snapshot, accounts: SavingsAccount[]) =>
  calculateMonthlyInterest(
    Object.entries(s.balances).filter(([id]) => !isLocked(accounts, id)).map(([, b]) => b),
    s.month.slice(0, 7)
  );

// Accounts to list for a month: its own balances plus active accounts, in display order.
export function accountsFor(accounts: SavingsAccount[], s?: Snapshot): SavingsAccount[] {
  return accounts
    .filter((a) => !a.archived || (s && a.id in s.balances))
    .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
}

export const previousMonth = (month: string) =>
  format(subMonths(parse(`${month}-01`, "yyyy-MM-dd", new Date()), 1), "yyyy-MM");

export const snapshotFor = (snapshots: Snapshot[], month: string) => snapshots.find((s) => s.month.startsWith(month));

// Latest recorded snapshot strictly before `month`.
export const latestBefore = (snapshots: Snapshot[], month: string) =>
  [...snapshots].reverse().find((s) => s.month.slice(0, 7) < month);

export interface DraftLine {
  account: SavingsAccount;
  balance: number;
  rate: number;
  previous?: number; // balance in the latest earlier record, if it had this account
}

// Starting values when recording a month, per account: its own balance, else carried forward
// from the latest earlier record that has the account (balance and rate), else 0.
export function draftFor(accounts: SavingsAccount[], snapshots: Snapshot[], month: string): DraftLine[] {
  const own = snapshotFor(snapshots, month);
  const earlier = snapshots.filter((s) => s.month.slice(0, 7) < month).reverse();
  return accountsFor(accounts, own).map((account) => {
    const before = earlier.find((s) => account.id in s.balances)?.balances[account.id];
    const base = own?.balances[account.id] ?? before;
    return { account, balance: base?.balance ?? 0, rate: base?.rate ?? 0, previous: before?.balance };
  });
}

// Converts the old fixed columns (main checking, GXBank, RYT, EPF) into accounts and balances.
// Mirrors scripts/migrations/2026-09-30_savings_accounts.sql: all-zero months were never
// recorded (an old import artifact) and are skipped, as are accounts that were always 0.
export function fromLegacySavings(rows: LegacyMonthlySavings[]): { accounts: SavingsAccount[]; balances: SavingsBalance[] } {
  const recorded = rows.filter(
    (r) => (r.main_checking || 0) + (r.gx_bank || 0) + (r.ryt_bank || 0) + (r.epf_locked || 0) > 0
  );
  const columns = [
    { id: "acct-main", name: "Main checking", kind: "liquid", value: (r: LegacyMonthlySavings) => r.main_checking, rate: () => 0 },
    { id: "acct-gx", name: "GXBank", kind: "liquid", value: (r: LegacyMonthlySavings) => r.gx_bank, rate: (r: LegacyMonthlySavings) => r.gx_rate },
    { id: "acct-ryt", name: "RYT / Rize", kind: "liquid", value: (r: LegacyMonthlySavings) => r.ryt_bank, rate: (r: LegacyMonthlySavings) => r.ryt_rate },
    { id: "acct-epf", name: "EPF & locked", kind: "locked", value: (r: LegacyMonthlySavings) => r.epf_locked, rate: () => 0 },
  ] as const;
  const used = columns.filter((c) => recorded.some((r) => (c.value(r) || 0) > 0));
  return {
    accounts: used.map((c, i) => ({ id: c.id, name: c.name, kind: c.kind, position: i, archived: false })),
    balances: recorded.flatMap((r) =>
      used.map((c) => ({
        id: `bal-${c.id}-${r.month.slice(0, 7)}`,
        account_id: c.id,
        month: `${r.month.slice(0, 7)}-01`,
        balance: Number(c.value(r) || 0),
        rate: Number(c.rate(r) || 0),
      }))
    ),
  };
}

// ---- Emergency fund ----

const monthIndex = (month: string) => Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7)) - 1;

// Average spending over up to `n` completed months (before the current month) with expenses,
// up to and including `month`. A half-finished month would understate it, so it's left out.
export function averageMonthlySpend(
  txs: { date: string; amount: number }[],
  month: string,
  currentMonth: string,
  n = 3
): { average: number; months: string[] } {
  const months = Array.from(new Set(txs.map((t) => t.date.slice(0, 7))))
    .filter((m) => m <= month && m < currentMonth)
    .sort()
    .slice(-n);
  const total = txs.filter((t) => months.includes(t.date.slice(0, 7))).reduce((sum, t) => sum + t.amount, 0);
  return { average: months.length ? Math.round((total / months.length) * 100) / 100 : 0, months };
}

export interface SavingPace {
  perMonth: number;
  basis: "balances" | "budget"; // measured from recorded balances, or estimated from salary minus spending
}

// How fast liquid money grows: measured across recorded months when there are at least two,
// otherwise estimated as take-home pay minus average spending.
export function savingPace(
  snapshots: Snapshot[],
  accounts: SavingsAccount[],
  month: string,
  takeHome: number,
  averageSpend: number
): SavingPace {
  const history = snapshots.filter((s) => s.month.slice(0, 7) <= month);
  if (history.length >= 2) {
    const first = history[0];
    const last = history[history.length - 1];
    const span = monthIndex(last.month.slice(0, 7)) - monthIndex(first.month.slice(0, 7));
    return {
      perMonth: Math.round(((liquidOf(last, accounts) - liquidOf(first, accounts)) / span) * 100) / 100,
      basis: "balances",
    };
  }
  return { perMonth: Math.round((takeHome - averageSpend) * 100) / 100, basis: "budget" };
}

// Month (YYYY-MM) when `remaining` is covered at `perMonth`, counting from `month`; null if not growing.
export function reachMonth(month: string, remaining: number, perMonth: number): string | null {
  if (remaining <= 0) return month;
  if (perMonth <= 0) return null;
  const i = monthIndex(month) + Math.ceil(remaining / perMonth);
  return `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;
}
