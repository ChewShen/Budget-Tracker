import { getDaysInMonth, parseISO } from "date-fns";
import { Transaction } from "./types";

// Pure helpers behind the Overview analytics. Months are "YYYY-MM"; dates "YYYY-MM-DD".

const round2 = (n: number) => Math.round(n * 100) / 100;
export const sumAmounts = (txs: Transaction[]) => round2(txs.reduce((sum, t) => sum + t.amount, 0));

export interface MonthForecast {
  projected: number;
  flexibleDaily: number; // average per day of everyday spending so far
  daysLeft: number;
  billsToCome: number;
}

// Where the current month is heading: spent so far, plus everyday spending continuing at
// its average so far, plus bills not yet paid. Bills and one-offs are left out of the
// average so a big bill early in the month doesn't inflate every remaining day.
export function monthForecast(
  monthTxs: Transaction[],
  month: string,
  today: string,
  billTagIds: Set<string>,
  billsToCome: number
): MonthForecast | null {
  if (today.slice(0, 7) !== month) return null;
  const daysInMonth = getDaysInMonth(parseISO(`${month}-01`));
  const dayOfMonth = Number(today.slice(8, 10));
  const flexible = monthTxs.filter((t) => !t.is_one_off && !billTagIds.has(t.tag_id));
  const flexibleDaily = sumAmounts(flexible) / dayOfMonth;
  const daysLeft = daysInMonth - dayOfMonth;
  return {
    projected: round2(sumAmounts(monthTxs) + flexibleDaily * daysLeft + billsToCome),
    flexibleDaily: round2(flexibleDaily),
    daysLeft,
    billsToCome: round2(billsToCome),
  };
}

// The `n` months before `month`, most recent first.
export function monthsBefore(month: string, n: number): string[] {
  const [y, m] = month.split("-").map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(y, m - 2 - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

export interface Baseline {
  // Average spend per key over the months used; missing key = nothing spent there.
  average: Map<string, number>;
  monthsUsed: number;
}

// Average monthly spend per key (category or tag name) over up to `n` earlier months
// that have any expenses. Months with no data are skipped rather than counted as RM 0.
export function baseline(
  txs: Transaction[],
  month: string,
  keyOf: (t: Transaction) => string,
  n = 3
): Baseline {
  const months = monthsBefore(month, n).filter((m) => txs.some((t) => t.date.startsWith(m)));
  const totals = new Map<string, number>();
  txs
    .filter((t) => months.some((m) => t.date.startsWith(m)))
    .forEach((t) => totals.set(keyOf(t), (totals.get(keyOf(t)) || 0) + t.amount));
  const average = new Map<string, number>();
  totals.forEach((total, key) => average.set(key, round2(total / months.length)));
  return { average, monthsUsed: months.length };
}

// Share of the month elapsed by `today` (1 for past months), so the current month-to-date
// can be compared with a pro-rated "usual" instead of a full month.
export function monthProgress(month: string, today: string): number {
  if (today.slice(0, 7) !== month) return 1;
  return Number(today.slice(8, 10)) / getDaysInMonth(parseISO(`${month}-01`));
}
