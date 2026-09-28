import { format, getDaysInMonth, parseISO } from "date-fns";
import { Transaction } from "./types";
import { formatCurrency as rm } from "./utils";

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

export interface MonthTotal {
  month: string;
  total: number;
}

// Totals for up to `n` months ending at `endMonth`, oldest first, starting from the first
// month that has any data (so there are no empty months before your history begins).
export function monthlyTotals(txs: Transaction[], endMonth: string, n = 6): MonthTotal[] {
  const months = [endMonth, ...monthsBefore(endMonth, n - 1)].reverse();
  const totals = months.map((month) => ({
    month,
    total: sumAmounts(txs.filter((t) => t.date.startsWith(month))),
  }));
  const first = totals.findIndex((m) => m.total > 0);
  return first === -1 ? totals.slice(-1) : totals.slice(first);
}

export interface Insight {
  id: string;
  tone: "up" | "down" | "neutral"; // up = spending more than usual (bad), down = less (good)
  title: string;
  detail?: string;
  score: number; // how notable; the card shows the top few
}

const isWeekend = (date: string) => [0, 6].includes(parseISO(date).getDay());

// Plain-English highlights for a month, most notable first.
export function monthInsights(txs: Transaction[], month: string, today: string, limit = 3): Insight[] {
  const monthTxs = txs.filter((t) => t.date.startsWith(month));
  if (monthTxs.length === 0) return [];
  const total = sumAmounts(monthTxs);
  const progress = monthProgress(month, today);
  const isCurrent = today.slice(0, 7) === month;
  const out: Insight[] = [];

  // 1-2. Tags furthest above / below their usual (pro-rated for the current month).
  const tagBase = baseline(txs, month, (t) => t.tag_name || "Other");
  if (tagBase.monthsUsed > 0) {
    const byTag = new Map<string, number>();
    monthTxs.forEach((t) => byTag.set(t.tag_name || "Other", (byTag.get(t.tag_name || "Other") || 0) + t.amount));
    const names = new Set([...byTag.keys(), ...tagBase.average.keys()]);
    const diffs = [...names].map((name) => {
      const usual = (tagBase.average.get(name) || 0) * progress;
      return { name, usual, diff: (byTag.get(name) || 0) - usual };
    });
    const notable = (d: { usual: number; diff: number }) => Math.abs(d.diff) >= Math.max(30, d.usual * 0.25);
    const up = diffs.filter((d) => d.diff > 0 && notable(d)).sort((a, b) => b.diff - a.diff)[0];
    const down = diffs.filter((d) => d.diff < 0 && notable(d)).sort((a, b) => a.diff - b.diff)[0];
    const basis = tagBase.monthsUsed === 1 ? "last month" : `your ${tagBase.monthsUsed}-month average`;
    if (up)
      out.push({
        id: "tag-up",
        tone: "up",
        title: `${up.name} is ${rm(up.diff)} above usual`,
        detail: `Compared with ${basis}${isCurrent ? " by this point in the month" : ""}.`,
        score: up.diff,
      });
    if (down)
      out.push({
        id: "tag-down",
        tone: "down",
        title: `${down.name} is ${rm(-down.diff)} below usual`,
        detail: `Compared with ${basis}${isCurrent ? " by this point in the month" : ""}.`,
        score: -down.diff * 0.8,
      });
  }

  // 3. No-spend days so far.
  const lastDay = isCurrent ? Number(today.slice(8, 10)) : getDaysInMonth(parseISO(`${month}-01`));
  const spentDays = new Set(monthTxs.map((t) => Number(t.date.slice(8, 10))));
  const noSpend = Array.from({ length: lastDay }, (_, i) => i + 1).filter((d) => !spentDays.has(d)).length;
  if (noSpend > 0)
    out.push({
      id: "no-spend",
      tone: "down",
      title: `${noSpend} no-spend day${noSpend === 1 ? "" : "s"}${isCurrent ? " so far" : ""}`,
      detail: `Out of ${lastDay} day${lastDay === 1 ? "" : "s"}${isCurrent ? " this month" : ""}.`,
      score: 25 + noSpend * 8,
    });

  // 4. Weekend-heavy spending (weekends are 2 of 7 days, about 29%).
  const weekendShare = sumAmounts(monthTxs.filter((t) => isWeekend(t.date))) / total;
  if (weekendShare >= 0.45)
    out.push({
      id: "weekend",
      tone: "neutral",
      title: `Weekends are ${Math.round(weekendShare * 100)}% of your spending`,
      detail: "Saturdays and Sundays are only 2 of every 7 days.",
      score: (weekendShare - 0.29) * 300,
    });

  // 5. One-offs making up a big share.
  const oneOff = sumAmounts(monthTxs.filter((t) => t.is_one_off));
  if (oneOff / total >= 0.2)
    out.push({
      id: "one-off",
      tone: "neutral",
      title: `One-offs are ${Math.round((oneOff / total) * 100)}% of this month`,
      detail: `${rm(oneOff)} marked as one-off, left out of your daily average.`,
      score: (oneOff / total) * 150,
    });

  // 6. Biggest day (fallback so there's always something to show).
  const byDay = new Map<string, number>();
  monthTxs.forEach((t) => byDay.set(t.date, (byDay.get(t.date) || 0) + t.amount));
  const [bigDate, bigAmount] = [...byDay.entries()].sort((a, b) => b[1] - a[1])[0];
  const bigTop = monthTxs.filter((t) => t.date === bigDate).sort((a, b) => b.amount - a.amount)[0];
  out.push({
    id: "biggest-day",
    tone: "neutral",
    title: `Biggest day: ${format(parseISO(bigDate), "EEE d MMM")}, ${rm(bigAmount)}`,
    detail: bigTop?.tag_name ? `Mostly ${bigTop.tag_name} (${rm(bigTop.amount)}).` : undefined,
    score: 10,
  });

  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

export interface SpendSplit {
  everyday: number; // flexible, day-to-day spending
  bills: number; // tags that are monthly bills
  oneOff: number; // marked one-off
}

// Bills first (a bill is fixed even if marked one-off), then one-offs, then everyday.
export function spendSplit(monthTxs: Transaction[], billTagIds: Set<string>): SpendSplit {
  const bills = monthTxs.filter((t) => billTagIds.has(t.tag_id));
  const oneOff = monthTxs.filter((t) => !billTagIds.has(t.tag_id) && t.is_one_off);
  const everyday = monthTxs.filter((t) => !billTagIds.has(t.tag_id) && !t.is_one_off);
  return { everyday: sumAmounts(everyday), bills: sumAmounts(bills), oneOff: sumAmounts(oneOff) };
}

export interface YearToDate {
  year: number;
  months: string[]; // months with data, oldest first
  spent: number;
  saved: number; // take-home minus spending, summed over those months
  savingsRate: number; // saved / total take-home, %
  averageMonthly: number;
}

// Months of `throughMonth`'s year, up to and including it, that have any expenses.
// Months without data are left out rather than counted as a full month of saving.
export function yearToDate(txs: Transaction[], throughMonth: string, takeHome: number): YearToDate {
  const year = Number(throughMonth.slice(0, 4));
  const months = Array.from(new Set(txs.map((t) => t.date.slice(0, 7))))
    .filter((m) => m.startsWith(`${year}-`) && m <= throughMonth)
    .sort();
  const spent = sumAmounts(txs.filter((t) => months.includes(t.date.slice(0, 7))));
  const income = takeHome * months.length;
  const saved = round2(income - spent);
  return {
    year,
    months,
    spent,
    saved,
    savingsRate: income > 0 ? round2((saved / income) * 100) : 0,
    averageMonthly: months.length ? round2(spent / months.length) : 0,
  };
}
