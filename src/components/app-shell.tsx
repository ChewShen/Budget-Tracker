"use client";

import { useState } from "react";
import { BudgetProvider, useBudget } from "@/lib/budget-context";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { QuickAddModal } from "@/components/quick-add-modal";

function ShellInner({ children }: { children: React.ReactNode }) {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const { categories, tags, addTransaction } = useBudget();

  return (
    <div className="min-h-screen bg-background text-foreground pb-28 md:pb-12 flex flex-col">
      <Navbar onOpenQuickAdd={() => setIsQuickAddOpen(true)} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>

      <BottomNav onOpenQuickAdd={() => setIsQuickAddOpen(true)} />

      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        categories={categories}
        tags={tags}
        onSave={addTransaction}
      />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <BudgetProvider>
      <ShellInner>{children}</ShellInner>
    </BudgetProvider>
  );
}
