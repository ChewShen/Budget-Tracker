import { formatCurrency } from "@/lib/utils";
import type { SpendSplit as Split } from "@/lib/analytics";

// Segments differ in lightness and are always labelled with amount and share.
const PARTS: { key: keyof Split; label: string; note: string; fill: string }[] = [
  { key: "everyday", label: "Everyday", note: "Flexible, day to day", fill: "hsl(var(--primary))" },
  { key: "bills", label: "Bills", note: "Fixed monthly bills", fill: "hsl(var(--chart-bar))" },
  { key: "oneOff", label: "One-offs", note: "Irregular, marked one-off", fill: "hsl(var(--primary) / 0.35)" },
];

export function SpendSplitCard({ split }: { split: Split }) {
  const total = split.everyday + split.bills + split.oneOff;

  return (
    <section className="card p-5 sm:p-6">
      <h3 className="text-[15px] font-semibold">Fixed vs flexible</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">How much of this month you control day to day</p>

      {total === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No expenses this month</p>
      ) : (
        <>
          <div className="mt-5 flex h-3 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label="Spending split">
            {PARTS.map((p) =>
              split[p.key] > 0 ? (
                <div key={p.key} style={{ width: `${(split[p.key] / total) * 100}%`, background: p.fill }} />
              ) : null
            )}
          </div>
          <ul className="mt-5 space-y-3">
            {PARTS.map((p) => (
              <li key={p.key} className="flex items-center gap-3 text-sm">
                <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: p.fill }} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{p.label}</span>
                  <span className="block text-xs text-muted-foreground">{p.note}</span>
                </span>
                <span className="shrink-0 text-right tabular-nums">
                  {formatCurrency(split[p.key])}
                  <span className="block text-xs text-muted-foreground">
                    {Math.round((split[p.key] / total) * 100)}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
