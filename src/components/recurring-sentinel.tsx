"use client";

import { useState } from "react";
import { Check, CircleDashed } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const formatDay = (date: string) =>
  new Date(date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

interface RecurringItemStatus {
  tag_name: string;
  isLogged: boolean;
}

interface LoggableBill {
  tag_name: string;
  amount: number;
  date: string;
}

interface RecurringSentinelProps {
  items: RecurringItemStatus[];
  loggableBills: LoggableBill[];
  onLogMissing: () => void;
}

export function RecurringSentinel({ items, loggableBills, onLogMissing }: RecurringSentinelProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const loggableTotal = loggableBills.reduce((sum, b) => sum + b.amount, 0);
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

      {loggableBills.length > 0 &&
        (isConfirming ? (
          <div className="mt-4 rounded-xl bg-secondary/60 p-4">
            <div className="text-sm font-medium">Log with last month&apos;s amounts?</div>
            <ul className="mt-2 space-y-1 text-sm">
              {loggableBills.map((b) => (
                <li key={b.tag_name} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">
                    {b.tag_name} · {formatDay(b.date)}
                  </span>
                  <span className="tabular-nums">{formatCurrency(b.amount)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-3">
              <span className="text-sm font-semibold tabular-nums">{formatCurrency(loggableTotal)}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsConfirming(false)}
                  className="rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setIsConfirming(false);
                    onLogMissing();
                  }}
                  className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:brightness-95"
                >
                  Log {loggableBills.length}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsConfirming(true)}
            className="mt-4 w-full rounded-full border py-2 text-sm font-medium transition hover:bg-secondary"
          >
            Log {loggableBills.length} missing bill{loggableBills.length === 1 ? "" : "s"}
          </button>
        ))}
    </section>
  );
}
