import { ShieldAlert, CheckCircle2, AlertTriangle } from "lucide-react";

interface RecurringItemStatus {
  tag_name: string;
  isLogged: boolean;
}

interface RecurringSentinelProps {
  items: RecurringItemStatus[];
}

export function RecurringSentinel({ items }: RecurringSentinelProps) {
  const missingCount = items.filter((i) => !i.isLogged).length;
  const loggedCount = items.length - missingCount;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-purple-600" />
          <h3 className="font-bold text-base text-foreground">
            Monthly Bills Sentinel
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 font-semibold text-emerald-700 dark:text-emerald-300">
            {loggedCount} Logged
          </span>
          {missingCount > 0 && (
            <span className="rounded bg-amber-100 dark:bg-amber-950 px-2 py-0.5 font-semibold text-amber-700 dark:text-amber-300">
              {missingCount} Missing
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {items.map(({ tag_name, isLogged }) => (
          <div
            key={tag_name}
            className={`flex items-center justify-between rounded-lg border p-2.5 text-xs transition ${
              isLogged
                ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                : "border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20"
            }`}
          >
            <span className="font-medium truncate mr-1">{tag_name}</span>
            {isLogged ? (
              <span className="flex shrink-0 items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logged</span>
              </span>
            ) : (
              <span className="flex shrink-0 items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Missing</span>
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
