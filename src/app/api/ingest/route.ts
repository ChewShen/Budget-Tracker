import { createHash } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { formatCurrency } from "@/lib/utils";
import { parseCapture, suggestTagId } from "@/lib/ingest";
import { createAdminClient, todayInMalaysia } from "@/lib/push-server";

// Adds a captured expense to the token owner's Inbox (Settings → Automation explains the
// Shortcut). Send JSON { text?, amount?, merchant?, date?, source? } or plain text, with
// "Authorization: Bearer <token>". It can only add Inbox items for that token's owner; it never
// returns any of their data beyond what it just parsed.

export const dynamic = "force-dynamic";

const MAX_BODY = 8_000; // characters
const MAX_PENDING = 500; // a runaway automation can't flood the Inbox

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
// Errors also carry `message`, which the Shortcut shows as its notification.
const fail = (error: string, status: number) => NextResponse.json({ ok: false, error, message: `Not added: ${error}` }, { status });

export async function POST(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : request.headers.get("x-api-token")?.trim();
  if (!token) return fail("Missing token. Check the Authorization header is Bearer <token>.", 401);

  const db = createAdminClient();
  if (!db) {
    console.error("[ingest] Not run: missing SUPABASE_SERVICE_ROLE_KEY.");
    return fail("Not set up on this deployment.", 500);
  }

  const { data: tok } = await db
    .from("api_tokens")
    .select("id, user_id")
    .eq("token_hash", sha256(token))
    .is("revoked_at", null)
    .maybeSingle();
  if (!tok) {
    console.warn("[ingest] Refused: unknown or revoked token.");
    return fail("Invalid or revoked token. Create a new one in Settings → Automation.", 401);
  }

  // Body: JSON fields, or plain text (e.g. text read off a screenshot).
  const raw = await request.text();
  if (raw.length > MAX_BODY) return fail("Too much text sent.", 413);
  let input: { text?: unknown; amount?: unknown; merchant?: unknown; date?: unknown; source?: unknown } = {};
  try {
    input = (request.headers.get("content-type") || "").includes("json") ? JSON.parse(raw || "{}") : { text: raw };
  } catch {
    return fail("The Shortcut sent invalid JSON.", 400);
  }
  if (typeof input !== "object" || input === null) input = { text: String(input) };

  const userId = tok.user_id as string;
  const { count } = await db
    .from("inbox_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "pending");
  if ((count ?? 0) >= MAX_PENDING) return fail(`Inbox is full (${MAX_PENDING} waiting). Confirm or dismiss some first.`, 429);

  const today = todayInMalaysia();
  const captured = parseCapture(input, today);

  // Suggest a tag from the owner's merchant rules (and file it under that tag's category).
  const { data: rules } = await db.from("merchant_rules").select("pattern, tag_id").eq("user_id", userId);
  const tagId = suggestTagId(captured.merchant, rules || []);
  const { data: tag } = tagId
    ? await db.from("tags").select("id, name, category_id").eq("id", tagId).eq("user_id", userId).maybeSingle()
    : { data: null };

  const source = typeof input.source === "string" && /^[a-z][a-z0-9_-]{0,19}$/i.test(input.source) ? input.source.toLowerCase() : "shortcut";
  const { error } = await db.from("inbox_items").insert({
    user_id: userId,
    source,
    raw_text: typeof input.text === "string" ? input.text.slice(0, 4000) : null,
    amount: captured.amount,
    merchant: captured.merchant,
    occurred_on: captured.date ?? today,
    suggested_tag_id: tag?.id ?? null,
    suggested_category_id: tag?.category_id ?? null,
  });
  if (error) {
    console.error("[ingest] Couldn't save:", error.message);
    return fail("Couldn't save to the Inbox. Try again.", 500);
  }
  await db.from("api_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", tok.id);

  // One line a Shortcut can show as a notification.
  const where = [captured.merchant, tag ? `→ ${tag.name}` : null].filter(Boolean).join(" ");
  const message = [captured.amount ? formatCurrency(captured.amount) : "Amount not found", where]
    .filter(Boolean)
    .join(" · ");
  return NextResponse.json({
    ok: true,
    message: `${message} · added to Inbox`,
    amount: captured.amount,
    merchant: captured.merchant,
    date: captured.date ?? today,
    tag: tag?.name ?? null,
    pending: (count ?? 0) + 1,
  });
}
