import { getDaysInMonth, parseISO } from "date-fns";
import { monthProgress } from "./analytics";
import type { Transaction } from "./types";

const round2 = (n: number) => Math.round(n * 100) / 100;

export type BudgetState = "ok" | "at-risk" | "over";

export interface BudgetStatus {
  limit: number;
  spent: number;
  projected: number; // expected month-end total (= spent for past months)
  remaining: number; // limit - spent, never below 0
  perDayLeft: number | null; // what's left per remaining day (current month only)
  ratio: number; // spent / limit, can exceed 1
  state: BudgetState;
}

// How a category is doing against its monthly limit. For the current month, only everyday
// spending is projected forward at its daily pace; bills and one-offs count as they are
// (plus bills in this category still to come), so paying rent on the 1st doesn't make the
// month look 30x over.
export function budgetStatus(opts: {
  limit: number;
  categoryTxs: Transaction[]; // this category, this month
  month: string; // YYYY-MM
  today: string; // YYYY-MM-DD
  billTagIds: Set<string>;
  upcomingBills: number; // known amounts of this category's bills not paid yet this month
}): BudgetStatus {
  const { limit, categoryTxs, month, today, billTagIds, upcomingBills } = opts;
  const spent = round2(categoryTxs.reduce((sum, t) => sum + t.amount, 0));
  const fixed = categoryTxs.filter((t) => t.is_one_off || billTagIds.has(t.tag_id)).reduce((s, t) => s + t.amount, 0);
  const flexible = spent - fixed;
  const progress = monthProgress(month, today);
  const isCurrent = progress < 1;

  const projected = isCurrent ? round2(fixed + flexible / progress + upcomingBills) : spent;
  const remaining = round2(Math.max(0, limit - spent));
  const daysLeft = isCurrent ? getDaysInMonth(parseISO(`${month}-01`)) - Number(today.slice(8, 10)) + 1 : 0;

  let state: BudgetState = "ok";
  if (spent > limit) state = "over";
  else if (isCurrent && projected > limit) state = "at-risk";

  return {
    limit,
    spent,
    projected,
    remaining,
    perDayLeft: isCurrent ? round2(remaining / daysLeft) : null,
    ratio: limit > 0 ? spent / limit : 0,
    state,
  };
}
