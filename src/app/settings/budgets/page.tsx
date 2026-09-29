"use client";

import { useEffect, useState } from "react";
import { format, parseISO, subMonths } from "date-fns";
import { useBudget } from "@/lib/budget-context";
import { CategoryIcon, categoryLabel } from "@/lib/categories";
import { formatCurrency } from "@/lib/utils";

const toLimit = (text: string) => {
  const n = parseFloat(text);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
};

export default function BudgetsSettingsPage() {
  const { categories, budgets, transactions, setBudget, showToast } = useBudget();
  const [values, setValues] = useState<Record<string, string>>({});
  const [isBusy, setIsBusy] = useState(false);

  const initial = (categoryId: string) => {
    const b = budgets.find((x) => x.category_id === categoryId);
    return b ? String(b.monthly_limit) : "";
  };
  useEffect(() => {
    setValues(Object.fromEntries(categories.map((c) => [c.id, initial(c.id)])));
    // Reset when the saved budgets or categories change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgets, categories]);

  // Last full month's spending per category, to help pick a sensible limit.
  const lastMonth = format(subMonths(new Date(), 1), "yyyy-MM");
  const lastMonthLabel = format(parseISO(`${lastMonth}-01`), "MMM");
  const spentLastMonth = (categoryId: string) =>
    transactions.filter((t) => t.category_id === categoryId && t.date.startsWith(lastMonth)).reduce((s, t) => s + t.amount, 0);

  const changed = categories.filter((c) => (values[c.id] ?? "") !== initial(c.id));
  const total = categories.reduce((sum, c) => sum + (toLimit(values[c.id] ?? "") ?? 0), 0);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    let ok = true;
    for (const c of changed) ok = (await setBudget(c.id, toLimit(values[c.id] ?? ""))) && ok;
    setIsBusy(false);
    if (ok) showToast({ tone: "default", message: `Saved ${changed.length} budget${changed.length === 1 ? "" : "s"}` });
  };

  return (
    <form onSubmit={save} className="card p-5 sm:p-6">
      <p className="text-sm text-muted-foreground">
        A monthly limit per category. Leave blank for no budget. Overview shows how each is tracking.
      </p>

      <ul className="mt-4 divide-y divide-border/70">
        {categories.map((c) => {
          const last = spentLastMonth(c.id);
          return (
            <li key={c.id} className="flex items-center gap-3 py-2.5">
              <CategoryIcon name={c.name} className="h-8 w-8" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{categoryLabel(c.name)}</span>
                <span className="block text-xs text-muted-foreground tabular-nums">
                  {last > 0 ? `${lastMonthLabel}: ${formatCurrency(last)}` : `Nothing spent in ${lastMonthLabel}`}
                </span>
              </span>
              <label className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
                RM
                <input
                  inputMode="decimal"
                  placeholder="No budget"
                  value={values[c.id] ?? ""}
                  onChange={(e) =>
                    /^\d*\.?\d{0,2}$/.test(e.target.value) && setValues((v) => ({ ...v, [c.id]: e.target.value }))
                  }
                  className="field w-28 py-2 text-right tabular-nums"
                  aria-label={`${categoryLabel(c.name)} monthly budget`}
                />
              </label>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <span className="text-sm">
          Total <span className="font-semibold tabular-nums">{formatCurrency(total)}</span>
          <span className="text-muted-foreground"> / month</span>
        </span>
        <button
          type="submit"
          disabled={isBusy || changed.length === 0}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:opacity-40"
        >
          {changed.length ? `Save ${changed.length} change${changed.length === 1 ? "" : "s"}` : "Saved"}
        </button>
      </div>
    </form>
  );
}
