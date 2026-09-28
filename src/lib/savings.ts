import { format, parse, subMonths } from "date-fns";
import { MonthlySavings } from "./types";

// Balances are month-end snapshots stored as one row per month (month = YYYY-MM-01).

export const liquidOf = (s: MonthlySavings) => s.main_checking + s.gx_bank + s.ryt_bank;
export const netWorthOf = (s: MonthlySavings) => liquidOf(s) + s.epf_locked;

// The Excel import created all-zero rows for months that were never filled in,
// so an all-zero snapshot means "not recorded", not "RM 0".
export const isRecorded = (s: MonthlySavings | undefined): s is MonthlySavings =>
  Boolean(s) && netWorthOf(s as MonthlySavings) > 0;

export const previousMonth = (month: string) =>
  format(subMonths(parse(`${month}-01`, "yyyy-MM-dd", new Date()), 1), "yyyy-MM");

export function snapshotFor(savings: MonthlySavings[], month: string) {
  const s = savings.find((row) => row.month.startsWith(month));
  return isRecorded(s) ? s : undefined;
}

// Latest recorded snapshot strictly before `month`.
export function latestBefore(savings: MonthlySavings[], month: string) {
  return savings
    .filter((row) => row.month.slice(0, 7) < month && isRecorded(row))
    .sort((a, b) => b.month.localeCompare(a.month))[0];
}

// Starting values when recording a month: its own snapshot, else carried forward
// from the latest earlier one (balances and rates), else defaults.
export function draftFor(savings: MonthlySavings[], month: string): MonthlySavings {
  const base = snapshotFor(savings, month) || latestBefore(savings, month);
  return {
    month: `${month}-01`,
    main_checking: base?.main_checking ?? 0,
    gx_bank: base?.gx_bank ?? 0,
    gx_rate: base?.gx_rate ?? 0.0355,
    ryt_bank: base?.ryt_bank ?? 0,
    ryt_rate: base?.ryt_rate ?? 0,
    epf_locked: base?.epf_locked ?? 0,
  };
}

// Recorded snapshots in chronological order, for the trend chart.
export const recordedHistory = (savings: MonthlySavings[]) =>
  savings.filter(isRecorded).sort((a, b) => a.month.localeCompare(b.month));

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
  savings: MonthlySavings[],
  month: string,
  takeHome: number,
  averageSpend: number
): SavingPace {
  const history = recordedHistory(savings).filter((s) => s.month.slice(0, 7) <= month);
  if (history.length >= 2) {
    const first = history[0];
    const last = history[history.length - 1];
    const span = monthIndex(last.month.slice(0, 7)) - monthIndex(first.month.slice(0, 7));
    return { perMonth: Math.round(((liquidOf(last) - liquidOf(first)) / span) * 100) / 100, basis: "balances" };
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
