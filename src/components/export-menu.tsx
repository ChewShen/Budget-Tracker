"use client";

import { useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { Download, FileJson, FileSpreadsheet, PiggyBank } from "lucide-react";
import { useBudget } from "@/lib/budget-context";
import { recordedHistory } from "@/lib/savings";
import { CSV, JSON_TYPE, backupJson, download, savingsCsv, transactionsCsv } from "@/lib/export";

export function ExportMenu() {
  const { transactions, savings, categories, tags, bills, profile, selectedMonth, showToast } = useBudget();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setIsOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const today = format(new Date(), "yyyy-MM-dd");
  const monthTxs = transactions.filter((t) => t.date.startsWith(selectedMonth));
  const monthName = format(parseISO(`${selectedMonth}-01`), "MMMM yyyy");
  const recordedMonths = recordedHistory(savings).length;
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

  const options = [
    {
      label: `${monthName}`,
      detail: `${plural(monthTxs.length, "expense")} · CSV`,
      icon: FileSpreadsheet,
      disabled: monthTxs.length === 0,
      run: () => {
        download(`budget_expenses_${selectedMonth}.csv`, transactionsCsv(monthTxs), CSV);
        return `Exported ${plural(monthTxs.length, "expense")} for ${monthName}`;
      },
    },
    {
      label: "All expenses",
      detail: `${plural(transactions.length, "expense")} · CSV`,
      icon: FileSpreadsheet,
      disabled: transactions.length === 0,
      run: () => {
        download(`budget_expenses_all_${today}.csv`, transactionsCsv(transactions), CSV);
        return `Exported ${plural(transactions.length, "expense")}`;
      },
    },
    {
      label: "Savings balances",
      detail: `${plural(recordedMonths, "month")} · CSV`,
      icon: PiggyBank,
      disabled: recordedMonths === 0,
      run: () => {
        download(`budget_savings_${today}.csv`, savingsCsv(savings), CSV);
        return `Exported ${plural(recordedMonths, "month")} of balances`;
      },
    },
    {
      label: "Full backup",
      detail: "Everything, incl. categories, bills and salary · JSON",
      icon: FileJson,
      disabled: false,
      run: () => {
        download(
          `budget_backup_${today}.json`,
          backupJson({ profile, categories, tags, bills, transactions, savings }),
          JSON_TYPE
        );
        return "Backup downloaded";
      },
    },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Export</span>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Export"
          className="absolute right-0 top-11 z-30 w-72 animate-fade-in rounded-2xl border bg-popover p-1.5 shadow-2xl shadow-black/40"
        >
          {options.map(({ label, detail, icon: Icon, disabled, run }) => (
            <button
              key={label}
              role="menuitem"
              disabled={disabled}
              onClick={() => {
                const message = run();
                setIsOpen(false);
                showToast({ tone: "default", message });
              }}
              className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-secondary disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-xs text-muted-foreground">{detail}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
