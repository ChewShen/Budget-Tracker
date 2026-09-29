"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Trash2, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { GoalInput } from "@/lib/budget-context";
import type { Goal } from "@/lib/types";

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
  const net = Math.max(0, priceNum - tradeInNum);
  const tradeInTooHigh = hasTradeIn && tradeInNum > 0 && tradeInNum >= priceNum;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || priceNum <= 0 || tradeInTooHigh) return;
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
        className="max-h-[92dvh] w-full max-w-md animate-sheet-up overflow-y-auto rounded-t-3xl border bg-card px-5 pb-safe pt-3 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:pb-5"
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
              {tradeInTooHigh ? (
                <span className="text-danger">The trade-in value must be less than the price.</span>
              ) : (
                <>
                  You&apos;ll need to save <span className="font-semibold tabular-nums">{formatCurrency(net)}</span>
                  {tradeInNum > 0 && (
                    <span className="text-muted-foreground">
                      {" "}
                      ({formatCurrency(priceNum)} − {formatCurrency(tradeInNum)} trade-in)
                    </span>
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
              disabled={isBusy || !name.trim() || priceNum <= 0 || tradeInTooHigh}
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
