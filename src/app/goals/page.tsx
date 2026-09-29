"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Plus, Target } from "lucide-react";
import { useBudget } from "@/lib/budget-context";
import { GoalCard } from "@/components/goal-card";
import { GoalSheet } from "@/components/goal-sheet";
import { earmarkedTotal, goalProgress, netTarget } from "@/lib/goals";
import { formatCurrency } from "@/lib/utils";
import type { Goal } from "@/lib/types";

export default function GoalsPage() {
  const { goals, goalContributions, addGoal, updateGoal, deleteGoal, moveGoal, addContribution, deleteContribution } =
    useBudget();
  const [sheetGoal, setSheetGoal] = useState<Goal | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const active = goals.filter((g) => g.status === "active").sort((a, b) => a.priority - b.priority);
  const completed = goals
    .filter((g) => g.status === "bought")
    .sort((a, b) => (b.bought_at || "").localeCompare(a.bought_at || ""));
  const setAside = earmarkedTotal(goals, goalContributions);
  const stillToSave = active.reduce((sum, g) => sum + goalProgress(g, goalContributions).remaining, 0);

  const openSheet = (goal: Goal | null) => {
    setSheetGoal(goal);
    setIsSheetOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
          <p className="mt-1 text-sm text-muted-foreground">Things you&apos;re saving for</p>
        </div>
        <button
          onClick={() => openSheet(null)}
          className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-95 active:scale-[0.97]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} /> New goal
        </button>
      </div>

      {active.length > 0 && (
        <section className="card grid grid-cols-2 gap-4 p-5 sm:grid-cols-3 sm:p-6">
          <div>
            <div className="eyebrow">Set aside</div>
            <div className="mt-1 text-xl font-semibold tracking-tight tabular-nums">{formatCurrency(setAside)}</div>
          </div>
          <div>
            <div className="eyebrow">Still to save</div>
            <div className="mt-1 text-xl font-semibold tracking-tight tabular-nums">{formatCurrency(stillToSave)}</div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <div className="eyebrow">Active goals</div>
            <div className="mt-1 text-xl font-semibold tracking-tight tabular-nums">{active.length}</div>
          </div>
        </section>
      )}

      {active.length === 0 && (
        <section className="card flex flex-col items-center px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Target className="h-5 w-5" />
          </span>
          <h3 className="mt-4 text-[15px] font-semibold">No goals yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Add something you&apos;re saving for, like a new phone or a trip. If you&apos;re trading something in, its
            value comes off the target.
          </p>
          <button
            onClick={() => openSheet(null)}
            className="mt-5 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-95"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} /> New goal
          </button>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        {active.map((goal, i) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            progress={goalProgress(goal, goalContributions)}
            contributions={goalContributions.filter((c) => c.goal_id === goal.id)}
            canMoveUp={i > 0}
            canMoveDown={i < active.length - 1}
            onMove={(dir) => moveGoal(goal.id, dir)}
            onEdit={() => openSheet(goal)}
            onAddMoney={(amount, note) => addContribution(goal.id, amount, note)}
            onDeleteContribution={deleteContribution}
          />
        ))}
      </div>

      {completed.length > 0 && (
        <section className="card p-5 sm:p-6">
          <h3 className="text-[15px] font-semibold">Completed</h3>
          <ul className="mt-3 divide-y divide-border/70">
            {completed.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="truncate">{g.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {formatCurrency(netTarget(g))}
                  {g.bought_at ? ` · bought ${format(parseISO(g.bought_at), "d MMM yyyy")}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <GoalSheet
        isOpen={isSheetOpen}
        goal={sheetGoal}
        onClose={() => setIsSheetOpen(false)}
        onSave={async (input) => (sheetGoal ? updateGoal(sheetGoal.id, input) : Boolean(await addGoal(input)))}
        onDelete={deleteGoal}
      />
    </div>
  );
}
