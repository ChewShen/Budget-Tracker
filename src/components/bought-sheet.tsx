"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { X } from "lucide-react";
import { categoryLabel } from "@/lib/categories";
import { isExpired, netTarget } from "@/lib/goals";
import { formatCurrency } from "@/lib/utils";
import type { NewTransaction } from "@/lib/budget-context";
import type { Category, Goal, Tag } from "@/lib/types";

interface BoughtSheetProps {
  goal: Goal | null; // open when set
  categories: Category[];
  tags: Tag[];
  onClose: () => void;
  onConfirm: (goal: Goal, expense: NewTransaction) => Promise<boolean>;
}

// Default the expense to Shopping (or the first category) and its first tag.
function defaultCategory(categories: Category[]) {
  return categories.find((c) => c.name.toLowerCase() === "shopping") || categories[0];
}

export function BoughtSheet({ goal, categories, tags, onClose, onConfirm }: BoughtSheetProps) {
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tagId, setTagId] = useState("");
  const [date, setDate] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!goal) return;
    setAmount(String(netTarget(goal)));
    const cat = defaultCategory(categories);
    setCategoryId(cat?.id ?? "");
    setTagId(tags.find((t) => t.category_id === cat?.id)?.id ?? "");
    setDate(format(new Date(), "yyyy-MM-dd"));
    // Reset only when a goal is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal?.id]);

  useEffect(() => {
    if (!goal) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goal, onClose]);

  if (!goal) return null;

  const paid = Math.round(parseFloat(amount) * 100) / 100;
  const categoryTags = tags.filter((t) => t.category_id === categoryId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(paid > 0) || !categoryId || !tagId) return;
    setIsBusy(true);
    const ok = await onConfirm(goal, {
      amount: paid,
      date,
      category_id: categoryId,
      tag_id: tagId,
      description: goal.name,
      is_one_off: true,
    });
    setIsBusy(false);
    if (ok) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Bought ${goal.name}`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-md animate-sheet-up overflow-y-auto rounded-t-3xl border bg-card px-5 pb-safe pt-3 shadow-2xl sm:rounded-3xl sm:pb-5"
      >
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-border sm:hidden" />
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[15px] font-semibold">Bought {goal.name}?</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Logs what you paid as a one-off expense.</p>
          </div>
          <button
            onClick={onClose}
            className="-mr-1.5 rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-4 pb-5">
          <label className="block">
            <span className="text-xs text-muted-foreground">Amount paid (RM)</span>
            <input
              autoFocus
              inputMode="decimal"
              value={amount}
              onChange={(e) => /^\d*\.?\d{0,2}$/.test(e.target.value) && setAmount(e.target.value)}
              className="field mt-1 text-lg font-semibold tabular-nums"
              aria-label="Amount paid"
            />
            {(goal.trade_in_value > 0 || goal.discounts.some((d) => !isExpired(d))) && (
              <span className="mt-1 block text-xs text-muted-foreground">
                {formatCurrency(goal.target_amount)} minus
                {goal.trade_in_value > 0 && ` ${formatCurrency(goal.trade_in_value)} trade-in`}
                {goal.trade_in_value > 0 && goal.discounts.some((d) => !isExpired(d)) && " and"}
                {goal.discounts.some((d) => !isExpired(d)) && " discounts"}. Change it if what you paid was different.
              </span>
            )}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-muted-foreground">Category</span>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setTagId(tags.find((t) => t.category_id === e.target.value)?.id ?? "");
                }}
                className="field mt-1"
                aria-label="Category"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {categoryLabel(c.name)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Tag</span>
              <select value={tagId} onChange={(e) => setTagId(e.target.value)} className="field mt-1" aria-label="Tag">
                {categoryTags.length === 0 && <option value="">No tags in this category</option>}
                {categoryTags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-xs text-muted-foreground">Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field mt-1" aria-label="Date" />
          </label>

          <button
            type="submit"
            disabled={isBusy || !(paid > 0) || !tagId}
            className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:opacity-40"
          >
            Mark as bought and log {paid > 0 ? formatCurrency(paid) : "expense"}
          </button>
        </form>
      </div>
    </div>
  );
}
