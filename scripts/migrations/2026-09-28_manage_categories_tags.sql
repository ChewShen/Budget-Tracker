-- ========================================================
-- Let the signed-in owner add, rename and delete categories and tags.
-- Run once in the Supabase SQL Editor (safe to re-run).
-- ========================================================
-- Categories and tags are shared lookup tables (no user_id). Sign-up is disabled,
-- so "authenticated" is only the owner. Transactions keep their FK to tags and
-- categories, so a category or tag that is still used by an expense can't be deleted.

-- 1. Optional icon per category (lucide icon key, e.g. 'utensils'); NULL = pick by name.
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon text;

-- 2. Write access for the signed-in owner (reads were already allowed).
DROP POLICY IF EXISTS "Signed-in users manage categories" ON public.categories;
DROP POLICY IF EXISTS "Signed-in users manage tags"       ON public.tags;

CREATE POLICY "Signed-in users manage categories" ON public.categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Signed-in users manage tags" ON public.tags
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Check: categories and tags should each list a read and a manage policy, TO authenticated.
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('categories', 'tags')
ORDER BY tablename, policyname;
