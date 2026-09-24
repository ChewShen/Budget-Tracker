"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, ListOrdered, PiggyBank, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  onOpenQuickAdd: () => void;
}

const LINKS = [
  { href: "/", label: "Overview", icon: House },
  { href: "/transactions", label: "Activity", icon: ListOrdered },
  { href: "/savings", label: "Savings", icon: PiggyBank },
];

export function BottomNav({ onOpenQuickAdd }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-safe md:hidden">
      <div className="mx-auto mb-3 flex max-w-sm items-center justify-between rounded-full border bg-card/90 p-1.5 shadow-2xl shadow-black/40 backdrop-blur-xl">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full text-xs font-medium transition-colors",
                isActive ? "bg-secondary text-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.25 : 2} />
              {isActive && <span>{label}</span>}
            </Link>
          );
        })}

        <button
          onClick={onOpenQuickAdd}
          className="ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition active:scale-95"
          aria-label="Add expense"
        >
          <Plus className="h-5 w-5" strokeWidth={2.75} />
        </button>
      </div>
    </div>
  );
}
