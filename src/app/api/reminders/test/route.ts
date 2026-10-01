import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import { isPushConfigured, sendPush, type StoredSubscription } from "@/lib/push-server";

// "Send a test" in Settings > Reminders: pushes a sample notification to the signed-in
// account's devices. Runs as that user (their session cookie), so RLS limits it to their own
// subscriptions; no service role key involved.

export const dynamic = "force-dynamic";

export async function POST() {
  if (!isPushConfigured) {
    console.error("[reminders/test] Not sent: NEXT_PUBLIC_VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY isn't set.");
    return NextResponse.json({ error: "Notifications aren't set up on this deployment." }, { status: 500 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {}, // read-only here; the middleware refreshes the session
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { data: devices, error } = await supabase.from("push_subscriptions").select("user_id, endpoint, p256dh, auth");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!devices.length) return NextResponse.json({ error: "No devices have reminders on." }, { status: 400 });

  const results = await Promise.all(
    (devices as StoredSubscription[]).map((d) =>
      sendPush(d, {
        title: "Reminders are working",
        body: "You'll get bills, vouchers and budgets here around 8pm.",
        url: "/settings/reminders",
        tag: "test",
      })
    )
  );
  const gone = devices.filter((_, i) => results[i] === "gone");
  if (gone.length) await supabase.from("push_subscriptions").delete().in("endpoint", gone.map((d) => d.endpoint));

  const sent = results.filter((r) => r === "sent").length;
  if (!sent) return NextResponse.json({ error: "Couldn't reach any device. Turn reminders off and on again." }, { status: 502 });
  return NextResponse.json({ sent });
}
