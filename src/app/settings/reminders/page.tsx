"use client";

import { useState } from "react";
import { format } from "date-fns";
import { BellOff, BellRing, Share } from "lucide-react";
import { useBudget } from "@/lib/budget-context";
import { disablePush, enablePush, usePushState, useReminderPrefs, type PushState } from "@/lib/push";
import { buildReminders, REMINDER_TYPES } from "@/lib/reminders";

function Switch({ checked, disabled, onChange, children }: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className="flex w-full items-center justify-between gap-3 py-3 text-left transition disabled:opacity-50"
    >
      <span className="min-w-0">{children}</span>
      <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${checked ? "bg-primary" : "bg-secondary"}`}>
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-background shadow transition-all ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

const STATE_TEXT: Record<Exclude<PushState, "loading" | "off" | "on">, string> = {
  unsupported: "This browser can't show notifications. Try Chrome, Edge, Firefox or Safari on a recent version.",
  "needs-install":
    "On iPhone and iPad, notifications only work from the Home Screen app. In Safari tap Share, then Add to Home Screen, open the app from there and come back here.",
  "not-configured": "Notifications aren't set up on this deployment yet (no VAPID key).",
  denied: "Notifications are blocked for this app. Allow them in your browser or phone settings, then reopen this page.",
};

function DeviceCard({ isCloud }: { isCloud: boolean }) {
  const { showToast } = useBudget();
  const { state, refresh } = usePushState();
  const [isBusy, setIsBusy] = useState(false);

  const toggle = async () => {
    setIsBusy(true);
    try {
      if (state === "on") {
        await disablePush();
        showToast({ message: "Reminders off on this device", tone: "default" });
      } else {
        const error = await enablePush();
        showToast(error ? { message: error, tone: "error" } : { message: "Reminders on. They arrive around 8pm.", tone: "default" });
      }
    } catch (e) {
      showToast({ message: e instanceof Error ? e.message : "Couldn't change notifications", tone: "error" });
    }
    setIsBusy(false);
    refresh();
  };

  const sendTest = async () => {
    setIsBusy(true);
    try {
      const res = await fetch("/api/reminders/test", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      showToast(
        res.ok
          ? { message: `Test sent to ${body.sent} ${body.sent === 1 ? "device" : "devices"}`, tone: "default" }
          : { message: body.error || "Couldn't send a test", tone: "error" }
      );
    } catch {
      showToast({ message: "Couldn't send a test. Check your connection.", tone: "error" });
    }
    setIsBusy(false);
  };

  const isOn = state === "on";

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">
            {isOn ? <BellRing className="h-4 w-4 text-highlight" /> : <BellOff className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold">This device</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {!isCloud
                ? "Reminders are sent from the server, so they need an account."
                : state === "loading"
                  ? "Checking…"
                  : isOn
                    ? "On · reminders arrive around 8pm Malaysia time"
                    : state === "off"
                      ? "Off · get a notification when something needs you"
                      : STATE_TEXT[state]}
            </p>
          </div>
        </div>
        {isCloud && (state === "on" || state === "off") && (
          <div className="flex gap-2">
            {isOn && (
              <button
                onClick={sendTest}
                disabled={isBusy}
                className="rounded-full border px-4 py-2 text-sm font-medium transition hover:bg-secondary disabled:opacity-50"
              >
                Send a test
              </button>
            )}
            <button
              onClick={toggle}
              disabled={isBusy}
              className={
                isOn
                  ? "rounded-full border px-4 py-2 text-sm font-medium transition hover:bg-secondary disabled:opacity-50"
                  : "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:opacity-50"
              }
            >
              {isBusy ? "…" : isOn ? "Turn off" : "Turn on"}
            </button>
          </div>
        )}
      </div>
      {isCloud && state === "needs-install" && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Share className="h-3.5 w-3.5" /> Share → Add to Home Screen
        </p>
      )}
    </section>
  );
}

export default function RemindersSettingsPage() {
  const { mode, bills, tags, categories, transactions, budgets, goals, showToast } = useBudget();
  const isCloud = mode === "cloud";
  const { prefs, update, error } = useReminderPrefs(isCloud);

  const today = format(new Date(), "yyyy-MM-dd");
  const preview = buildReminders({ today, bills, tags, categories, transactions, budgets, goals }, prefs);

  return (
    <>
      <DeviceCard isCloud={isCloud} />

      <section className="card p-5 sm:p-6">
        <h3 className="text-[15px] font-semibold">Remind me about</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {isCloud ? "For every device with reminders on" : "Try the switches: the preview below updates"}
        </p>
        {error && <p className="mt-3 text-xs text-danger">{error}</p>}
        <div className="mt-2 divide-y divide-border/70">
          {REMINDER_TYPES.map(({ kind, label, description }) => (
            <Switch
              key={kind}
              checked={prefs[kind]}
              onChange={async () => {
                if (!(await update({ [kind]: !prefs[kind] })))
                  showToast({ message: "Couldn't save reminder settings", tone: "error" });
              }}
            >
              <span className="block text-sm font-medium">{label}</span>
              <span className="block text-xs text-muted-foreground">{description}</span>
            </Switch>
          ))}
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h3 className="text-[15px] font-semibold">Tonight</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          What your data would trigger right now. Each reminder is only sent once.
        </p>
        {preview.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nothing to remind you about today.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {preview.map((r) => (
              <li key={r.key} className="rounded-xl border bg-background/40 px-3.5 py-2.5">
                <p className="text-sm font-medium">{r.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{r.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
