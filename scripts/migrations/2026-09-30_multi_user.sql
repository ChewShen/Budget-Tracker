-- ========================================================
-- Multiple users: each account gets its own categories and tags, and new accounts
-- start with a default set. Everything else (expenses, savings, bills, goals, budgets,
-- reminders) was already per user. Run once in the Supabase SQL Editor; safe to re-run.
-- ========================================================
-- Before: categories and tags were shared by every signed-in user (anyone could rename
-- or delete them) and category names were unique across the whole database.
-- Existing categories and tags are given to the current owner: the account with the
-- most expenses (or the first account, if there are no expenses yet).

-- 1. Owner column on categories and tags.
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users ON DELETE CASCADE;
ALTER TABLE public.tags       ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users ON DELETE CASCADE;

DO $$
DECLARE v_owner uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id IS NULL)
     AND NOT EXISTS (SELECT 1 FROM public.tags WHERE user_id IS NULL) THEN
    RETURN;
  END IF;

  SELECT user_id INTO v_owner FROM public.transactions
  GROUP BY user_id ORDER BY count(*) DESC LIMIT 1;
  IF v_owner IS NULL THEN
    SELECT id INTO v_owner FROM auth.users ORDER BY created_at LIMIT 1;
  END IF;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'No accounts yet. Create yours in Authentication -> Users, then run this again.';
  END IF;

  UPDATE public.categories SET user_id = v_owner WHERE user_id IS NULL;
  -- A tag belongs to whoever owns its category.
  UPDATE public.tags t SET user_id = c.user_id
  FROM public.categories c
  WHERE c.id = t.category_id AND t.user_id IS NULL;
END $$;

ALTER TABLE public.categories ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.tags       ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.categories ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.tags       ALTER COLUMN user_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories (user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user       ON public.tags (user_id);

-- 2. Category names are unique per person, not across the database
--    (drops the old UNIQUE (name), whatever it's called).
DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT con.conname FROM pg_constraint con
    WHERE con.conrelid = 'public.categories'::regclass AND con.contype = 'u'
      AND con.conkey = ARRAY[(SELECT attnum FROM pg_attribute
                              WHERE attrelid = 'public.categories'::regclass AND attname = 'name')]
  LOOP
    EXECUTE format('ALTER TABLE public.categories DROP CONSTRAINT %I', c.conname);
  END LOOP;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_user_name_key') THEN
    ALTER TABLE public.categories ADD CONSTRAINT categories_user_name_key UNIQUE (user_id, name);
  END IF;
END $$;

-- 3. Owner-only categories and tags (replaces every existing policy on them).
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT tablename, policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename IN ('categories', 'tags')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

CREATE POLICY "Owner manages categories" ON public.categories
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- A tag can only go in one of your own categories.
CREATE POLICY "Owner manages tags" ON public.tags
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.categories c WHERE c.id = category_id AND c.user_id = auth.uid())
  );

-- 4. Expenses, bills and budgets can only point at your own categories and tags.
DROP POLICY IF EXISTS "Owner manages transactions" ON public.transactions;
CREATE POLICY "Owner manages transactions" ON public.transactions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.categories c WHERE c.id = category_id AND c.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.tags t WHERE t.id = tag_id AND t.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Owner manages recurring" ON public.recurring_sentinel;
CREATE POLICY "Owner manages recurring" ON public.recurring_sentinel
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.tags t WHERE t.id = tag_id AND t.user_id = auth.uid())
  );

DO $$
BEGIN
  IF to_regclass('public.budgets') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Owner manages budgets" ON public.budgets;
    CREATE POLICY "Owner manages budgets" ON public.budgets
      FOR ALL TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (SELECT 1 FROM public.categories c WHERE c.id = category_id AND c.user_id = auth.uid())
      );
  END IF;
END $$;

-- 5. New accounts start with a profile and a default set of categories and tags
--    (the same generic set as the demo). Does nothing for accounts that already have categories.
CREATE OR REPLACE FUNCTION public.seed_new_user(p_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r     record;
  v_cat uuid;
BEGIN
  INSERT INTO public.user_profiles (id, email)
  SELECT u.id, u.email FROM auth.users u WHERE u.id = p_user
  ON CONFLICT (id) DO NOTHING;

  IF EXISTS (SELECT 1 FROM public.categories WHERE user_id = p_user) THEN
    RETURN;
  END IF;

  FOR r IN
    SELECT * FROM (VALUES
      ('Food',          ARRAY['Breakfast', 'Lunch', 'Dinner', 'Coffee', 'Snack', 'Groceries']),
      ('Transport',     ARRAY['Petrol', 'Parking', 'Toll', 'Grab', 'Season Parking']),
      ('Home_Bills',    ARRAY['Electric', 'Water', 'Internet', 'Phone']),
      ('Subscription',  ARRAY['Netflix', 'Spotify', 'iCloud']),
      ('Shopping',      ARRAY['Clothes', 'Household']),
      ('Health',        ARRAY['Clinic', 'Pharmacy']),
      ('Entertainment', ARRAY['Movie', 'Games']),
      ('Self_care',     ARRAY['Haircut', 'Skincare']),
      ('Own_Interest',  ARRAY['Gym', 'Books']),
      ('Others',        ARRAY['Gifts'])
    ) AS d(name, tags)
  LOOP
    INSERT INTO public.categories (user_id, name) VALUES (p_user, r.name) RETURNING id INTO v_cat;
    INSERT INTO public.tags (user_id, category_id, name) SELECT p_user, v_cat, unnest(r.tags);
  END LOOP;
END;
$$;

-- Only the trigger below (and this script) may run it; not callable from the app's API keys.
REVOKE ALL ON FUNCTION public.seed_new_user(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.seed_new_user(NEW.id);
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Accounts created before this migration: a profile, and the defaults if they have no categories.
SELECT public.seed_new_user(id) FROM auth.users;

-- 6. Checks.
-- Categories and tags per account (yours unchanged; any other account gets the defaults).
SELECT u.email,
       (SELECT count(*) FROM public.categories c WHERE c.user_id = u.id) AS categories,
       (SELECT count(*) FROM public.tags t WHERE t.user_id = u.id)       AS tags,
       (SELECT count(*) FROM public.transactions x WHERE x.user_id = u.id) AS expenses
FROM auth.users u ORDER BY u.created_at;

-- Should be 0: expenses pointing at someone else's category or tag.
SELECT count(*) AS cross_account_expenses
FROM public.transactions x
JOIN public.tags t ON t.id = x.tag_id
WHERE t.user_id <> x.user_id;

-- Policies on categories and tags: only the two owner policies.
SELECT tablename, policyname, roles, cmd FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('categories', 'tags')
ORDER BY tablename;
