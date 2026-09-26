import { formatCurrency } from "@/lib/utils";
import { CategoryIcon, categoryLabel } from "@/lib/categories";

interface CategorySpend {
  name: string;
  value: number;
}

interface CategoryChartProps {
  data: CategorySpend[];
}

// Ranked list with inline bars: easier to read than a 10-slice donut and needs no rainbow palette.
export function CategoryChart({ data }: CategoryChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const max = data[0]?.value || 1;
  const VISIBLE = 6;
  const hidden = data.slice(VISIBLE);
  const hiddenTotal = hidden.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="card p-5 sm:p-6">
      <h3 className="text-[15px] font-semibold">Where it went</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">By category</p>

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
