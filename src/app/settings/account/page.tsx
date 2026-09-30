"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useBudget } from "@/lib/budget-context";
import { useAccountEmail } from "@/lib/account";
import { createClient } from "@/lib/supabase/client";

const MIN_PASSWORD = 8;

// Accounts are created in the Supabase dashboard with a temporary password; this lets the
// person replace it with their own.
function PasswordCard() {
  const { showToast } = useBudget();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD;
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSave = password.length >= MIN_PASSWORD && confirm === password && !isBusy;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setIsBusy(true);
    const { error } = await createClient().auth.updateUser({ password });
    setIsBusy(false);
    if (error) {
      showToast({ tone: "error", message: error.message || "Couldn't change your password." });
      return;
    }
    setPassword("");
    setConfirm("");
    showToast({ tone: "default", message: "Password changed" });
  };

  return (
    <section className="card p-5 sm:p-6">
      <h3 className="text-[15px] font-semibold">Change password</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">At least {MIN_PASSWORD} characters. You stay signed in.</p>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs text-muted-foreground">New password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field mt-1"
          />
          {tooShort && <span className="mt-1 block text-xs text-danger">Too short</span>}
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">Confirm</span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="field mt-1"
          />
          {mismatch && <span className="mt-1 block text-xs text-danger">Doesn&apos;t match</span>}
        </label>
        <div className="sm:col-span-2 sm:flex sm:justify-end">
          <button
            type="submit"
            disabled={!canSave}
            className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:opacity-40 sm:w-auto"
          >
            {isBusy ? "Saving…" : "Change password"}
          </button>
        </div>
      </form>
    </section>
  );
}

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
    <>
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
      <PasswordCard />
    </>
  );
}
