import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CategoryIcon, categoryLabel } from "@/lib/categories";

interface CategorySpend {
  name: string;
  value: number;
  usual?: number; // average for comparison (pro-rated for the current month); undefined = no history
}

interface CategoryChartProps {
  data: CategorySpend[];
  baselineMonths: number;
  isMonthToDate: boolean;
}

// Differences under RM 10 or 15% of usual read as "about usual".
function VsUsual({ value, usual }: { value: number; usual?: number }) {
  if (usual === undefined) return null;
  if (usual === 0) return <span className="text-muted-foreground">New vs usual</span>;
  const diff = value - usual;
  if (Math.abs(diff) < Math.max(10, usual * 0.15)) return <span className="text-muted-foreground">About usual</span>;
  const Icon = diff > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 ${diff > 0 ? "text-danger" : "text-success"}`}>
      <Icon className="h-3 w-3" />
      {formatCurrency(Math.abs(diff))} {diff > 0 ? "more" : "less"} than usual
    </span>
  );
}

// Ranked list with inline bars: easier to read than a 10-slice donut and needs no rainbow palette.
export function CategoryChart({ data, baselineMonths, isMonthToDate }: CategoryChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const max = data[0]?.value || 1;
  const VISIBLE = 6;
  const hidden = data.slice(VISIBLE);
  const hiddenTotal = hidden.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="card p-5 sm:p-6">
      <h3 className="text-[15px] font-semibold">Where it went</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {baselineMonths === 0
          ? "By category"
          : `By category · vs your ${baselineMonths === 1 ? "last month" : `${baselineMonths}-month average`}${
              isMonthToDate ? " by this point in the month" : ""
            }`}
      </p>

      {data.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No expenses this month</p>
      ) : (
        <ul className="mt-5 space-y-4">
          {data.slice(0, VISIBLE).map((item) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <li key={item.name} className="flex items-center gap-3">
                <CategoryIcon name={item.name} className="h-8 w-8" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{categoryLabel(item.name)}</span>
                    <span className="shrink-0 tabular-nums">
                      {formatCurrency(item.value)}
                      <span className="ml-1.5 inline-block w-8 text-right text-xs text-muted-foreground">
                        {pct}%
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[11px]">
                    <VsUsual value={item.value} usual={item.usual} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {hidden.length > 0 && (
        <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
          +{hidden.length} more · {hidden.map((h) => categoryLabel(h.name)).join(", ")} ·{" "}
          <span className="tabular-nums">{formatCurrency(hiddenTotal)}</span>
        </p>
      )}
    </section>
  );
}
