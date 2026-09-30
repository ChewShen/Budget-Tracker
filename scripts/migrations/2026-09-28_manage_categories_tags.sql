-- ========================================================
-- Let the signed-in owner add, rename and delete categories and tags.
-- Run once in the Supabase SQL Editor (safe to re-run).
-- ========================================================
-- At this point categories and tags were shared lookup tables (no user_id) and sign-up was
-- disabled, so "authenticated" was only the owner. 2026-09-30_multi_user.sql later gives
-- each account its own. Transactions keep their FK to tags and
-- categories, so a category or tag that is still used by an expense can't be deleted.

-- 1. Optional icon per category (lucide icon key, e.g. 'utensils'); NULL = pick by name.
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon text;

-- 2. Write access for the signed-in owner (reads were already allowed).
--    Skipped once 2026-09-30_multi_user.sql has run: categories and tags then have
--    per-account policies, and these open ones would expose them to every account.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'user_id') THEN
    RAISE NOTICE 'Categories already belong to accounts (multi-user migration); policies left as they are.';
    RETURN;
  END IF;

  DROP POLICY IF EXISTS "Signed-in users manage categories" ON public.categories;
  DROP POLICY IF EXISTS "Signed-in users manage tags"       ON public.tags;

  CREATE POLICY "Signed-in users manage categories" ON public.categories
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

  CREATE POLICY "Signed-in users manage tags" ON public.tags
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
END $$;

-- 3. Check: categories and tags should each list a read and a manage policy, TO authenticated.
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('categories', 'tags')
ORDER BY tablename, policyname;
