"use client";

import { useState } from "react";
import { Search, Trash2, Tag, Calendar, Filter } from "lucide-react";
import { formatCurrency, formatDateDisplay } from "@/lib/utils";
import { Transaction } from "@/lib/types";

interface LedgerTableProps {
  transactions: Transaction[];
  onDeleteTransaction?: (id: string) => Promise<void>;
}

export function LedgerTable({
  transactions,
  onDeleteTransaction,
}: LedgerTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const categories = Array.from(
    new Set(transactions.map((t) => t.category_name).filter(Boolean))
  ) as string[];

  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      (tx.tag_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.category_name || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCat =
      selectedCategory === "ALL" || tx.category_name === selectedCategory;

    return matchesSearch && matchesCat;
  });

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between border-b">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tags, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border bg-background pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground outline-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">
            ({filtered.length} entries)
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 text-muted-foreground border-b font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Tag</th>
              <th className="px-4 py-3 hidden sm:table-cell">Description</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-center">One-off?</th>
              {onDeleteTransaction && <th className="px-4 py-3 text-center">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y text-foreground">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No transactions found matching your criteria.
                </td>
              </tr>
            ) : (
              filtered.map((tx) => (
                <tr key={tx.id} className="transition hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium whitespace-nowrap">
                    {formatDateDisplay(tx.date)}
                    {tx.day && (
                      <span className="block text-[10px] text-muted-foreground">
                        {tx.day}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{tx.category_name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-secondary px-2 py-0.5 font-semibold text-secondary-foreground">
                      {tx.tag_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell max-w-xs truncate">
                    {tx.description || "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-foreground">
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {tx.is_one_off ? (
                      <span className="rounded-full bg-amber-100 dark:bg-amber-950 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                        One-off
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  {onDeleteTransaction && (
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="rounded p-1 text-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950"
                        title="Delete entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
