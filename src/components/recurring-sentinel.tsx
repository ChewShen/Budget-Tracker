"use client";

import { useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { AlertCircle, Check, CircleDashed, Clock, Repeat } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export type BillStatus = "logged" | "overdue" | "due-soon" | "upcoming" | "missing" | "auto" | "auto-pending";

const formatDay = (date: string) => format(parseISO(date), "d MMM");

interface BillRow {
  id: string;
  tag_name: string;
  status: BillStatus;
  daysLeft: number | null;
  dueDate: string | null;
}

interface LoggableBill {
  id: string;
  tag_name: string;
  amount: number;
  date: string;
}

interface RecurringSentinelProps {
  items: BillRow[];
  loggableBills: LoggableBill[];
  onLogMissing: () => void;
}

// Status is always shown as icon + text, never colour alone.
function StatusLabel({ row }: { row: BillRow }) {
  switch (row.status) {
    case "logged":
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-success">
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> Logged
        </span>
      );
    case "overdue":
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-danger">
          <AlertCircle className="h-3.5 w-3.5" /> Overdue · {formatDay(row.dueDate as string)}
        </span>
      );
    case "due-soon":
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-warning">
          <Clock className="h-3.5 w-3.5" />
          {row.daysLeft === 0 ? "Due today" : `Due in ${row.daysLeft} day${row.daysLeft === 1 ? "" : "s"}`}
        </span>
      );
    case "auto":
      return (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Repeat className="h-3.5 w-3.5" /> {row.dueDate ? `Auto on ${formatDay(row.dueDate)}` : "Auto"}
        </span>
      );
    case "auto-pending":
      return (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Repeat className="h-3.5 w-3.5" /> Auto-add pending
        </span>
      );
    case "upcoming":
      return (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" /> {row.dueDate ? `Due ${formatDay(row.dueDate)}` : "Upcoming"}
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-warning">
          <CircleDashed className="h-3.5 w-3.5" /> Missing
        </span>
      );
  }
}

export function RecurringSentinel({ items, loggableBills, onLogMissing }: RecurringSentinelProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const loggableTotal = loggableBills.reduce((sum, b) => sum + b.amount, 0);
  const loggedCount = items.filter((i) => i.status === "logged").length;
  const autoCount = items.filter((i) => i.status === "auto" || i.status === "auto-pending").length;
  const notLogged = items.length - loggedCount - autoCount;
  const overdue = items.filter((i) => i.status === "overdue").length;

  if (items.length === 0) {
    return (
      <section className="card p-5 sm:p-6">
        <h3 className="text-[15px] font-semibold">Monthly bills</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          No monthly bills yet. Add subscriptions and utilities in{" "}
          <Link href="/settings/bills" className="font-medium text-foreground underline underline-offset-2">
            Settings
          </Link>{" "}
          to see what&apos;s still unpaid each month.
        </p>
      </section>
    );
  }

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold">Monthly bills</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {[
              notLogged === 0 && autoCount === 0 ? "Everything is logged" : null,
              notLogged > 0 ? `${notLogged} not logged yet` : null,
              overdue > 0 ? `${overdue} overdue` : null,
              autoCount > 0 ? `${autoCount} automatic` : null,
            ]
              .filter(Boolean)
              .join(" · ") || "Nothing left to log"}
          </p>
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium tabular-nums">
          {loggedCount}/{items.length}
        </span>
      </div>

      <div className="mt-3 h-1.5 w-full rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${(loggedCount / items.length) * 100}%` }}
        />
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
        {items.map((row) => (
          <li
            key={row.id}
            className="flex items-center justify-between gap-3 border-b border-border/60 py-2.5 text-sm last:border-0 sm:[&:nth-last-child(2)]:border-0"
          >
            <span className={`truncate ${row.status === "logged" ? "" : "text-muted-foreground"}`}>{row.tag_name}</span>
            <StatusLabel row={row} />
          </li>
        ))}
      </ul>

      {loggableBills.length > 0 &&
        (isConfirming ? (
          <div className="mt-4 rounded-xl bg-secondary/60 p-4">
            <div className="text-sm font-medium">Log these bills?</div>
            <ul className="mt-2 space-y-1 text-sm">
              {loggableBills.map((b) => (
                <li key={b.id} className="flex justify-between gap-3">
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
            Log {loggableBills.length} unpaid bill{loggableBills.length === 1 ? "" : "s"}
          </button>
        ))}
    </section>
  );
}
