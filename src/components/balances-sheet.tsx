"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { MonthlySavings } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface BalancesSheetProps {
  isOpen: boolean;
  monthLabel: string; // e.g. "30 Sep 2026"
  draft: MonthlySavings;
  previous?: MonthlySavings;
  previousLabel?: string; // e.g. "Aug", shown next to the earlier balance
  onClose: () => void;
  onSave: (snapshot: MonthlySavings) => void;
}

type Field = "main_checking" | "gx_bank" | "ryt_bank" | "epf_locked" | "gx_rate" | "ryt_rate";

const ACCOUNTS: { key: Field; label: string; rateKey?: Field }[] = [
  { key: "main_checking", label: "Main checking" },
  { key: "gx_bank", label: "GXBank", rateKey: "gx_rate" },
  { key: "ryt_bank", label: "RYT / Rize", rateKey: "ryt_rate" },
  { key: "epf_locked", label: "EPF & locked" },
];

// Money fields are edited as strings so they can be cleared and typed freely ("", "12.", "0.05").
const toText = (n: number) => (n ? String(Math.round(n * 100) / 100) : "");
const toNumber = (text: string) => {
  const n = parseFloat(text.replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
const isDecimalInput = (text: string) => /^\d*\.?\d{0,4}$/.test(text.replace(/,/g, ""));

function textsFrom(s: MonthlySavings): Record<Field, string> {
  return {
    main_checking: toText(s.main_checking),
    gx_bank: toText(s.gx_bank),
    ryt_bank: toText(s.ryt_bank),
    epf_locked: toText(s.epf_locked),
    gx_rate: toText(s.gx_rate * 100),
    ryt_rate: toText(s.ryt_rate * 100),
  };
}

export function BalancesSheet({
  isOpen,
  monthLabel,
  draft,
  previous,
  previousLabel,
  onClose,
  onSave,
}: BalancesSheetProps) {
  const [values, setValues] = useState<Record<Field, string>>(() => textsFrom(draft));
  const [initial, setInitial] = useState<Record<Field, string>>(() => textsFrom(draft));

  useEffect(() => {
    if (!isOpen) return;
    const texts = textsFrom(draft);
    setValues(texts);
    setInitial(texts);
    // Reset only when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const isDirty = (Object.keys(values) as Field[]).some((k) => values[k] !== initial[k]);

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

  const set = (key: Field, text: string) => {
    if (isDecimalInput(text)) setValues((v) => ({ ...v, [key]: text }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      month: draft.month,
      main_checking: toNumber(values.main_checking),
      gx_bank: toNumber(values.gx_bank),
      gx_rate: toNumber(values.gx_rate) / 100,
      ryt_bank: toNumber(values.ryt_bank),
      ryt_rate: toNumber(values.ryt_rate) / 100,
      epf_locked: toNumber(values.epf_locked),
    });
  };

  const total = ACCOUNTS.reduce((sum, a) => sum + toNumber(values[a.key]), 0);

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
        className="max-h-[92dvh] w-full max-w-md animate-sheet-up overflow-y-auto rounded-t-3xl border bg-card px-5 pb-safe pt-3 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:pb-5"
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
          {ACCOUNTS.map((a) => {
            const prev = previous?.[a.key as keyof MonthlySavings] as number | undefined;
            return (
              <div key={a.key} className="rounded-xl bg-secondary/50 p-4">
                <label htmlFor={a.key} className="text-xs font-medium text-muted-foreground">
                  {a.label}
                </label>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-sm text-muted-foreground">RM</span>
                  <input
                    id={a.key}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0"
                    value={values[a.key]}
                    onChange={(e) => set(a.key, e.target.value)}
                    className="w-full bg-transparent text-xl font-semibold tabular-nums tracking-tight outline-none placeholder:text-muted-foreground/40"
                  />
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{prev !== undefined ? `${previousLabel}: ${formatCurrency(prev)}` : "No earlier record"}</span>
                  {a.rateKey && (
                    <label className="flex items-center gap-1.5">
                      Interest
                      <input
                        type="text"
                        inputMode="decimal"
                        value={values[a.rateKey]}
                        onChange={(e) => set(a.rateKey as Field, e.target.value)}
                        placeholder="0"
                        className="w-16 rounded-lg border border-input bg-background px-2 py-1 text-right font-medium tabular-nums text-foreground outline-none focus:ring-2 focus:ring-ring/30"
                        aria-label={`${a.label} interest rate`}
                      />
                      % p.a.
                    </label>
                  )}
                </div>
              </div>
            );
          })}

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
