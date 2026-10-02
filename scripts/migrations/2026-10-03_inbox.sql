-- ========================================================
-- Automation: personal tokens, an Inbox of expenses to confirm, and merchant rules.
-- An iPhone Shortcut (or any automation) sends what it captured (a TnG receipt's text, an
-- Apple Pay amount and merchant…) to /api/ingest with a personal token; it lands in the Inbox
-- with a suggested tag, and you confirm it into a real expense.
-- Run once in the Supabase SQL Editor, after 2026-09-30_multi_user.sql. Safe to re-run.
-- ========================================================

-- 1. Personal tokens. Only a SHA-256 hash is stored: the token itself is shown once, when it's
--    created, and can't be read back. Revoking keeps the row (so "last used" stays visible).
CREATE TABLE IF NOT EXISTS public.api_tokens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE,
  name         text NOT NULL CHECK (length(trim(name)) > 0),   -- e.g. "iPhone Shortcut"
  token_hash   text NOT NULL UNIQUE,                           -- hex SHA-256 of the token
  token_prefix text NOT NULL,                                  -- first characters, to tell tokens apart
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  revoked_at   timestamptz
);

CREATE INDEX IF NOT EXISTS idx_api_tokens_user ON public.api_tokens (user_id);

-- 2. Inbox: captured expenses waiting to be confirmed.
CREATE TABLE IF NOT EXISTS public.inbox_items (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE,
  source                text NOT NULL DEFAULT 'shortcut',     -- shortcut, tng, applepay, email, …
  raw_text              text,                                 -- what was sent, kept for checking
  amount                numeric(10, 2) CHECK (amount IS NULL OR amount > 0),
  merchant              text,
  occurred_on           date,
  suggested_category_id uuid REFERENCES public.categories ON DELETE SET NULL,
  suggested_tag_id      uuid REFERENCES public.tags ON DELETE SET NULL,
  status                text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'dismissed')),
  transaction_id        uuid REFERENCES public.transactions ON DELETE SET NULL,  -- the expense it became
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inbox_items_user_status ON public.inbox_items (user_id, status, created_at);

-- 3. Merchant rules: "TEALIVE" → Food / Coffee. Learned when you confirm an item.
CREATE TABLE IF NOT EXISTS public.merchant_rules (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE,
  pattern    text NOT NULL CHECK (length(trim(pattern)) > 0),  -- normalised merchant, matched as "contains"
  tag_id     uuid NOT NULL REFERENCES public.tags ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, pattern)
);

-- 4. Owner-only access, and references must be your own tags, categories and expenses.
--    The endpoint writes with the service role after checking the token, so it can only add
--    items for the token's owner.
ALTER TABLE public.api_tokens     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner manages api tokens"     ON public.api_tokens;
DROP POLICY IF EXISTS "Owner manages inbox items"    ON public.inbox_items;
DROP POLICY IF EXISTS "Owner manages merchant rules" ON public.merchant_rules;

CREATE POLICY "Owner manages api tokens" ON public.api_tokens
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner manages inbox items" ON public.inbox_items
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (suggested_tag_id IS NULL OR EXISTS (SELECT 1 FROM public.tags t WHERE t.id = suggested_tag_id AND t.user_id = auth.uid()))
    AND (suggested_category_id IS NULL OR EXISTS (SELECT 1 FROM public.categories c WHERE c.id = suggested_category_id AND c.user_id = auth.uid()))
    AND (transaction_id IS NULL OR EXISTS (SELECT 1 FROM public.transactions x WHERE x.id = transaction_id AND x.user_id = auth.uid()))
  );

CREATE POLICY "Owner manages merchant rules" ON public.merchant_rules
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.tags t WHERE t.id = tag_id AND t.user_id = auth.uid())
  );

-- Check: all three tables exist with RLS on.
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('api_tokens', 'inbox_items', 'merchant_rules');
