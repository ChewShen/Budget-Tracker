"use client";

import { useState } from "react";
import { Plus, Repeat, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useBudget } from "@/lib/budget-context";
import { categoryLabel } from "@/lib/categories";
import { formatCurrency } from "@/lib/utils";
import { RecurringBill } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { dueDateIn } from "@/lib/bills";

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};
const toAmount = (text: string) => {
  const n = parseFloat(text);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
};

function BillForm({
  bill,
  onDone,
}: {
  bill?: RecurringBill; // editing when set, adding otherwise
  onDone: () => void;
}) {
  const { tags, categories, bills, transactions, addBill, updateBill, removeBill } = useBudget();
  const [tagId, setTagId] = useState(bill?.tag_id ?? "");
  const [amount, setAmount] = useState(bill?.expected_amount ? String(bill.expected_amount) : "");
  const [dueDay, setDueDay] = useState(bill?.due_day ? String(bill.due_day) : "");
  const [autoLog, setAutoLog] = useState(Boolean(bill?.auto_log));
  const canAuto = toAmount(amount) !== null && Boolean(dueDay);

  // Turning auto-add on after this month's due day: say when this month's expense will appear.
  const thisMonth = format(new Date(), "yyyy-MM");
  const pastDueUnpaid =
    autoLog &&
    canAuto &&
    tagId &&
    dueDateIn(thisMonth, Number(dueDay)) <= format(new Date(), "yyyy-MM-dd") &&
    !transactions.some((t) => t.tag_id === tagId && t.date.startsWith(thisMonth));
  const [isBusy, setIsBusy] = useState(false);

  const available = tags.filter((t) => t.id === bill?.tag_id || !bills.some((b) => b.tag_id === t.id));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagId) return;
    setIsBusy(true);
    const changes = {
      expected_amount: toAmount(amount),
      due_day: dueDay ? Number(dueDay) : null,
      auto_log: autoLog && canAuto,
    };
    const ok = bill ? await updateBill(bill.id, changes) : await addBill(tagId, changes);
    setIsBusy(false);
    if (ok) onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border bg-background/40 p-4">
      {!bill && (
        <label className="block">
          <span className="text-xs text-muted-foreground">Tag</span>
          <select required value={tagId} onChange={(e) => setTagId(e.target.value)} className="field mt-1">
            <option value="" disabled>
              Choose a tag
            </option>
            {categories.map((c) => {
              const group = available.filter((t) => t.category_id === c.id);
              return group.length ? (
                <optgroup key={c.id} label={categoryLabel(c.name)}>
                  {group.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </optgroup>
              ) : null;
            })}
          </select>
        </label>
      )}
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-muted-foreground">Expected amount (optional)</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Last month's amount"
            value={amount}
            onChange={(e) => /^\d*\.?\d{0,2}$/.test(e.target.value) && setAmount(e.target.value)}
            className="field mt-1 tabular-nums"
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">Due day (optional)</span>
          <select value={dueDay} onChange={(e) => setDueDay(e.target.value)} className="field mt-1">
            <option value="">No due day</option>
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {ordinal(d)} of the month
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={autoLog && canAuto}
        disabled={!canAuto}
        onClick={() => setAutoLog((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition disabled:opacity-50"
      >
        <span>
          <span className="block text-sm font-medium">Add automatically</span>
          <span className="block text-xs text-muted-foreground">
            {canAuto
              ? "Adds the expected amount on the due day each month, unless it's already logged."
              : "Set an expected amount and a due day to turn this on."}
          </span>
        </span>
        <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${autoLog && canAuto ? "bg-primary" : "bg-secondary"}`}>
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-background shadow transition-all ${
              autoLog && canAuto ? "left-[18px]" : "left-0.5"
            }`}
          />
        </span>
      </button>
      {pastDueUnpaid && (
        <p className="text-xs text-muted-foreground">
          This month&apos;s is already due, so it will be added{" "}
          {isSupabaseConfigured ? "at the next daily run (just after midnight)" : "next time the app opens"}.
        </p>
      )}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {bill && (
          <button
            type="button"
            onClick={async () => (await removeBill(bill.id)) && onDone()}
            className="mr-auto flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-danger transition hover:bg-danger/10"
          >
            <Trash2 className="h-4 w-4" /> Remove bill
          </button>
        )}
        <button
          type="button"
          onClick={onDone}
          className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isBusy || !tagId}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:opacity-40"
        >
          {bill ? "Save" : "Add bill"}
        </button>
      </div>
    </form>
  );
}

export function BillsManager() {
  const { bills, tags, categories } = useBudget();
  const [editing, setEditing] = useState<string | "new" | null>(null);

  const rows = bills
    .map((bill) => {
      const tag = tags.find((t) => t.id === bill.tag_id);
      const category = categories.find((c) => c.id === tag?.category_id);
      return { bill, tagName: tag?.name ?? "Unknown tag", categoryName: category?.name };
    })
    .sort((a, b) => a.tagName.localeCompare(b.tagName));

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold">Monthly bills</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Tags you pay every month. Overview shows which are still unpaid.
          </p>
        </div>
        {editing !== "new" && (
          <button
            onClick={() => setEditing("new")}
            className="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition hover:bg-secondary"
          >
            <Plus className="h-4 w-4" /> Add bill
          </button>
        )}
      </div>

      {editing === "new" && (
        <div className="mt-4">
          <BillForm onDone={() => setEditing(null)} />
        </div>
      )}

      {rows.length === 0 && editing !== "new" ? (
        <p className="mt-4 text-sm text-muted-foreground">No bills yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border/70">
          {rows.map(({ bill, tagName, categoryName }) =>
            editing === bill.id ? (
              <li key={bill.id} className="py-3">
                <div className="mb-2 text-sm font-medium">{tagName}</div>
                <BillForm bill={bill} onDone={() => setEditing(null)} />
              </li>
            ) : (
              <li key={bill.id}>
                <button
                  onClick={() => setEditing(bill.id)}
                  className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-secondary/40"
                  aria-label={`Edit bill ${tagName}`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                      {tagName}
                      {bill.auto_log && (
                        <span className="flex shrink-0 items-center gap-0.5 rounded-full border px-1.5 py-px text-[10px] font-medium text-muted-foreground">
                          <Repeat className="h-2.5 w-2.5" /> Auto
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-muted-foreground">{categoryLabel(categoryName)}</span>
                  </span>
                  <span className="shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                    {bill.expected_amount ? formatCurrency(bill.expected_amount) : "Last month's amount"}
                    <span className="block">{bill.due_day ? `Due ${ordinal(bill.due_day)}` : "No due day"}</span>
                  </span>
                </button>
              </li>
            )
          )}
        </ul>
      )}
    </section>
  );
}
