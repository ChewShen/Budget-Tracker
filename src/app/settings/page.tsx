"use client";

import { useEffect, useState } from "react";
import { Check, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBudget } from "@/lib/budget-context";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DefaultDateMode, getDefaultDateMode, setDefaultDateMode } from "@/lib/preferences";
import { CategoryManager } from "@/components/category-manager";
import { isGuestSession } from "@/lib/guest";
import { BillsManager } from "@/components/bills-manager";

const DATE_OPTIONS: { value: DefaultDateMode; label: string; description: string }[] = [
  {
    value: "today",
    label: "Today",
    description: "Every new expense starts on today's date.",
  },
  {
    value: "last",
    label: "Same as last entry",
    description: "Keep the date you used last time. Handy when catching up on a past day.",
  },
];

export default function SettingsPage() {
  const { signOut, mode } = useBudget();
  const [dateMode, setDateMode] = useState<DefaultDateMode>("today");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    setDateMode(getDefaultDateMode());
    if (isSupabaseConfigured && !isGuestSession()) {
      createClient()
        .auth.getUser()
        .then(({ data }) => setEmail(data.user?.email ?? null));
    }
  }, []);

  const chooseDateMode = (mode: DefaultDateMode) => {
    setDateMode(mode);
    setDefaultDateMode(mode);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Preferences, bills, categories and account</p>
      </div>

      <section className="card p-5 sm:p-6">
        <h3 className="text-[15px] font-semibold">Adding expenses</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Default date when you open Add expense · saved on this device
        </p>

        <div role="radiogroup" aria-label="Default date" className="mt-4 space-y-2">
          {DATE_OPTIONS.map((opt) => {
            const isActive = dateMode === opt.value;
            return (
              <button
                key={opt.value}
                role="radio"
                aria-checked={isActive}
                onClick={() => chooseDateMode(opt.value)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition",
                  isActive ? "border-foreground/70 bg-secondary/50" : "hover:bg-secondary/40"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                    isActive ? "border-transparent bg-primary text-primary-foreground" : "border-input"
                  )}
                >
                  {isActive && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                <span>
                  <span className="block text-sm font-medium">{opt.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{opt.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <BillsManager />

      <CategoryManager />

      {mode === "guest" && (
        <section className="card flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold">Account</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              You&apos;re a guest. Changes here disappear when you refresh.
            </p>
          </div>
          <button
            onClick={signOut}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-95"
          >
            Sign in to save
          </button>
        </section>
      )}

      {mode === "cloud" && (
        <section className="card flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold">Account</h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {email ? `Signed in as ${email}` : "Signed in"}
            </p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </section>
      )}
    </div>
  );
}
