"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "./supabase/client";
import { DEFAULT_REMINDER_PREFS, type ReminderPrefs } from "./reminders";

// Browser side of reminders: this device's push subscription and the account's reminder
// settings. The notifications themselves are sent by /api/reminders.

export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

const MISSING_TABLE = ["42P01", "PGRST205"];
export const MIGRATION_HINT = "Run scripts/migrations/2026-09-29_reminders.sql in Supabase first.";

export type PushState =
  | "loading"
  | "unsupported" // browser can't do web push
  | "needs-install" // iPhone/iPad Safari: only works from the Home Screen app
  | "not-configured" // deployment has no VAPID key
  | "denied" // notifications blocked for this site
  | "off"
  | "on";

const isIos = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const hasPush = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

async function currentSubscription(): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.getRegistration("/");
  return (await reg?.pushManager.getSubscription()) ?? null;
}

export async function getPushState(): Promise<PushState> {
  if (!hasPush()) return isIos() && !isStandalone() ? "needs-install" : "unsupported";
  if (!VAPID_PUBLIC_KEY) return "not-configured";
  if (Notification.permission === "denied") return "denied";
  return (await currentSubscription()) ? "on" : "off";
}

// Short label for the device list, e.g. "iPhone" or "Mac · Chrome".
function deviceName(): string {
  const ua = navigator.userAgent;
  const os = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua) || isIos()
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Mac/.test(ua)
          ? "Mac"
          : /Windows/.test(ua)
            ? "Windows"
            : "Device";
  if (isStandalone()) return os;
  const browser = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : "Safari";
  return `${os} · ${browser}`;
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function saveSubscription(sub: PushSubscription) {
  const json = sub.toJSON();
  return createClient()
    .from("push_subscriptions")
    .upsert(
      { endpoint: sub.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth, device: deviceName() },
      { onConflict: "endpoint" }
    );
}

// Asks for permission, subscribes this device and saves it to the account.
// Returns an error message, or null when notifications are on.
export async function enablePush(): Promise<string | null> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "Notifications weren't allowed.";

  const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  const subscribe = () =>
    reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) });

  let sub = (await reg.pushManager.getSubscription()) ?? (await subscribe());
  let { error } = await saveSubscription(sub);
  if (error && !MISSING_TABLE.includes(error.code)) {
    // The browser's subscription is still saved under another account (signed in here
    // before): start a fresh one for this account.
    await sub.unsubscribe();
    sub = await subscribe();
    ({ error } = await saveSubscription(sub));
  }
  if (error) {
    await sub.unsubscribe();
    return MISSING_TABLE.includes(error.code) ? MIGRATION_HINT : error.message;
  }
  return null;
}

// Stops notifications on this device and removes it from the account. Safe to call when off.
export async function disablePush(): Promise<void> {
  if (!hasPush()) return;
  const sub = await currentSubscription();
  if (!sub) return;
  await createClient().from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
  await sub.unsubscribe();
}

export function usePushState() {
  const [state, setState] = useState<PushState>("loading");
  const refresh = useCallback(() => {
    getPushState()
      .then(setState)
      .catch(() => setState("unsupported"));
  }, []);
  useEffect(refresh, [refresh]);
  return { state, refresh };
}

// Which reminders the account wants. Cloud only; elsewhere the defaults, kept in memory.
export function useReminderPrefs(isCloud: boolean) {
  const [prefs, setPrefs] = useState<ReminderPrefs>(DEFAULT_REMINDER_PREFS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isCloud) return;
    createClient()
      .from("reminder_settings")
      .select("bills, vouchers, budgets, daily_log")
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setError(MISSING_TABLE.includes(error.code) ? MIGRATION_HINT : error.message);
        else if (data) setPrefs(data);
      });
  }, [isCloud]);

  // Optimistic; rolls back and returns false if saving fails.
  const update = async (changes: Partial<ReminderPrefs>): Promise<boolean> => {
    const before = prefs;
    const next = { ...prefs, ...changes };
    setPrefs(next);
    if (!isCloud) return true;
    const { error } = await createClient()
      .from("reminder_settings")
      .upsert({ ...next, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (!error) return true;
    setPrefs(before);
    setError(MISSING_TABLE.includes(error.code) ? MIGRATION_HINT : error.message);
    return false;
  };

  return { prefs, update, error };
}
