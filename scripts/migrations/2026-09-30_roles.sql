-- ========================================================
-- Marks for the category and tags the app relies on, so they can be renamed freely:
--   categories.role = 'food'  -> the "Food & dining" card on Overview
--   tags.role = 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'supper'
--                             -> the tag Add expense picks for the time of day
-- Run once in the Supabase SQL Editor, after 2026-09-30_multi_user.sql. Safe to re-run.
-- ========================================================

-- 1. Columns: at most one of each mark per account.
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS role text CHECK (role IN ('food'));
ALTER TABLE public.tags       ADD COLUMN IF NOT EXISTS role text
  CHECK (role IN ('breakfast', 'lunch', 'snack', 'dinner', 'supper'));

CREATE UNIQUE INDEX IF NOT EXISTS categories_user_role_key ON public.categories (user_id, role) WHERE role IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS tags_user_role_key       ON public.tags (user_id, role)       WHERE role IS NOT NULL;

-- 2. Mark what the app used to find by name: each account's "Food" category and the meal
--    tags in it. Accounts that already have a mark are left alone.
UPDATE public.categories c SET role = 'food'
WHERE lower(c.name) = 'food'
  AND NOT EXISTS (SELECT 1 FROM public.categories o WHERE o.user_id = c.user_id AND o.role = 'food');

UPDATE public.tags t SET role = lower(t.name)
FROM public.categories c
WHERE c.id = t.category_id AND c.role = 'food'
  AND lower(t.name) IN ('breakfast', 'lunch', 'snack', 'dinner', 'supper')
  AND t.role IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.tags o WHERE o.user_id = t.user_id AND o.role = lower(t.name));

-- 3. New accounts: the default set now comes with the marks (and a Supper tag for late nights).
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
      ('Food',          ARRAY['Breakfast', 'Lunch', 'Dinner', 'Supper', 'Coffee', 'Snack', 'Groceries']),
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
    INSERT INTO public.categories (user_id, name, role)
    VALUES (p_user, r.name, CASE WHEN r.name = 'Food' THEN 'food' END)
    RETURNING id INTO v_cat;

    INSERT INTO public.tags (user_id, category_id, name, role)
    SELECT p_user, v_cat, tag,
           CASE WHEN r.name = 'Food' AND lower(tag) IN ('breakfast', 'lunch', 'snack', 'dinner', 'supper')
                THEN lower(tag) END
    FROM unnest(r.tags) AS tag;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.seed_new_user(uuid) FROM PUBLIC, anon, authenticated;

-- 4. Check: the marks per account (renaming keeps them; the app no longer looks at these names).
SELECT u.email, c.name AS food_category,
       (SELECT string_agg(t.name || ' = ' || t.role, ', ' ORDER BY t.role)
        FROM public.tags t WHERE t.user_id = u.id AND t.role IS NOT NULL) AS meal_tags
FROM auth.users u
LEFT JOIN public.categories c ON c.user_id = u.id AND c.role = 'food'
ORDER BY u.created_at;
