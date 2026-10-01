import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildReminders, DEFAULT_REMINDER_PREFS, type ReminderData, type ReminderPrefs } from "@/lib/reminders";
import {
  createAdminClient,
  missingServerEnv,
  sendPush,
  todayInMalaysia,
  type StoredSubscription,
} from "@/lib/push-server";

// Daily reminder run, called by Vercel Cron (vercel.json, 12:00 UTC = 8pm Malaysia time).
// For every account with a device subscribed: works out today's reminders with the same
// rules as the Settings preview, skips ones already sent (reminder_log), and pushes the rest.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// One account's data, as the app would load it. Bills, budgets and goals are optional tables.
async function loadData(db: SupabaseClient, userId: string, today: string): Promise<ReminderData | null> {
  const monthStart = `${today.slice(0, 7)}-01`;
  const [cats, tgs, txs, bls, bgs, gls] = await Promise.all([
    // Not filtered by user: they're only looked up by id from this user's own bills and budgets,
    // and this also works on databases from before the multi-user migration (no user_id column).
    db.from("categories").select("id, name"),
    db.from("tags").select("id, category_id, name"),
    // From this month's start: covers budgets, this month's bills and a bill due tomorrow in next month.
    db.from("transactions").select("id, date, category_id, tag_id, amount, is_one_off").eq("user_id", userId).gte("date", monthStart),
    db.from("recurring_sentinel").select("*").eq("user_id", userId),
    db.from("budgets").select("id, category_id, monthly_limit").eq("user_id", userId),
    db.from("goals").select("*").eq("user_id", userId),
  ]);
  if (cats.error || tgs.error || txs.error) {
    console.error("Reminders: load failed", userId, cats.error || tgs.error || txs.error);
    return null;
  }
  return {
    today,
    categories: cats.data,
    tags: tgs.data,
    transactions: txs.data.map((t: any) => ({ ...t, amount: Number(t.amount) })),
    bills: (bls.data || []).map((b: any) => ({
      id: b.id,
      tag_id: b.tag_id,
      is_active: b.is_active !== false,
      expected_amount: b.expected_amount == null ? null : Number(b.expected_amount),
      due_day: b.due_day ?? null,
      auto_log: Boolean(b.auto_log),
    })),
    budgets: (bgs.data || []).map((b: any) => ({ ...b, monthly_limit: Number(b.monthly_limit) })),
    goals: (gls.data || []).map((g: any) => ({
      ...g,
      target_amount: Number(g.target_amount),
      trade_in_value: Number(g.trade_in_value || 0),
      discounts: Array.isArray(g.discounts) ? g.discounts : [],
    })),
  };
}

export async function GET(request: NextRequest) {
  // Vercel Cron sends "Authorization: Bearer $CRON_SECRET". Without the secret set, refuse to run.
  // Every early exit logs why (Vercel → Logs), so a failed night isn't a bare 401/500.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[reminders] Not run: CRON_SECRET isn't set for this deployment. Add it in Vercel and redeploy.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    console.warn("[reminders] Refused: missing or wrong Authorization header (not Vercel Cron).");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const missing = missingServerEnv();
  const db = createAdminClient();
  if (missing.length || !db) {
    console.error(`[reminders] Not run: missing ${missing.join(", ")}. Add in Vercel and redeploy.`);
    return NextResponse.json({ error: `Missing env: ${missing.join(", ")}` }, { status: 500 });
  }

  const today = todayInMalaysia();
  const { data: subs, error } = await db.from("push_subscriptions").select("user_id, endpoint, p256dh, auth");
  if (error) {
    // e.g. "Invalid API key": SUPABASE_SERVICE_ROLE_KEY isn't the project's secret / service_role key.
    console.error("[reminders] Not run: couldn't read push_subscriptions:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const byUser = new Map<string, StoredSubscription[]>();
  for (const s of subs as StoredSubscription[]) byUser.set(s.user_id, [...(byUser.get(s.user_id) || []), s]);

  const userIds = [...byUser.keys()];
  const { data: settings } = await db
    .from("reminder_settings")
    .select("user_id, bills, vouchers, budgets, daily_log")
    .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  // users = accounts with a device; nothingDue = of those, how many had no reminders today.
  const summary = { date: today, users: userIds.length, nothingDue: 0, sent: 0, skipped: 0, removedDevices: 0 };

  for (const [userId, devices] of byUser) {
    const row = settings?.find((s) => s.user_id === userId);
    const prefs: ReminderPrefs = row
      ? { bills: row.bills, vouchers: row.vouchers, budgets: row.budgets, daily_log: row.daily_log }
      : DEFAULT_REMINDER_PREFS;

    const data = await loadData(db, userId, today);
    if (!data) continue;
    const reminders = buildReminders(data, prefs);
    if (!reminders.length) {
      summary.nothingDue++;
      continue;
    }

    const { data: logged } = await db
      .from("reminder_log")
      .select("key")
      .eq("user_id", userId)
      .in("key", reminders.map((r) => r.key));
    const alreadySent = new Set((logged || []).map((l) => l.key));
    const due = reminders.filter((r) => !alreadySent.has(r.key));
    summary.skipped += reminders.length - due.length;

    let live = devices;
    for (const reminder of due) {
      const results = await Promise.all(
        live.map((d) => sendPush(d, { title: reminder.title, body: reminder.body, url: reminder.url, tag: reminder.key }))
      );
      const gone = live.filter((_, i) => results[i] === "gone");
      if (gone.length) {
        await db.from("push_subscriptions").delete().in("endpoint", gone.map((d) => d.endpoint));
        summary.removedDevices += gone.length;
        live = live.filter((d) => !gone.includes(d));
      }
      // Logged once any device got it; if every push failed, it's retried on the next run.
      if (results.includes("sent")) {
        await db.from("reminder_log").upsert({ user_id: userId, key: reminder.key }, { onConflict: "user_id,key" });
        summary.sent++;
      }
      if (!live.length) break;
    }
  }

  // Keys are dated, so old log rows are never needed again.
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  await db.from("reminder_log").delete().lt("sent_at", cutoff);

  console.log("[reminders] Done:", JSON.stringify(summary));
  return NextResponse.json(summary);
}
