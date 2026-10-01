import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./supabase/config";

// Server-only helpers for /api/reminders. Nothing here may be imported by client code:
// it reads the VAPID private key and the Supabase secret (service role) key.

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
// Contact for the push services (Apple, Google, Mozilla): a mailto: or https: URL.
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "https://github.com/ChewShen/budget-tracker";

export const isPushConfigured = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

// Names of the variables the nightly job needs but this deployment doesn't have, so a failed
// run says exactly what to add (in Vercel → Settings → Environment Variables, then redeploy).
export function missingServerEnv(): string[] {
  return [
    ["NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL],
    ["SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY],
    ["NEXT_PUBLIC_VAPID_PUBLIC_KEY", VAPID_PUBLIC_KEY],
    ["VAPID_PRIVATE_KEY", VAPID_PRIVATE_KEY],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name as string);
}

export interface StoredSubscription {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag?: string;
}

// "gone" = the device unsubscribed or the app was removed; delete the subscription.
export async function sendPush(sub: StoredSubscription, payload: PushPayload): Promise<"sent" | "gone" | "failed"> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      {
        vapidDetails: { subject: VAPID_SUBJECT, publicKey: VAPID_PUBLIC_KEY, privateKey: VAPID_PRIVATE_KEY },
        TTL: 12 * 60 * 60, // drop it if the phone stays offline until morning
      }
    );
    return "sent";
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) return "gone";
    console.error("Push failed", status, (e as Error).message);
    return "failed";
  }
}

// Admin client from SUPABASE_SERVICE_ROLE_KEY: the project's secret key (sb_secret_…) or the
// legacy service_role key. It bypasses RLS, so every query for a person's data filters by user_id.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) return null;
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// Today's date in Malaysia (YYYY-MM-DD), matching the auto-bills job.
export const todayInMalaysia = (now: Date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur" }).format(now);
