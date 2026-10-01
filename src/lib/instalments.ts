import { addMonths, format, parseISO } from "date-fns";
import type { RecurringBill, Transaction } from "./types";

// Instalment plans are monthly bills that end: `installment_count` payments of `expected_amount`
// from `start_month`. Pure functions, shared by Overview, Goals, Savings, reminders and auto-add.

const round2 = (n: number) => Math.round(n * 100) / 100;
const ym = (date: string) => date.slice(0, 7);

export const isInstalment = (b: Pick<RecurringBill, "installment_count" | "start_month">) =>
  Boolean(b.installment_count && b.start_month);

// YYYY-MM of the last payment.
export function lastPaymentMonth(b: Pick<RecurringBill, "installment_count" | "start_month">): string | null {
  if (!isInstalment(b)) return null;
  return format(addMonths(parseISO(b.start_month as string), (b.installment_count as number) - 1), "yyyy-MM");
}

// Whether a bill is running in a month (YYYY-MM): ongoing bills always are, plans only between
// their first and last payment.
export function billActiveIn(b: Pick<RecurringBill, "installment_count" | "start_month">, month: string): boolean {
  if (!isInstalment(b)) return true;
  return month >= ym(b.start_month as string) && month <= (lastPaymentMonth(b) as string);
}

// The plan's months, first to last (YYYY-MM).
export function planMonths(b: Pick<RecurringBill, "installment_count" | "start_month">): string[] {
  if (!isInstalment(b)) return [];
  const start = parseISO(b.start_month as string);
  return Array.from({ length: b.installment_count as number }, (_, i) => format(addMonths(start, i), "yyyy-MM"));
}

export interface InstalmentProgress {
  total: number; // number of payments
  paid: number; // plan months with a payment logged (up to asOf)
  monthly: number;
  owed: number; // still to pay: unpaid payments × monthly
  firstMonth: string; // YYYY-MM
  lastMonth: string; // YYYY-MM
  finished: boolean;
}

// How far a plan is, counting a month as paid when an expense with the plan's tag is logged in it.
// `asOf` (YYYY-MM-DD) ignores later payments, e.g. for a past month's net worth.
export function instalmentProgress(
  bill: RecurringBill,
  transactions: Pick<Transaction, "tag_id" | "date">[],
  asOf?: string
): InstalmentProgress | null {
  if (!isInstalment(bill)) return null;
  const months = planMonths(bill);
  const paidMonths = new Set(
    transactions
      .filter((t) => t.tag_id === bill.tag_id && (!asOf || t.date <= asOf))
      .map((t) => ym(t.date))
      .filter((m) => months.includes(m))
  );
  const total = months.length;
  const paid = paidMonths.size;
  const monthly = bill.expected_amount ?? 0;
  return {
    total,
    paid,
    monthly,
    owed: round2(Math.max(0, total - paid) * monthly),
    firstMonth: months[0],
    lastMonth: months[total - 1],
    finished: paid >= total,
  };
}

// Everything still owed across plans, as of a date. A plan only counts from when it was taken
// out (`openedOn`: the goal's bought date, else its first payment month), so a past month's net
// worth doesn't include a debt that didn't exist yet.
export function totalOwed(
  bills: RecurringBill[],
  transactions: Pick<Transaction, "tag_id" | "date">[],
  asOf: string, // YYYY-MM-DD
  openedOn: (b: RecurringBill) => string | null | undefined = (b) => b.start_month
): number {
  return round2(
    bills.reduce((sum, b) => {
      const opened = openedOn(b) ?? b.start_month;
      if (!isInstalment(b) || (opened && opened > asOf)) return sum;
      return sum + (instalmentProgress(b, transactions, asOf)?.owed ?? 0);
    }, 0)
  );
}

export interface PlanTerms {
  financed: number; // price minus down payment
  fees: number; // interest / fees over the whole plan
  monthly: number;
  total: number; // down payment + amount financed + fees
  extra: number; // what paying by instalment costs over paying upfront (the fees)
}

// Monthly payment for a price, down payment, number of months and total fee rate (0.06 = 6% of
// the amount financed, over the whole plan; 0 for most buy-now-pay-later plans).
export function planTerms(opts: { price: number; downPayment: number; months: number; feeRate: number }): PlanTerms {
  // Worked in whole sen: decimal ringgit in floating point can land just under a half sen
  // ((5,499 + 329.94) / 12 = 485.744999…) and round the wrong way.
  const sen = (rm: number) => Math.round(rm * 100);
  const financed = Math.max(0, sen(opts.price) - sen(opts.downPayment));
  const fees = Math.round(financed * Math.max(0, opts.feeRate));
  const monthly = opts.months > 0 ? Math.round((financed + fees) / opts.months) : 0;
  // Total and extra come from the fees, not monthly × months: rounding the monthly amount can make
  // that a few sen off (plans settle it in the last payment), and a 0% plan must never look like it
  // costs more.
  const total = sen(opts.downPayment) + financed + fees;
  return { financed: financed / 100, fees: fees / 100, monthly: monthly / 100, total: total / 100, extra: fees / 100 };
}
