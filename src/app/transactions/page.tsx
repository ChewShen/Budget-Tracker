"use client";

import { useState } from "react";
import { useBudget } from "@/lib/budget-context";
import { LedgerTable } from "@/components/ledger-table";
import { MonthSelector } from "@/components/month-selector";
import { formatCurrency } from "@/lib/utils";
import { Download } from "lucide-react";
import { CSV, download, transactionsCsv } from "@/lib/export";
import { cn } from "@/lib/utils";

export default function TransactionsPage() {
  const {
    transactions,
    selectedMonth,
    setSelectedMonth,
    deleteTransaction,
    showToast,
  } = useBudget();
  const [filterByMonth, setFilterByMonth] = useState(true);

  const displayedTransactions = filterByMonth
    ? transactions.filter((t) => t.date.startsWith(selectedMonth))
    : transactions;

  const totalAmount = displayedTransactions.reduce(
    (sum, t) => sum + t.amount,
    0
  );

  const exportShown = () => {
    const name = filterByMonth ? `budget_expenses_${selectedMonth}.csv` : "budget_expenses_all.csv";
    download(name, transactionsCsv(displayedTransactions), CSV);
    showToast({
      tone: "default",
      message: `Exported ${displayedTransactions.length} expense${displayedTransactions.length === 1 ? "" : "s"}`,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {displayedTransactions.length} entries ·{" "}
            <span className="font-medium text-foreground tabular-nums">
              {formatCurrency(totalAmount)}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border bg-card p-1 text-xs font-medium">
            {[
              { value: true, label: "Month" },
              { value: false, label: "All time" },
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() => setFilterByMonth(opt.value)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 transition",
                  filterByMonth === opt.value
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {filterByMonth && (
            <MonthSelector
              currentMonth={selectedMonth}
              onChangeMonth={setSelectedMonth}
            />
          )}
          <button
            onClick={exportShown}
            disabled={displayedTransactions.length === 0}
            className="flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-40"
            title="Download these expenses as CSV"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <LedgerTable
        transactions={displayedTransactions}
        onDeleteTransaction={deleteTransaction}
      />
    </div>
  );
}
