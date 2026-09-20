"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, PiggyBank, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  onOpenQuickAdd: () => void;
}

export function BottomNav({ onOpenQuickAdd }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 z-40 w-full border-t bg-background/95 backdrop-blur md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center justify-center gap-1 text-xs",
            pathname === "/" ? "text-primary font-bold" : "text-muted-foreground"
          )}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Dashboard</span>
        </Link>

        {/* Floating Quick Add Button in center */}
        <button
          onClick={onOpenQuickAdd}
          className="flex h-12 w-12 -translate-y-2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-105 active:scale-95"
          aria-label="Add transaction"
        >
          <Plus className="h-6 w-6 stroke-[3]" />
        </button>

        <Link
          href="/transactions"
          className={cn(
            "flex flex-col items-center justify-center gap-1 text-xs",
            pathname === "/transactions" ? "text-primary font-bold" : "text-muted-foreground"
          )}
        >
          <Receipt className="h-5 w-5" />
          <span>Ledger</span>
        </Link>

        <Link
          href="/savings"
          className={cn(
            "flex flex-col items-center justify-center gap-1 text-xs",
            pathname === "/savings" ? "text-primary font-bold" : "text-muted-foreground"
          )}
        >
          <PiggyBank className="h-5 w-5" />
          <span>Savings</span>
        </Link>
      </div>
    </div>
  );
}
