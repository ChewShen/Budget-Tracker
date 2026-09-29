"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { discountAmount, isExpired } from "@/lib/goals";
import type { GoalInput } from "@/lib/budget-context";
import type { Goal, GoalDiscount } from "@/lib/types";

// Editable discount row (value kept as text while typing).
type DiscountRow = { id: string; label: string; kind: GoalDiscount["kind"]; value: string; expires_on: string };
const toRow = (d: GoalDiscount): DiscountRow => ({
  id: d.id,
  label: d.label,
  kind: d.kind,
  value: String(d.value),
  expires_on: d.expires_on ?? "",
});

interface GoalSheetProps {
  isOpen: boolean;
  goal: Goal | null; // editing when set, creating otherwise
  onClose: () => void;
  onSave: (input: GoalInput) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

const isMoney = (t: string) => /^\d*\.?\d{0,2}$/.test(t);
const toMoney = (t: string) => {
  const n = parseFloat(t);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
};

export function GoalSheet({ isOpen, goal, onClose, onSave, onDelete }: GoalSheetProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [hasTradeIn, setHasTradeIn] = useState(false);
  const [tradeInName, setTradeInName] = useState("");
  const [tradeInValue, setTradeInValue] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [link, setLink] = useState("");
  const [discounts, setDiscounts] = useState<DiscountRow[]>([]);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(goal?.name ?? "");
    setPrice(goal ? String(goal.target_amount) : "");
    setHasTradeIn(Boolean(goal && goal.trade_in_value > 0));
    setTradeInName(goal?.trade_in_name ?? "");
    setTradeInValue(goal && goal.trade_in_value > 0 ? String(goal.trade_in_value) : "");
    setTargetDate(goal?.target_date ?? "");
    setLink(goal?.link ?? "");
    setDiscounts((goal?.discounts ?? []).map(toRow));
    // Reset only when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const priceNum = toMoney(price);
  const tradeInNum = hasTradeIn ? toMoney(tradeInValue) : 0;
  // Discounts as saved; rows without a value are ignored.
  const parsedDiscounts: GoalDiscount[] = discounts
    .filter((d) => toMoney(d.value) > 0)
    .map((d) => ({
      id: d.id,
      label: d.label.trim() || (d.kind === "percent" ? "Discount" : "Voucher"),
      kind: d.kind,
      value: toMoney(d.value),
      expires_on: d.expires_on || null,
    }));
  const offOf = (d: GoalDiscount) => discountAmount(d, priceNum);
  const activeDiscounts = parsedDiscounts.filter((d) => !isExpired(d));
  const discountTotal = activeDiscounts.reduce((sum, d) => sum + offOf(d), 0);
  const net = Math.max(0, priceNum - tradeInNum - discountTotal);
  const percentTooHigh = parsedDiscounts.some((d) => d.kind === "percent" && d.value > 100);
  const tradeInTooHigh = priceNum > 0 && tradeInNum + discountTotal >= priceNum && (tradeInNum > 0 || discountTotal > 0);
  const invalid = tradeInTooHigh || percentTooHigh;

  const updateRow = (id: string, changes: Partial<DiscountRow>) =>
    setDiscounts((rows) => rows.map((r) => (r.id === id ? { ...r, ...changes } : r)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || priceNum <= 0 || invalid) return;
    setIsBusy(true);
    // Stamp the trade-in date when the value is new or changed, so the card can say how fresh it is.
    const valueChanged = !goal || goal.trade_in_value !== tradeInNum;
    const ok = await onSave({
      name: name.trim(),
      target_amount: priceNum,
      trade_in_name: hasTradeIn ? tradeInName.trim() || null : null,
      trade_in_value: tradeInNum,
      trade_in_updated: tradeInNum > 0 ? (valueChanged ? format(new Date(), "yyyy-MM-dd") : goal?.trade_in_updated ?? null) : null,
      target_date: targetDate || null,
      link: link.trim() || null,
      discounts: parsedDiscounts,
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
        aria-label={goal ? "Edit goal" : "New goal"}
        onClick={(e) => e.stopPropagation()}
        className="max-h-sheet w-full max-w-md animate-sheet-up overflow-y-auto rounded-t-3xl border bg-card px-5 pb-safe pt-3 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:pb-5"
      >
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-border sm:hidden" />
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">{goal ? "Edit goal" : "New goal"}</h2>
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
            <span className="text-xs text-muted-foreground">What are you saving for?</span>
            <input
              autoFocus
              required
              maxLength={60}
              placeholder="e.g. iPhone 17 Pro"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field mt-1"
              aria-label="Goal name"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-muted-foreground">Price (RM)</span>
              <input
                required
                inputMode="decimal"
                placeholder="0"
                value={price}
                onChange={(e) => isMoney(e.target.value) && setPrice(e.target.value)}
                className="field mt-1 tabular-nums"
                aria-label="Price"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Target date (optional)</span>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="field mt-1"
                aria-label="Target date"
              />
            </label>
          </div>

          <div className="rounded-xl border p-3.5">
            <button
              type="button"
              role="switch"
              aria-checked={hasTradeIn}
              onClick={() => setHasTradeIn((v) => !v)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <span>
                <span className="block text-sm font-medium">Trading something in</span>
                <span className="block text-xs text-muted-foreground">
                  Its value comes off what you need to save
                </span>
              </span>
              <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${hasTradeIn ? "bg-primary" : "bg-secondary"}`}>
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-background shadow transition-all ${
                    hasTradeIn ? "left-[18px]" : "left-0.5"
                  }`}
                />
              </span>
            </button>
            {hasTradeIn && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-muted-foreground">Item</span>
                  <input
                    maxLength={60}
                    placeholder="e.g. iPhone 13"
                    value={tradeInName}
                    onChange={(e) => setTradeInName(e.target.value)}
                    className="field mt-1"
                    aria-label="Trade-in item"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Expected value (RM)</span>
                  <input
                    inputMode="decimal"
                    placeholder="0"
                    value={tradeInValue}
                    onChange={(e) => isMoney(e.target.value) && setTradeInValue(e.target.value)}
                    className="field mt-1 tabular-nums"
                    aria-label="Trade-in value"
                  />
                </label>
              </div>
            )}
          </div>

          <div className="rounded-xl border p-3.5">
            <div className="flex items-center justify-between gap-3">
              <span>
                <span className="block text-sm font-medium">Discounts & vouchers</span>
                <span className="block text-xs text-muted-foreground">Promos, vouchers or cashback you expect to use</span>
              </span>
              <button
                type="button"
                onClick={() =>
                  setDiscounts((rows) => [
                    ...rows,
                    { id: `disc-${Date.now()}`, label: "", kind: "amount", value: "", expires_on: "" },
                  ])
                }
                className="flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition hover:bg-secondary"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
            {discounts.length > 0 && (
              <ul className="mt-3 space-y-3">
                {discounts.map((d, i) => (
                  <li key={d.id} className="grid grid-cols-[1fr_auto] gap-2 rounded-lg bg-secondary/50 p-2.5">
                    <input
                      maxLength={40}
                      placeholder="e.g. 11.11 voucher"
                      value={d.label}
                      onChange={(e) => updateRow(d.id, { label: e.target.value })}
                      className="field py-2"
                      aria-label={`Discount ${i + 1} name`}
                    />
                    <button
                      type="button"
                      onClick={() => setDiscounts((rows) => rows.filter((r) => r.id !== d.id))}
                      className="rounded-full p-2 text-muted-foreground transition hover:bg-danger/10 hover:text-danger"
                      aria-label={`Remove discount ${i + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="col-span-2 grid grid-cols-[auto_1fr_1fr] gap-2">
                      <div className="flex rounded-xl border border-input p-0.5 text-xs font-medium" role="radiogroup" aria-label={`Discount ${i + 1} type`}>
                        {(["amount", "percent"] as const).map((k) => (
                          <button
                            key={k}
                            type="button"
                            role="radio"
                            aria-checked={d.kind === k}
                            onClick={() => updateRow(d.id, { kind: k })}
                            className={cn(
                              "rounded-lg px-2.5 transition",
                              d.kind === k ? "bg-foreground text-background" : "text-muted-foreground"
                            )}
                          >
                            {k === "amount" ? "RM" : "%"}
                          </button>
                        ))}
                      </div>
                      <input
                        inputMode="decimal"
                        placeholder={d.kind === "percent" ? "5" : "200"}
                        value={d.value}
                        onChange={(e) => isMoney(e.target.value) && updateRow(d.id, { value: e.target.value })}
                        className="field py-2 tabular-nums"
                        aria-label={`Discount ${i + 1} value`}
                      />
                      <input
                        type="date"
                        value={d.expires_on}
                        onChange={(e) => updateRow(d.id, { expires_on: e.target.value })}
                        className="field py-2 text-xs"
                        aria-label={`Discount ${i + 1} expiry date (optional)`}
                        title="Expiry date (optional)"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <label className="block">
            <span className="text-xs text-muted-foreground">Link (optional)</span>
            <input
              type="url"
              placeholder="https://…"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="field mt-1"
              aria-label="Link"
            />
          </label>

          {priceNum > 0 && (
            <div className="rounded-xl bg-secondary/60 px-4 py-3 text-sm">
              {percentTooHigh ? (
                <span className="text-danger">A percentage discount can&apos;t be more than 100%.</span>
              ) : tradeInTooHigh ? (
                <span className="text-danger">The trade-in and discounts must add up to less than the price.</span>
              ) : (
                <>
                  You&apos;ll need to save <span className="font-semibold tabular-nums">{formatCurrency(net)}</span>
                  {(tradeInNum > 0 || activeDiscounts.length > 0) && (
                    <span className="block text-xs text-muted-foreground tabular-nums">
                      {formatCurrency(priceNum)}
                      {tradeInNum > 0 && ` − ${formatCurrency(tradeInNum)} trade-in`}
                      {activeDiscounts.map((d) => ` − ${formatCurrency(offOf(d))} ${d.label}`).join("")}
                    </span>
                  )}
                  {parsedDiscounts.length > activeDiscounts.length && (
                    <span className="block text-xs text-warning">Expired discounts aren&apos;t counted.</span>
                  )}
                </>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            {goal && (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm(`Delete "${goal.name}" and its history?`) && (await onDelete(goal.id))) onClose();
                }}
                className="flex h-12 shrink-0 items-center gap-1.5 rounded-full border px-5 text-sm font-medium text-danger transition hover:bg-danger/10"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            )}
            <button
              type="submit"
              disabled={isBusy || !name.trim() || priceNum <= 0 || invalid}
              className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:opacity-40"
            >
              {goal ? "Save changes" : "Add goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
