-- ========================================================
-- Monthly budgets per category. Run once in the Supabase SQL Editor; safe to re-run.
-- ========================================================

CREATE TABLE IF NOT EXISTS public.budgets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE,
  category_id   uuid NOT NULL REFERENCES public.categories ON DELETE CASCADE,
  monthly_limit numeric(12, 2) NOT NULL CHECK (monthly_limit > 0),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, category_id)
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner manages budgets" ON public.budgets;
CREATE POLICY "Owner manages budgets" ON public.budgets
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Check: table exists with RLS on.
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'budgets';
