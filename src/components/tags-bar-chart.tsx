import { formatCurrency } from "@/lib/utils";

interface TagSpend {
  name: string;
  value: number;
}

interface TagsBarChartProps {
  data: TagSpend[];
}

export function TagsBarChart({ data }: TagsBarChartProps) {
  const topTags = [...data].sort((a, b) => b.value - a.value).slice(0, 8);
  const max = topTags[0]?.value || 1;

  return (
    <section className="card p-5 sm:p-6">
      <h3 className="text-[15px] font-semibold">Top tags</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">Your 8 biggest spending areas</p>

      {topTags.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No expenses this month</p>
      ) : (
        <ol className="mt-5 space-y-2.5">
          {topTags.map((tag, index) => (
            <li key={tag.name} className="relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2 text-sm">
              <div
                className={`absolute inset-y-0 left-0 rounded-lg ${index === 0 ? "bg-primary/20" : "bg-secondary"}`}
                style={{ width: `${Math.max(4, (tag.value / max) * 100)}%` }}
                aria-hidden
              />
              <span className="relative w-4 text-xs tabular-nums text-muted-foreground">{index + 1}</span>
              <span className="relative flex-1 truncate font-medium">{tag.name}</span>
              <span className="relative tabular-nums">{formatCurrency(tag.value)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
