"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, PiggyBank, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  onOpenQuickAdd: () => void;
}

export function Navbar({ onOpenQuickAdd }: NavbarProps) {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transactions", label: "Ledger", icon: Receipt },
    { href: "/savings", label: "Savings & Interest", icon: PiggyBank },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-xl shadow-sm">
              RM
            </span>
            <span className="hidden sm:inline-block font-semibold text-foreground">
              Budget Tracker
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 transition-colors hover:text-foreground",
                  pathname === href
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Quick Add CTA Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenQuickAdd}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-95"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Expense</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>
    </header>
  );
}
