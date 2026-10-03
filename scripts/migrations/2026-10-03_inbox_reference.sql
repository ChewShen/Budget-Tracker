-- ========================================================
-- Inbox duplicates: remember each capture's reference numbers (e.g. TnG's DuitNow Ref No. or
-- Transaction No.), so double-tapping the same receipt twice doesn't add it twice.
-- Run once in the Supabase SQL Editor, after 2026-10-03_inbox.sql. Safe to re-run.
-- ========================================================

ALTER TABLE public.inbox_items ADD COLUMN IF NOT EXISTS reference text;

CREATE INDEX IF NOT EXISTS idx_inbox_items_user_reference
  ON public.inbox_items (user_id, reference) WHERE reference IS NOT NULL;

-- Check: the column exists.
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'inbox_items' AND column_name = 'reference';
