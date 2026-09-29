import Link from "next/link";
import { AlertCircle, TrendingUp } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { CategoryIcon, categoryLabel } from "@/lib/categories";
import type { BudgetStatus } from "@/lib/budgets";

export interface BudgetRow {
  categoryName: string;
  status: BudgetStatus;
}

const ORDER = { over: 0, "at-risk": 1, ok: 2 } as const;

// State is always shown as words (and an icon for warnings), never colour alone.
function StatusLine({ s }: { s: BudgetStatus }) {
  if (s.state === "over")
    return (
      <span className="flex items-center gap-1 font-medium text-danger">
        <AlertCircle className="h-3.5 w-3.5" /> {formatCurrency(s.spent - s.limit)} over budget
      </span>
    );
  if (s.state === "at-risk")
    return (
      <span className="flex items-center gap-1 font-medium text-warning">
        <TrendingUp className="h-3.5 w-3.5" /> On pace for {formatCurrency(s.projected)} ·{" "}
        {formatCurrency(s.projected - s.limit)} over
      </span>
    );
  if (s.perDayLeft !== null)
    return (
      <span>
        {formatCurrency(s.perDayLeft)}/day left · on pace for {formatCurrency(s.projected)}
      </span>
    );
  return <span>{formatCurrency(s.limit - s.spent)} under budget</span>;
}

export function BudgetsCard({ rows, monthName }: { rows: BudgetRow[]; monthName: string }) {
  if (rows.length === 0)
    return (
      <section className="card p-5 sm:p-6">
        <h3 className="text-[15px] font-semibold">Budgets</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Set a monthly limit per category in{" "}
          <Link href="/settings/budgets" className="font-medium text-foreground underline underline-offset-2">
            Settings → Budgets
          </Link>{" "}
          to see how each is tracking.
        </p>
      </section>
    );

  const sorted = [...rows].sort(
    (a, b) => ORDER[a.status.state] - ORDER[b.status.state] || b.status.ratio - a.status.ratio
  );
  const spent = rows.reduce((sum, r) => sum + r.status.spent, 0);
  const limit = rows.reduce((sum, r) => sum + r.status.limit, 0);
  const onTrack = rows.filter((r) => r.status.state === "ok").length;

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold">Budgets</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {onTrack} of {rows.length} on track in {monthName} ·{" "}
            <Link href="/settings/budgets" className="underline decoration-border underline-offset-2 hover:text-foreground">
              edit
            </Link>
          </p>
        </div>
        <div className="text-right text-sm tabular-nums">
          <span className="font-semibold">{formatCurrency(spent)}</span>
          <span className="text-muted-foreground"> of {formatCurrency(limit)}</span>
        </div>
      </div>

      <ul className="mt-4 space-y-4">
        {sorted.map(({ categoryName, status: s }) => (
          <li key={categoryName} className="flex items-center gap-3">
            <CategoryIcon name={categoryName} className="h-8 w-8" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate font-medium">{categoryLabel(categoryName)}</span>
                <span className="shrink-0 tabular-nums">
                  {formatCurrency(s.spent)}
                  <span className="text-muted-foreground"> / {formatCurrency(s.limit)}</span>
                </span>
              </div>
              <div
                className="mt-1.5 h-1.5 w-full rounded-full bg-secondary"
                role="progressbar"
                aria-valuenow={Math.round(s.ratio * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${categoryLabel(categoryName)} budget used`}
              >
                <div
                  className={cn(
                    "h-full rounded-full",
                    s.state === "over" ? "bg-danger" : s.state === "at-risk" ? "bg-warning" : "bg-primary"
                  )}
                  style={{ width: `${Math.min(100, Math.max(2, s.ratio * 100))}%` }}
                />
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground tabular-nums">
                <StatusLine s={s} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
