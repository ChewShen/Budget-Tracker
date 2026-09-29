"use client";

import { LogOut } from "lucide-react";
import { useBudget } from "@/lib/budget-context";
import { useAccountEmail } from "@/lib/account";

export default function AccountSettingsPage() {
  const { signOut, mode } = useBudget();
  const email = useAccountEmail(mode === "cloud");

  if (mode === "guest")
    return (
      <section className="card flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold">Guest</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            You&apos;re using sample data. Changes disappear when you refresh.
          </p>
        </div>
        <button
          onClick={signOut}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-95"
        >
          Sign in to save
        </button>
      </section>
    );

  if (mode === "local")
    return (
      <section className="card p-5 sm:p-6">
        <h3 className="text-[15px] font-semibold">Local only</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          No account is connected. Your data is saved in this browser on this device.
        </p>
      </section>
    );

  return (
    <section className="card flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold">Signed in</h3>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{email ?? "…"}</p>
      </div>
      <button
        onClick={signOut}
        className="flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition hover:bg-secondary"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </section>
  );
}
