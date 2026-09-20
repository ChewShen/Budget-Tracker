"use client";

import { useState } from "react";
import { useBudget } from "@/lib/budget-context";
import { LedgerTable } from "@/components/ledger-table";
import { MonthSelector } from "@/components/month-selector";
import { formatCurrency } from "@/lib/utils";

export default function TransactionsPage() {
  const {
    transactions,
    selectedMonth,
    setSelectedMonth,
    deleteTransaction,
  } = useBudget();
  const [filterByMonth, setFilterByMonth] = useState(true);

  const displayedTransactions = filterByMonth
    ? transactions.filter((t) => t.date.startsWith(selectedMonth))
    : transactions;

  const totalAmount = displayedTransactions.reduce(
    (sum, t) => sum + t.amount,
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">
            Transaction Ledger
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {displayedTransactions.length} entries recorded • Total:{" "}
            <span className="font-bold text-foreground">
              {formatCurrency(totalAmount)}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={filterByMonth}
              onChange={(e) => setFilterByMonth(e.target.checked)}
              className="rounded text-primary"
            />
            <span>Filter by active month</span>
          </label>

          {filterByMonth && (
            <MonthSelector
              currentMonth={selectedMonth}
              onChangeMonth={setSelectedMonth}
            />
          )}
        </div>
      </div>

      {/* Ledger Data Table */}
      <LedgerTable
        transactions={displayedTransactions}
        onDeleteTransaction={deleteTransaction}
      />
    </div>
  );
}
