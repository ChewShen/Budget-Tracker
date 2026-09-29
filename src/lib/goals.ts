import { differenceInCalendarDays, differenceInCalendarMonths, format, parseISO } from "date-fns";
import type { Goal, GoalContribution, GoalDiscount } from "./types";

const round2 = (n: number) => Math.round(n * 100) / 100;

// RM a discount takes off; percentages are of the full price.
export const discountAmount = (d: GoalDiscount, price: number) =>
  round2(d.kind === "percent" ? (price * d.value) / 100 : d.value);

export const isExpired = (d: GoalDiscount, today: Date = new Date()) =>
  Boolean(d.expires_on) && (d.expires_on as string) < format(today, "yyyy-MM-dd");

// Days until a voucher expires (0 = today), or null without an expiry date.
export const daysToExpiry = (d: GoalDiscount, today: Date = new Date()) =>
  d.expires_on ? differenceInCalendarDays(parseISO(d.expires_on), today) : null;

export const activeDiscountTotal = (g: Pick<Goal, "target_amount" | "discounts">, today: Date = new Date()) =>
  round2((g.discounts || []).filter((d) => !isExpired(d, today)).reduce((sum, d) => sum + discountAmount(d, g.target_amount), 0));

// What you actually need to save: the price minus the trade-in and any discounts still valid.
export const netTarget = (
  g: Pick<Goal, "target_amount" | "trade_in_value"> & Partial<Pick<Goal, "discounts">>,
  today: Date = new Date()
) =>
  round2(
    Math.max(0, g.target_amount - (g.trade_in_value || 0) - activeDiscountTotal({ target_amount: g.target_amount, discounts: g.discounts || [] }, today))
  );

export const savedFor = (goalId: string, contributions: GoalContribution[]) =>
  round2(contributions.filter((c) => c.goal_id === goalId).reduce((sum, c) => sum + c.amount, 0));

// Money set aside for goals that are still active (bought/archived goals no longer hold money).
export const earmarkedTotal = (goals: Goal[], contributions: GoalContribution[]) =>
  round2(
    goals.filter((g) => g.status === "active").reduce((sum, g) => sum + Math.max(0, savedFor(g.id, contributions)), 0)
  );

export interface GoalProgress {
  net: number;
  saved: number;
  remaining: number;
  ratio: number; // 0..1
  isReady: boolean;
  // With a target date: how much to set aside each month (including this one) to make it.
  neededPerMonth: number | null;
  monthsLeft: number | null;
  // Average set aside per month over the last 3 months (by contribution date).
  pacePerMonth: number;
  // When the goal is reached at that pace (YYYY-MM), or null if not saving toward it.
  readyBy: string | null;
}

export function goalProgress(goal: Goal, contributions: GoalContribution[], today: Date = new Date()): GoalProgress {
  const net = netTarget(goal, today);
  const saved = savedFor(goal.id, contributions);
  const remaining = round2(Math.max(0, net - saved));
  const isReady = saved >= net;

  let neededPerMonth: number | null = null;
  let monthsLeft: number | null = null;
  if (goal.target_date && !isReady) {
    monthsLeft = Math.max(1, differenceInCalendarMonths(parseISO(goal.target_date), today) + 1);
    neededPerMonth = round2(remaining / monthsLeft);
  }

  // Pace: average per month over the last 3 calendar months (including this one), counting only
  // the months since you started saving for it, so a goal started this month isn't divided by 3.
  const since = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  const recentContribs = contributions.filter((c) => c.goal_id === goal.id && parseISO(c.date) >= since);
  const firstDate = recentContribs.map((c) => parseISO(c.date)).sort((a, b) => a.getTime() - b.getTime())[0];
  const monthsSaving = firstDate ? Math.min(3, differenceInCalendarMonths(today, firstDate) + 1) : 1;
  const recent = recentContribs.reduce((sum, c) => sum + c.amount, 0);
  const pacePerMonth = round2(Math.max(0, recent / monthsSaving));

  let readyBy: string | null = null;
  if (isReady) readyBy = format(today, "yyyy-MM");
  else if (pacePerMonth > 0) {
    const months = Math.ceil(remaining / pacePerMonth);
    readyBy = format(new Date(today.getFullYear(), today.getMonth() + months, 1), "yyyy-MM");
  }

  return {
    net,
    saved,
    remaining,
    ratio: net > 0 ? Math.min(1, Math.max(0, saved / net)) : 1,
    isReady,
    neededPerMonth,
    monthsLeft,
    pacePerMonth,
    readyBy,
  };
}
