import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import type { YearToDate } from "@/lib/analytics";

const monthName = (m: string) => format(parseISO(`${m}-01`), "MMM");

export function YearToDateCard({ ytd }: { ytd: YearToDate }) {
  const range =
    ytd.months.length === 0
      ? null
      : ytd.months.length === 1
        ? monthName(ytd.months[0])
        : `${monthName(ytd.months[0])}–${monthName(ytd.months[ytd.months.length - 1])}`;

  return (
    <section className="card p-5 sm:p-6">
      <h3 className="text-[15px] font-semibold">{ytd.year} so far</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {range
          ? `Based on ${ytd.months.length} month${ytd.months.length === 1 ? "" : "s"} with expenses (${range})`
          : "No expenses this year yet"}
      </p>
      {range && (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <dt className="eyebrow">Spent</dt>
            <dd className="mt-0.5 font-semibold tabular-nums">{formatCurrency(ytd.spent)}</dd>
          </div>
          <div>
            <dt className="eyebrow">Saved</dt>
            <dd className={`mt-0.5 font-semibold tabular-nums ${ytd.saved >= 0 ? "text-success" : "text-danger"}`}>
              {formatCurrency(ytd.saved)}
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Savings rate</dt>
            <dd className="mt-0.5 font-semibold tabular-nums">{ytd.savingsRate.toFixed(1)}%</dd>
          </div>
          <div>
            <dt className="eyebrow">Avg per month</dt>
            <dd className="mt-0.5 font-semibold tabular-nums">{formatCurrency(ytd.averageMonthly)}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
