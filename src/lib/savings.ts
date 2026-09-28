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
