"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { useBudget } from "@/lib/budget-context";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface NavbarProps {
  onOpenQuickAdd: () => void;
}

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/transactions", label: "Transactions" },
  { href: "/savings", label: "Savings" },
];

export function Navbar({ onOpenQuickAdd }: NavbarProps) {
  const pathname = usePathname();
  const { signOut } = useBudget();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[11px] font-bold tracking-tight text-primary-foreground">
            RM
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Budget</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 rounded-full border bg-card p-1 text-sm">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-full px-4 py-1.5 font-medium transition-colors",
                pathname === href
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {isSupabaseConfigured && (
            <button
              onClick={signOut}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          )}
          <button
            onClick={onOpenQuickAdd}
            className="hidden md:flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-95 active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add expense
          </button>
        </div>
      </div>
    </header>
  );
}
