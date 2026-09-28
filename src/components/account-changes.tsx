import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { netWorthOf } from "@/lib/savings";
import type { MonthlySavings } from "@/lib/types";

const ACCOUNTS = [
  { key: "main_checking", label: "Main checking" },
  { key: "gx_bank", label: "GXBank" },
  { key: "ryt_bank", label: "RYT / Rize" },
  { key: "epf_locked", label: "EPF & locked" },
] as const;

function Change({ value }: { value: number }) {
  if (Math.abs(value) < 0.005) return <span className="text-muted-foreground">No change</span>;
  const Icon = value > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 font-medium ${value > 0 ? "text-success" : "text-danger"}`}>
      <Icon className="h-3.5 w-3.5" />
      {value > 0 ? "+" : "−"}
      {formatCurrency(Math.abs(value))}
    </span>
  );
}

// Where the net worth change came from, account by account.
export function AccountChanges({
  current,
  previous,
  previousLabel,
}: {
  current: MonthlySavings;
  previous: MonthlySavings;
  previousLabel: string; // e.g. "August"
}) {
  const total = netWorthOf(current) - netWorthOf(previous);

  return (
    <section className="card p-5 sm:p-6">
      <h3 className="text-[15px] font-semibold">Since {previousLabel}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">Where the change in net worth came from</p>

      <ul className="mt-4 divide-y divide-border/70">
        {ACCOUNTS.map(({ key, label }) => {
          const before = previous[key];
          const after = current[key];
          const diff = after - before;
          return (
            <li key={key} className="flex items-center gap-3 py-2.5 text-sm">
              <span className={`flex-1 ${Math.abs(diff) < 0.005 ? "text-muted-foreground" : ""}`}>{label}</span>
              <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">
                {formatCurrency(before)} → {formatCurrency(after)}
              </span>
              <span className="w-32 text-right tabular-nums">
                <Change value={diff} />
              </span>
            </li>
          );
        })}
        <li className="flex items-center gap-3 pt-3 text-sm">
          <span className="flex-1 font-medium">Net worth</span>
          <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">
            {formatCurrency(netWorthOf(previous))} → {formatCurrency(netWorthOf(current))}
          </span>
          <span className="w-32 text-right tabular-nums">
            <Change value={total} />
          </span>
        </li>
      </ul>
    </section>
  );
}
