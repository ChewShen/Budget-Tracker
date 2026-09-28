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
