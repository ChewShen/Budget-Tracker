"use client";

import { useState } from "react";
import "./globals.css";
import { BudgetProvider, useBudget } from "@/lib/budget-context";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { QuickAddModal } from "@/components/quick-add-modal";

function AppShell({ children }: { children: React.ReactNode }) {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const { categories, tags, addTransaction } = useBudget();

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 md:pb-10 flex flex-col">
      <Navbar onOpenQuickAdd={() => setIsQuickAddOpen(true)} />

      <main className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 py-6">
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Personal Budget & Wealth Tracker</title>
        <meta
          name="description"
          content="Mobile-first personal finance and wealth management application"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
        />
        <meta name="theme-color" content="#2563eb" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <BudgetProvider>
          <AppShell>{children}</AppShell>
        </BudgetProvider>
      </body>
    </html>
  );
}
