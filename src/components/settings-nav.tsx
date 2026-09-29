"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, Gauge, Receipt, SlidersHorizontal, Tags, UserRound, Wallet, type LucideIcon } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useBudget } from "@/lib/budget-context";

export interface SettingsSection {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Add new settings as a section here plus a page under src/app/settings/<name>/.
export const SETTINGS_SECTIONS: SettingsSection[] = [
  { href: "/settings/general", label: "General", icon: SlidersHorizontal },
  { href: "/settings/salary", label: "Salary & deductions", icon: Wallet },
  { href: "/settings/budgets", label: "Budgets", icon: Gauge },
  { href: "/settings/bills", label: "Monthly bills", icon: Receipt },
  { href: "/settings/reminders", label: "Reminders", icon: Bell },
  { href: "/settings/categories", label: "Categories & tags", icon: Tags },
  { href: "/settings/account", label: "Account", icon: UserRound },
];

// One-line summary under each section, so the list shows the current state at a glance.
function useSummaries(email: string | null): Record<string, string> {
  const { profile, bills, categories, tags, budgets, mode } = useBudget();
  const budgetTotal = budgets.reduce((sum, b) => sum + b.monthly_limit, 0);
  const autoBills = bills.filter((b) => b.auto_log).length;
  const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
  return {
    "/settings/general": "Default date, theme",
    "/settings/salary": `${formatCurrency(profile.default_gross_salary)} gross`,
    "/settings/budgets": budgets.length
      ? `${plural(budgets.length, "budget")} · ${formatCurrency(budgetTotal)}/month`
      : "None yet",
    "/settings/bills": bills.length
      ? `${plural(bills.length, "bill")}${autoBills ? ` · ${autoBills} automatic` : ""}`
      : "None yet",
    "/settings/reminders": mode === "cloud" ? "Bills, vouchers, budgets" : "Needs an account",
    "/settings/categories": `${plural(categories.length, "category", "categories")} · ${plural(tags.length, "tag")}`,
    "/settings/account":
      mode === "guest" ? "Guest · nothing is saved" : mode === "local" ? "Saved on this device" : email || "Signed in",
  };
}

// Phone: full-width list with chevrons. Desktop: sidebar with the open section highlighted.
export function SettingsNav({ email }: { email: string | null }) {
  const pathname = usePathname();
  const summaries = useSummaries(email);

  return (
    <nav aria-label="Settings sections">
      <ul className="card divide-y divide-border/70 overflow-hidden md:divide-y-0 md:border-0 md:bg-transparent md:p-0">
        {SETTINGS_SECTIONS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 transition hover:bg-secondary/40 md:rounded-xl md:px-3 md:py-2.5",
                  isActive && "md:bg-secondary"
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary md:h-8 md:w-8 md:bg-transparent">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{summaries[href]}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground md:hidden" />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
