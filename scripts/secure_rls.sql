-- ========================================================
-- Lock the database to your account only (run ONCE, after creating your user)
-- ========================================================
-- Before running:
--   1. Supabase Dashboard -> Authentication -> Users -> "Add user" -> "Create new user"
--      with your email + a strong password, and tick "Auto Confirm User".
--   2. Replace you@example.com below with that same email.
--   3. Paste this whole file into the SQL Editor and click Run.
--
-- Safe to re-run. WARNING: do not re-run scripts/seed_data.sql afterwards;
-- its STEP 2 re-creates the old "allow everyone" policies.
-- ========================================================

DO $$
DECLARE
  v_email text := 'chewshen012@gmail.com';  -- <-- CHANGE THIS
  v_user  uuid;
BEGIN
  SELECT id INTO v_user FROM auth.users WHERE email = v_email;
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'No auth user with email %. Create it first in Authentication -> Users.', v_email;
  END IF;

  -- 1. Seeded rows have no owner yet. Remove duplicate unowned savings months
  --    (they would break unique(user_id, month)), then assign everything to you.
  DELETE FROM public.monthly_savings a
  USING public.monthly_savings b
  WHERE a.user_id IS NULL AND b.user_id IS NULL
    AND a.month = b.month AND a.ctid < b.ctid;

  DELETE FROM public.monthly_savings s
  WHERE s.user_id IS NULL
    AND EXISTS (SELECT 1 FROM public.monthly_savings o WHERE o.user_id = v_user AND o.month = s.month);

  UPDATE public.transactions       SET user_id = v_user WHERE user_id IS NULL;
  UPDATE public.monthly_savings    SET user_id = v_user WHERE user_id IS NULL;
  UPDATE public.recurring_sentinel SET user_id = v_user WHERE user_id IS NULL;

  INSERT INTO public.user_profiles (id, email)
  VALUES (v_user, v_email)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- 2. New rows are owned by whoever is signed in, and ownership is required.
ALTER TABLE public.transactions       ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.monthly_savings    ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.recurring_sentinel ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.transactions       ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.monthly_savings    ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.recurring_sentinel ALTER COLUMN user_id SET NOT NULL;

-- 3. RLS on every table (recurring_sentinel was missing it).
ALTER TABLE public.user_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_savings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_sentinel ENABLE ROW LEVEL SECURITY;

-- 4. Replace ALL existing policies (whatever their names) with owner-only ones.
--    Dropping by name missed older policies, e.g. an open one on recurring_sentinel.
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT tablename, policyname FROM pg_policies
           WHERE schemaname = 'public'
             AND tablename IN ('user_profiles', 'categories', 'tags', 'transactions',
                               'monthly_savings', 'recurring_sentinel')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

CREATE POLICY "Signed-in users read categories" ON public.categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Signed-in users read tags" ON public.tags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Owner manages transactions" ON public.transactions
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner manages savings" ON public.monthly_savings
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner manages recurring" ON public.recurring_sentinel
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner manages profile" ON public.user_profiles
  FOR ALL TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- 5. Check: should list only the policies above, all TO authenticated.
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
