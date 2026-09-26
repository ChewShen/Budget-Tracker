"use client";

import { useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CategoryIcon, categoryLabel } from "@/lib/categories";
import { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LedgerTableProps {
  transactions: Transaction[];
  onDeleteTransaction?: (id: string) => Promise<void>;
  showFilters?: boolean;
}

function formatDayHeading(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function LedgerTable({
  transactions,
  onDeleteTransaction,
  showFilters = true,
}: LedgerTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const categories = Array.from(
    new Set(transactions.map((t) => t.category_name).filter(Boolean))
  ) as string[];

  const query = searchTerm.toLowerCase();
  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      (tx.tag_name || "").toLowerCase().includes(query) ||
      (tx.description || "").toLowerCase().includes(query) ||
      (tx.category_name || "").toLowerCase().includes(query);
    const matchesCat = selectedCategory === "ALL" || tx.category_name === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Group by date, newest first
  const groups = new Map<string, Transaction[]>();
  [...filtered]
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach((tx) => {
      const list = groups.get(tx.date) || [];
      list.push(tx);
      groups.set(tx.date, list);
    });

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tags or notes"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="field rounded-full bg-card pl-10"
            />
          </div>
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
            {["ALL", ...categories].map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
                  selectedCategory === c
                    ? "border-transparent bg-foreground text-background"
                    : "bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                {c === "ALL" ? "All" : categoryLabel(c)}
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card py-12 text-center text-sm text-muted-foreground">
          No transactions found
        </div>
      ) : (
        <div className="card divide-y divide-border/60 overflow-hidden">
          {Array.from(groups.entries()).map(([date, txs]) => {
            const dayTotal = txs.reduce((sum, t) => sum + t.amount, 0);
            return (
              <div key={date}>
                <div className="flex items-center justify-between bg-secondary/40 px-4 py-2 text-xs text-muted-foreground sm:px-5">
                  <span className="font-medium">{formatDayHeading(date)}</span>
                  <span className="tabular-nums">{formatCurrency(dayTotal)}</span>
                </div>
                <ul>
                  {txs.map((tx) => (
                    <li
                      key={tx.id}
                      className="group flex items-center gap-3 px-4 py-3 transition hover:bg-secondary/30 sm:px-5"
                    >
                      <CategoryIcon name={tx.category_name} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{tx.tag_name}</span>
                          {tx.is_one_off && (
                            <span className="shrink-0 rounded-full border px-1.5 py-px text-[10px] font-medium text-muted-foreground">
                              One-off
                            </span>
                          )}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {tx.description || categoryLabel(tx.category_name)}
                        </div>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">
                        −{formatCurrency(tx.amount)}
                      </span>
                      {onDeleteTransaction && (
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="-mr-1 shrink-0 rounded-full p-1.5 text-muted-foreground/60 transition hover:bg-danger/10 hover:text-danger sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
                          aria-label={`Delete ${tx.tag_name} ${formatCurrency(tx.amount)}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
