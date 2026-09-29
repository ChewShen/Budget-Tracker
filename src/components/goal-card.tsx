"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ArrowDown, ArrowUp, ExternalLink, History, Pencil, Plus, Trash2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { GoalProgress } from "@/lib/goals";
import type { Goal, GoalContribution } from "@/lib/types";

interface GoalCardProps {
  goal: Goal;
  progress: GoalProgress;
  contributions: GoalContribution[]; // this goal's, any order
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (direction: -1 | 1) => void;
  onEdit: () => void;
  onAddMoney: (amount: number, note?: string) => Promise<boolean>;
  onDeleteContribution: (id: string) => Promise<boolean>;
  actions?: React.ReactNode; // extra buttons (e.g. "Bought it")
}

const QUICK = [50, 100, 200, 500];
const monthName = (ym: string) => format(parseISO(`${ym}-01`), "MMM yyyy");
const dayName = (d: string) => format(parseISO(d), "d MMM");

function PaceLine({ goal, p }: { goal: Goal; p: GoalProgress }) {
  if (p.isReady) return <span className="font-medium text-success">Ready: you&apos;ve saved enough.</span>;
  if (p.neededPerMonth !== null && goal.target_date) {
    const onTrack = p.pacePerMonth >= p.neededPerMonth;
    return (
      <span>
        Set aside <span className="font-medium text-foreground tabular-nums">{formatCurrency(p.neededPerMonth)}/month</span>{" "}
        to make it by {format(parseISO(goal.target_date), "d MMM yyyy")}.{" "}
        {p.pacePerMonth > 0 && (
          <span className={onTrack ? "text-success" : "text-warning"}>
            {onTrack ? "On track" : "Behind"} (you&apos;re averaging {formatCurrency(p.pacePerMonth)}/month).
          </span>
        )}
      </span>
    );
  }
  if (p.readyBy)
    return (
      <span>
        At <span className="font-medium text-foreground tabular-nums">{formatCurrency(p.pacePerMonth)}/month</span>,
        ready by <span className="font-medium text-foreground">{monthName(p.readyBy)}</span>.
      </span>
    );
  return <span>Nothing set aside in the last 3 months.</span>;
}

export function GoalCard({
  goal,
  progress: p,
  contributions,
  canMoveUp,
  canMoveDown,
  onMove,
  onEdit,
  onAddMoney,
  onDeleteContribution,
  actions,
}: GoalCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const submit = async (sign: 1 | -1) => {
    const value = Math.round(parseFloat(amount) * 100) / 100;
    if (!Number.isFinite(value) || value <= 0) return;
    setIsBusy(true);
    const ok = await onAddMoney(sign * value, note.trim() || undefined);
    setIsBusy(false);
    if (ok) {
      setAmount("");
      setNote("");
      setIsAdding(false);
    }
  };

  const history = [...contributions].sort((a, b) => b.date.localeCompare(a.date));
  // e.g. "iPhone 13, checked 15 Aug": trade-in values drop, so show when it was last checked.
  const tradeInDetails = [goal.trade_in_name, goal.trade_in_updated && `checked ${dayName(goal.trade_in_updated)}`]
    .filter(Boolean)
    .join(", ");

  return (
    <section className="card p-5 sm:p-6" aria-label={goal.name}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold">
            <span className="truncate">{goal.name}</span>
            {goal.link && (
              <a
                href={goal.link}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-muted-foreground transition hover:text-foreground"
                aria-label={`Open link for ${goal.name}`}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {goal.target_date ? `By ${format(parseISO(goal.target_date), "d MMM yyyy")}` : "No target date"}
          </p>
        </div>
        <div className="flex shrink-0 items-center">
          {[
            { dir: -1 as const, can: canMoveUp, Icon: ArrowUp, label: "Move up" },
            { dir: 1 as const, can: canMoveDown, Icon: ArrowDown, label: "Move down" },
          ].map(({ dir, can, Icon, label }) => (
            <button
              key={label}
              onClick={() => onMove(dir)}
              disabled={!can}
              className="rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label={`${label}: ${goal.name}`}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
          <button
            onClick={onEdit}
            className="rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            aria-label={`Edit ${goal.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-3">
        <span className="text-2xl font-semibold tracking-tight tabular-nums">{formatCurrency(p.saved)}</span>
        <span className="text-sm text-muted-foreground tabular-nums">
          of {formatCurrency(p.net)} · {Math.round(p.ratio * 100)}%
        </span>
      </div>
      <div
        className="mt-2 h-2 w-full rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={Math.round(p.ratio * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${goal.name} progress`}
      >
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${p.ratio * 100}%` }} />
      </div>

      {goal.trade_in_value > 0 && (
        <p className="mt-3 text-xs text-muted-foreground tabular-nums">
          {formatCurrency(goal.target_amount)} − trade-in {formatCurrency(goal.trade_in_value)}
          {tradeInDetails && ` (${tradeInDetails})`}
        </p>
      )}

      <p className="mt-3 text-sm text-muted-foreground">
        <PaceLine goal={goal} p={p} />
      </p>

      {isAdding ? (
        <div className="mt-4 space-y-3 rounded-xl bg-secondary/50 p-4">
          <div className="flex flex-wrap gap-1.5">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setAmount(String(q))}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  amount === String(q) ? "border-foreground/80" : "hover:bg-secondary"
                )}
              >
                RM {q}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-[1fr_1.4fr] gap-2">
            <input
              autoFocus
              inputMode="decimal"
              placeholder="Amount"
              value={amount}
              onChange={(e) => /^\d*\.?\d{0,2}$/.test(e.target.value) && setAmount(e.target.value)}
              className="field tabular-nums"
              aria-label={`Amount for ${goal.name}`}
            />
            <input
              maxLength={80}
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="field"
              aria-label="Note"
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              onClick={() => setIsAdding(false)}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={() => submit(-1)}
              disabled={isBusy || !parseFloat(amount)}
              className="rounded-full border px-3.5 py-2 text-sm font-medium transition hover:bg-secondary disabled:opacity-40"
            >
              Take back
            </button>
            <button
              onClick={() => submit(1)}
              disabled={isBusy || !parseFloat(amount)}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:opacity-40"
            >
              Set aside
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-95"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} /> Add money
          </button>
          {actions}
          {history.length > 0 && (
            <button
              onClick={() => setShowHistory((v) => !v)}
              aria-expanded={showHistory}
              className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <History className="h-3.5 w-3.5" /> History ({history.length})
            </button>
          )}
        </div>
      )}

      {showHistory && !isAdding && (
        <ul className="mt-3 divide-y divide-border/70 border-t">
          {history.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-2 text-sm">
              <span className="w-14 shrink-0 text-xs text-muted-foreground">{dayName(c.date)}</span>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{c.note || (c.amount > 0 ? "Set aside" : "Taken back")}</span>
              <span className={cn("shrink-0 tabular-nums", c.amount < 0 && "text-danger")}>
                {c.amount > 0 ? "+" : "−"}
                {formatCurrency(Math.abs(c.amount))}
              </span>
              <button
                onClick={() => onDeleteContribution(c.id)}
                className="shrink-0 rounded-full p-1.5 text-muted-foreground/60 transition hover:bg-danger/10 hover:text-danger"
                aria-label={`Delete ${formatCurrency(Math.abs(c.amount))} on ${dayName(c.date)}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
