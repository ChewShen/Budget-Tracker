import { Check, CircleDashed } from "lucide-react";

interface RecurringItemStatus {
  tag_name: string;
  isLogged: boolean;
}

interface RecurringSentinelProps {
  items: RecurringItemStatus[];
}

export function RecurringSentinel({ items }: RecurringSentinelProps) {
  const loggedCount = items.filter((i) => i.isLogged).length;
  const missingCount = items.length - loggedCount;

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold">Monthly bills</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {missingCount === 0
              ? "Everything is logged"
              : `${missingCount} not logged yet`}
          </p>
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium tabular-nums">
          {loggedCount}/{items.length}
        </span>
      </div>

      <div className="mt-3 h-1.5 w-full rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${items.length ? (loggedCount / items.length) * 100 : 0}%` }}
        />
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
        {items.map(({ tag_name, isLogged }) => (
          <li key={tag_name} className="flex items-center justify-between border-b border-border/60 py-2.5 text-sm last:border-0 sm:[&:nth-last-child(2)]:border-0">
            <span className={isLogged ? "" : "text-muted-foreground"}>{tag_name}</span>
            {isLogged ? (
              <span className="flex items-center gap-1 text-xs font-medium text-success">
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> Logged
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium text-warning">
                <CircleDashed className="h-3.5 w-3.5" /> Missing
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
