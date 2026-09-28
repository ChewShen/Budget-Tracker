"use client";

import { format, parseISO } from "date-fns";
import { ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { SavingPace } from "@/lib/savings";

interface EmergencyFundProps {
  liquid: number;
  averageSpend: number;
  spendMonths: string[]; // months the average is based on
  goalMonths: number;
  onChangeGoal: (months: number) => void;
  pace: SavingPace;
  reachBy: string | null; // YYYY-MM, null = not growing
}

const GOAL_OPTIONS = [3, 6, 9, 12];
const monthLabel = (m: string) => format(parseISO(`${m}-01`), "MMM yyyy");

export function EmergencyFundCard({
  liquid,
  averageSpend,
  spendMonths,
  goalMonths,
  onChangeGoal,
  pace,
  reachBy,
}: EmergencyFundProps) {
  if (averageSpend <= 0) {
    return (
      <section className="card p-5 sm:p-6">
        <h3 className="text-[15px] font-semibold">Emergency fund</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Needs one full month of expenses to work out how long your savings would last.
        </p>
      </section>
    );
  }

  const covered = liquid / averageSpend;
  const target = goalMonths * averageSpend;
  const progress = Math.min(1, liquid / target);
  const isReached = liquid >= target;

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold">Emergency fund</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Liquid money vs your average spending of {formatCurrency(averageSpend)}/month (
            {spendMonths.length === 1 ? monthLabel(spendMonths[0]) : `${spendMonths.length}-month average`})
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Goal
          <select
            value={goalMonths}
            onChange={(e) => onChangeGoal(Number(e.target.value))}
            className="rounded-lg border border-input bg-background px-2 py-1 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/30"
            aria-label="Emergency fund goal in months"
          >
            {GOAL_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m} months
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight tabular-nums">{covered.toFixed(1)}</span>
        <span className="text-sm text-muted-foreground">months of spending covered</span>
      </div>

      <div className="mt-4 h-2 w-full rounded-full bg-secondary" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to emergency fund goal">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>{formatCurrency(liquid)}</span>
        <span>Goal {formatCurrency(target)}</span>
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-xl bg-secondary/60 px-4 py-3 text-sm">
        {isReached ? (
          <>
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span>
              Goal reached. You have {formatCurrency(liquid - target)} more than {goalMonths} months of spending.
            </span>
          </>
        ) : reachBy ? (
          <span className="text-muted-foreground">
            {formatCurrency(target - liquid)} to go. At your pace of{" "}
            <span className="font-medium text-foreground">{formatCurrency(pace.perMonth)}/month</span>
            {pace.basis === "budget" ? " (take-home minus spending)" : ""}, you&apos;ll reach it by{" "}
            <span className="font-medium text-foreground">{monthLabel(reachBy)}</span>.
          </span>
        ) : (
          <span className="text-muted-foreground">
            {formatCurrency(target - liquid)} to go. Your liquid money isn&apos;t growing at the moment, so there&apos;s
            no date yet.
          </span>
        )}
      </p>
    </section>
  );
}
