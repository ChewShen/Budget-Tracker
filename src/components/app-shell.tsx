"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { BudgetProvider, useBudget } from "@/lib/budget-context";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { QuickAddModal } from "@/components/quick-add-modal";
import { ToastHost } from "@/components/toast";

function ShellInner({ children }: { children: React.ReactNode }) {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const { categories, tags, transactions, addTransaction, isLoaded, loadError, dismissToast } =
    useBudget();

  const openQuickAdd = () => {
    // A leftover toast would sit on top of the sheet's numpad.
    dismissToast();
    setIsQuickAddOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-28 md:pb-12 flex flex-col">
      <Navbar onOpenQuickAdd={openQuickAdd} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 py-6 sm:py-8">
        {loadError && (
          <div className="mb-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {loadError}
          </div>
        )}
        {isLoaded ? (
          children
        ) : (
          <div className="space-y-4" aria-busy="true" aria-label="Loading">
            <div className="h-10 w-56 animate-pulse rounded-full bg-card" />
            <div className="h-56 animate-pulse rounded-2xl bg-card" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-card" />
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav onOpenQuickAdd={openQuickAdd} />

      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        categories={categories}
        tags={tags}
        transactions={transactions}
        onSave={addTransaction}
      />

      <ToastHost />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The login page renders bare: no nav, and no data provider (it would only fetch empty results).
  if (pathname === "/login") {
    return <main className="mx-auto w-full max-w-6xl px-4 sm:px-6">{children}</main>;
  }

  return (
    <BudgetProvider>
      <ShellInner>{children}</ShellInner>
    </BudgetProvider>
  );
}
