"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "./supabase/client";
import { merchantKey } from "./ingest";

// Browser side of automation (cloud accounts only): personal tokens for /api/ingest, the Inbox
// of captured expenses, and merchant rules learned when confirming.

// The ready-made "Log Payment" Shortcut, shared from iCloud with an Import Question that asks for
// the token when it's added. null until a shareable version exists; Settings → Automation then
// shows only the build-it-yourself steps.
export const SHORTCUT_URL: string | null = null;

const MISSING_TABLE = ["42P01", "PGRST205"];
export const AUTOMATION_MIGRATION_HINT = "Run scripts/migrations/2026-10-03_inbox.sql in Supabase first.";
const describe = (error: { code?: string; message?: string }) =>
  MISSING_TABLE.includes(error.code || "") ? AUTOMATION_MIGRATION_HINT : error.message || "Something went wrong.";

// ---- Tokens ----

export interface ApiToken {
  id: string;
  name: string;
  token_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

const toHex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export function useApiTokens(enabled: boolean) {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    const { data, error } = await createClient()
      .from("api_tokens")
      .select("id, name, token_prefix, created_at, last_used_at, revoked_at")
      .order("created_at", { ascending: false });
    if (error) setError(describe(error));
    else setTokens(data as ApiToken[]);
  }, [enabled]);

  useEffect(() => {
    load();
  }, [load]);

  // Makes a new random token and stores only its hash. Returns the token itself, which is
  // shown once and can't be read back later.
  const create = async (name: string): Promise<string | null> => {
    const token = `bt_${base64url(crypto.getRandomValues(new Uint8Array(32)))}`;
    const hash = toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)));
    const { error } = await createClient()
      .from("api_tokens")
      .insert({ name: name.trim() || "Shortcut", token_hash: hash, token_prefix: token.slice(0, 10) });
    if (error) {
      setError(describe(error));
      return null;
    }
    await load();
    return token;
  };

  const revoke = async (id: string) => {
    const { error } = await createClient().from("api_tokens").update({ revoked_at: new Date().toISOString() }).eq("id", id);
    if (error) setError(describe(error));
    await load();
  };

  return { tokens, error, create, revoke };
}

// ---- Inbox ----

export interface InboxItem {
  id: string;
  source: string;
  raw_text: string | null;
  amount: number | null;
  merchant: string | null;
  occurred_on: string | null;
  suggested_category_id: string | null;
  suggested_tag_id: string | null;
  created_at: string;
}

export function useInbox(enabled: boolean) {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return setIsLoaded(true);
    const { data, error } = await createClient()
      .from("inbox_items")
      .select("id, source, raw_text, amount, merchant, occurred_on, suggested_category_id, suggested_tag_id, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) setError(MISSING_TABLE.includes(error.code || "") ? null : describe(error)); // no tables yet = empty Inbox
    else setItems((data || []).map((i) => ({ ...i, amount: i.amount == null ? null : Number(i.amount) })) as InboxItem[]);
    setIsLoaded(true);
  }, [enabled]);

  useEffect(() => {
    load();
  }, [load]);

  // Marks an item done (after its expense was added) and, if asked, remembers merchant → tag.
  const resolve = async (item: InboxItem, status: "accepted" | "dismissed", remember?: { tagId: string }) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    const supabase = createClient();
    const { error } = await supabase.from("inbox_items").update({ status }).eq("id", item.id);
    if (error) {
      setError(describe(error));
      await load();
      return false;
    }
    const key = remember && item.merchant ? merchantKey(item.merchant) : null;
    if (key && remember) {
      await supabase.from("merchant_rules").upsert({ pattern: key, tag_id: remember.tagId }, { onConflict: "user_id,pattern" });
    }
    return true;
  };

  return { items, isLoaded, error, reload: load, resolve };
}
