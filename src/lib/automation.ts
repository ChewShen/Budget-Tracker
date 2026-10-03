"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "./supabase/client";
import { normalizeMerchant } from "./ingest";
import type { Tag } from "./types";

// Browser side of automation (cloud accounts only): personal tokens for /api/ingest, the Inbox
// of captured expenses, and merchant rules (shops it remembers).

// The ready-made "Log Payment" Shortcut, shared from iCloud. Its first action is a Text box with an
// Import Question ("Paste your token from Settings → Automation"), so adding it asks for the token;
// the box was empty when shared. Checked: no token in the shared file. Set to null to show only the
// build-it-yourself steps.
export const SHORTCUT_URL: string | null = "https://www.icloud.com/shortcuts/15788f25fab74a8392166961dd878902";

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

  // Marks an item done (after its expense was added) or dismissed.
  const resolve = async (item: InboxItem, status: "accepted" | "dismissed") => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    const { error } = await createClient().from("inbox_items").update({ status }).eq("id", item.id);
    if (error) {
      setError(describe(error));
      await load();
      return false;
    }
    return true;
  };

  return { items, isLoaded, error, reload: load, resolve };
}

// ---- Shops it remembers (merchant rules) ----

export interface MerchantRule {
  id: string;
  pattern: string; // normalised words matched in the merchant name, e.g. "TEALIVE", "GRAB FOOD"
  category_id: string | null;
  tag_id: string | null; // null: any tag (the meal by time for Food, otherwise you choose)
  created_at: string;
}

export const RULES_MIGRATION_HINT = "Run scripts/migrations/2026-10-04_merchant_rule_categories.sql in Supabase to remember a category on its own.";
const MISSING_COLUMN = ["42703", "PGRST204"];

// Rules for the signed-in account. Before 2026-10-04_merchant_rule_categories.sql rules only have
// a tag; they still load (category taken from the tag) and can be saved with a tag.
export function useMerchantRules(enabled: boolean, tags: Tag[]) {
  const [rows, setRows] = useState<MerchantRule[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsMigration, setNeedsMigration] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) return setIsLoaded(true);
    const supabase = createClient();
    const res = await supabase.from("merchant_rules").select("id, pattern, category_id, tag_id, created_at").order("pattern");
    if (!res.error) {
      setNeedsMigration(false);
      setRows(res.data as MerchantRule[]);
    } else if (MISSING_TABLE.includes(res.error.code || "")) {
      setRows([]); // no automation tables yet
    } else if (!MISSING_COLUMN.includes(res.error.code || "")) {
      setError(describe(res.error));
    } else {
      setNeedsMigration(true);
      const old = await supabase.from("merchant_rules").select("id, pattern, tag_id, created_at").order("pattern");
      if (old.error) setError(describe(old.error));
      else setRows((old.data || []).map((r) => ({ ...r, category_id: null }) as MerchantRule));
    }
    setIsLoaded(true);
  }, [enabled]);

  useEffect(() => {
    load();
  }, [load]);

  // Older rules have no category: it's their tag's.
  const rules = useMemo(
    () => rows.map((r) => (r.category_id ? r : { ...r, category_id: tags.find((t) => t.id === r.tag_id)?.category_id ?? null })),
    [rows, tags]
  );

  // Adds or replaces the rule for a shop. Returns false (and sets the error) if it couldn't.
  const save = async (pattern: string, categoryId: string, tagId: string | null) => {
    const key = normalizeMerchant(pattern);
    if (!key || !categoryId) return false;
    if (needsMigration && !tagId) {
      setError(RULES_MIGRATION_HINT);
      return false;
    }
    const row: Record<string, string | null> = { pattern: key, tag_id: tagId };
    if (!needsMigration) row.category_id = categoryId;
    const { error } = await createClient().from("merchant_rules").upsert(row, { onConflict: "user_id,pattern" });
    if (error) {
      setError(describe(error));
      return false;
    }
    setError(null);
    await load();
    return true;
  };

  const remove = async (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    const { error } = await createClient().from("merchant_rules").delete().eq("id", id);
    if (error) setError(describe(error));
    await load();
  };

  return { rules, isLoaded, error, needsMigration, save, remove, reload: load };
}
