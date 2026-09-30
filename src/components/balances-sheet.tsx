"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, Settings2, X } from "lucide-react";
import type { DraftLine } from "@/lib/savings";
import type { SavingsBalance } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface BalancesSheetProps {
  isOpen: boolean;
  monthLabel: string; // e.g. "30 Sep 2026"
  lines: DraftLine[]; // one per account, pre-filled (carried forward from the last record)
  previousLabel?: string; // e.g. "Aug", shown next to the earlier balance
  onClose: () => void;
  onSave: (lines: Pick<SavingsBalance, "account_id" | "balance" | "rate">[]) => void;
}

// Money fields are edited as strings so they can be cleared and typed freely ("", "12.", "0.05").
const toText = (n: number) => (n ? String(Math.round(n * 100) / 100) : "");
const toNumber = (text: string) => {
  const n = parseFloat(text.replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
const isDecimalInput = (text: string) => /^\d*\.?\d{0,4}$/.test(text.replace(/,/g, ""));

type Texts = Record<string, { balance: string; rate: string }>; // by account id

const textsFrom = (lines: DraftLine[]): Texts =>
  Object.fromEntries(lines.map((l) => [l.account.id, { balance: toText(l.balance), rate: toText(l.rate * 100) }]));

export function BalancesSheet({ isOpen, monthLabel, lines, previousLabel, onClose, onSave }: BalancesSheetProps) {
  const [values, setValues] = useState<Texts>(() => textsFrom(lines));
  const [initial, setInitial] = useState<Texts>(() => textsFrom(lines));

  useEffect(() => {
    if (!isOpen) return;
    const texts = textsFrom(lines);
    setValues(texts);
    setInitial(texts);
    // Reset only when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const isDirty = lines.some(
    ({ account: { id } }) =>
      values[id]?.balance !== initial[id]?.balance || values[id]?.rate !== initial[id]?.rate
  );

  const requestClose = () => {
    if (isDirty && !window.confirm("Discard your changes?")) return;
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && requestClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!isOpen) return null;

  const set = (id: string, field: "balance" | "rate", text: string) => {
    if (isDecimalInput(text)) setValues((v) => ({ ...v, [id]: { ...v[id], [field]: text } }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      lines.map(({ account }) => ({
        account_id: account.id,
        balance: toNumber(values[account.id]?.balance ?? ""),
        rate: account.kind === "liquid" ? toNumber(values[account.id]?.rate ?? "") / 100 : 0,
      }))
    );
  };

  const total = lines.reduce((sum, l) => sum + toNumber(values[l.account.id]?.balance ?? ""), 0);

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={requestClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Update balances"
        onClick={(e) => e.stopPropagation()}
        className="max-h-sheet w-full max-w-md animate-sheet-up overflow-y-auto rounded-t-3xl border bg-card px-5 pb-safe pt-3 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:pb-5"
      >
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-border sm:hidden" />

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[15px] font-semibold">Update balances</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Balances on {monthLabel}</p>
          </div>
          <button
            onClick={requestClose}
            className="-mr-1.5 rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3 pb-5">
          {lines.map(({ account, previous }) => {
            const id = `balance-${account.id}`;
            return (
              <div key={account.id} className="rounded-xl bg-secondary/50 p-4">
                <label htmlFor={id} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  {account.name}
                  {account.kind === "locked" && <Lock className="h-3 w-3" aria-label="Locked" />}
                </label>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-sm text-muted-foreground">RM</span>
                  <input
                    id={id}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0"
                    value={values[account.id]?.balance ?? ""}
                    onChange={(e) => set(account.id, "balance", e.target.value)}
                    className="w-full bg-transparent text-xl font-semibold tabular-nums tracking-tight outline-none placeholder:text-muted-foreground/40"
                  />
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    {previous !== undefined && previousLabel
                      ? `${previousLabel}: ${formatCurrency(previous)}`
                      : "No earlier record"}
                  </span>
                  {account.kind === "liquid" && (
                    <label className="flex items-center gap-1.5">
                      Interest
                      <input
                        type="text"
                        inputMode="decimal"
                        value={values[account.id]?.rate ?? ""}
                        onChange={(e) => set(account.id, "rate", e.target.value)}
                        placeholder="0"
                        className="w-16 rounded-lg border border-input bg-background px-2 py-1 text-right font-medium tabular-nums text-foreground outline-none focus:ring-2 focus:ring-ring/30"
                        aria-label={`${account.name} interest rate`}
                      />
                      % p.a.
                    </label>
                  )}
                </div>
              </div>
            );
          })}

          <Link
            href="/settings/savings"
            onClick={(e) => {
              if (isDirty && !window.confirm("Discard your changes?")) e.preventDefault();
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed py-2.5 text-xs text-muted-foreground transition hover:border-foreground/40 hover:text-foreground"
          >
            <Settings2 className="h-3.5 w-3.5" /> Add, rename or archive accounts
          </Link>

          <div className="flex items-center justify-between px-1 pt-1 text-sm">
            <span className="text-muted-foreground">Net worth</span>
            <span className="font-semibold tabular-nums">{formatCurrency(total)}</span>
          </div>

          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition hover:brightness-95 active:scale-[0.98]"
          >
            Save balances
          </button>
        </form>
      </div>
    </div>
  );
}
