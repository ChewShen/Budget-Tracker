-- ========================================================
-- Safe Migration & Seed Script for Supabase (Personal Budget)
-- ========================================================

-- STEP 1: Relax user_id NOT NULL constraint so data can seed even before user auth is created
ALTER TABLE public.transactions ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.monthly_savings ALTER COLUMN user_id DROP NOT NULL;

-- STEP 2: Configure RLS policies to allow reading & writing with anon / local client
DROP POLICY IF EXISTS "Categories and tags are viewable by authenticated users" ON public.categories;
DROP POLICY IF EXISTS "Tags are viewable by authenticated users" ON public.tags;
DROP POLICY IF EXISTS "Allow public read categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public read tags" ON public.tags;
DROP POLICY IF EXISTS "Users can manage their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow all transactions access" ON public.transactions;
DROP POLICY IF EXISTS "Users can manage their monthly savings" ON public.monthly_savings;
DROP POLICY IF EXISTS "Allow all savings access" ON public.monthly_savings;

CREATE POLICY "Allow public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public read tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Allow all transactions access" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all savings access" ON public.monthly_savings FOR ALL USING (true) WITH CHECK (true);

-- STEP 3: Insert Categories & Tags
DO $$
DECLARE
  cat_id uuid;
BEGIN
  INSERT INTO public.categories (name, color) VALUES ('Food', '#f97316')
  ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color
  RETURNING id INTO cat_id;

  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Breakfast')
  ON CONFLICT (category_id, name) DO NOTHING;
  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Lunch')
  ON CONFLICT (category_id, name) DO NOTHING;
  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Dinner')
  ON CONFLICT (category_id, name) DO NOTHING;
  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Brunch')
  ON CONFLICT (category_id, name) DO NOTHING;
  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Morning Coffee')
  ON CONFLICT (category_id, name) DO NOTHING;
  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Snack')
  ON CONFLICT (category_id, name) DO NOTHING;
  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Supper')
  ON CONFLICT (category_id, name) DO NOTHING;
  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Breakfast & Lunch')
  ON CONFLICT (category_id, name) DO NOTHING;

  INSERT INTO public.categories (name, color) VALUES ('Transport', '#06b6d4')
  ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color
  RETURNING id INTO cat_id;

  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Petrol')
  ON CONFLICT (category_id, name) DO NOTHING;
  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Toll')
  ON CONFLICT (category_id, name) DO NOTHING;
  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Parking')
  ON CONFLICT (category_id, name) DO NOTHING;
  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Public Trans')
  ON CONFLICT (category_id, name) DO NOTHING;
  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Season Parking')
  ON CONFLICT (category_id, name) DO NOTHING;

  INSERT INTO public.categories (name, color) VALUES ('Home_Bills', '#3b82f6')
  ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color
  RETURNING id INTO cat_id;

  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Water')
  ON CONFLICT (category_id, name) DO NOTHING;
  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Electric')
  ON CONFLICT (category_id, name) DO NOTHING;
  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Cuckoo')
  ON CONFLICT (category_id, name) DO NOTHING;
  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Indah Water')
  ON CONFLICT (category_id, name) DO NOTHING;

  INSERT INTO public.categories (name, color) VALUES ('Self_care', '#ec4899')
  ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color
  RETURNING id INTO cat_id;

  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Haircut')
  ON CONFLICT (category_id, name) DO NOTHING;
  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Product')
  ON CONFLICT (category_id, name) DO NOTHING;

  INSERT INTO public.categories (name, color) VALUES ('Subscription', '#8b5cf6')
  ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color
  RETURNING id INTO cat_id;

  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'iCloud')
  ON CONFLICT (category_id, name) DO NOTHING;
  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Netflix')
  ON CONFLICT (category_id, name) DO NOTHING;
  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Youtube Premium')
  ON CONFLICT (category_id, name) DO NOTHING;
  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Youtube Membership')
  ON CONFLICT (category_id, name) DO NOTHING;

  INSERT INTO public.categories (name, color) VALUES ('Health', '#ef4444')
  ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color
  RETURNING id INTO cat_id;

  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Hospital')
  ON CONFLICT (category_id, name) DO NOTHING;
  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Clinic')
  ON CONFLICT (category_id, name) DO NOTHING;
  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Drugs')
  ON CONFLICT (category_id, name) DO NOTHING;

  INSERT INTO public.categories (name, color) VALUES ('Own_Interest', '#eab308')
  ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color
  RETURNING id INTO cat_id;

  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Guitar Class')
  ON CONFLICT (category_id, name) DO NOTHING;

  INSERT INTO public.categories (name, color) VALUES ('Entertainment', '#a855f7')
  ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color
  RETURNING id INTO cat_id;

  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Movie')
  ON CONFLICT (category_id, name) DO NOTHING;

  INSERT INTO public.categories (name, color) VALUES ('Shopping', '#10b981')
  ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color
  RETURNING id INTO cat_id;

  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Accessories')
  ON CONFLICT (category_id, name) DO NOTHING;
  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Groceries')
  ON CONFLICT (category_id, name) DO NOTHING;

  INSERT INTO public.categories (name, color) VALUES ('Others', '#6b7280')
  ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color
  RETURNING id INTO cat_id;

  INSERT INTO public.tags (category_id, name) VALUES (cat_id, 'Photo')
  ON CONFLICT (category_id, name) DO NOTHING;

END $$;

-- STEP 4: Insert Transactions (uses primary user ID if one exists, otherwise NULL)
DO $$
DECLARE
  target_user_id uuid := NULL;
BEGIN
  -- Check if there is an auth user created, otherwise proceed with NULL
  SELECT id INTO target_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

  -- Clear any existing transactions to prevent duplicate seeding
  TRUNCATE TABLE public.transactions;

  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-01', c.id, t.id, 15.9, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Brunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-01', c.id, t.id, 17.9, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Subscription' AND t.name = 'Youtube Premium';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-02', c.id, t.id, 80.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Home_Bills' AND t.name = 'Cuckoo';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-03', c.id, t.id, 17.6, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-04', c.id, t.id, 10.9, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Morning Coffee';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-04', c.id, t.id, 10.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-04', c.id, t.id, 21.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-04', c.id, t.id, 10.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Transport' AND t.name = 'Parking';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-05', c.id, t.id, 10.9, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Morning Coffee';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-05', c.id, t.id, 7.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-05', c.id, t.id, 10.2, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-06', c.id, t.id, 12.2, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Morning Coffee';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-06', c.id, t.id, 10.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-06', c.id, t.id, 12.2, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-06', c.id, t.id, 55.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Transport' AND t.name = 'Petrol';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-07', c.id, t.id, 10.2, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Breakfast';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-07', c.id, t.id, 7.4, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Morning Coffee';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-07', c.id, t.id, 7.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-07', c.id, t.id, 11.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Snack';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-07', c.id, t.id, 28.05, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-07', c.id, t.id, 52.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Self_care' AND t.name = 'Haircut';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-07', c.id, t.id, 29.9, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Subscription' AND t.name = 'Netflix';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-08', c.id, t.id, 29.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Others' AND t.name = 'Photo';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-08', c.id, t.id, 18.9, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-08', c.id, t.id, 14.6, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-09', c.id, t.id, 4.8, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Morning Coffee';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-09', c.id, t.id, 8.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-09', c.id, t.id, 11.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-09', c.id, t.id, 5.2, 'For next day (Aug 10)', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Breakfast';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-09', c.id, t.id, 220.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Own_Interest' AND t.name = 'Guitar Class';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-10', c.id, t.id, 9.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-10', c.id, t.id, 14.9, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-11', c.id, t.id, 7.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-11', c.id, t.id, 15.3, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-11', c.id, t.id, 3.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Snack';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-12', c.id, t.id, 13.1, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Brunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-12', c.id, t.id, 24.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-13', c.id, t.id, 9.1, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Breakfast';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-13', c.id, t.id, 24.3, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-13', c.id, t.id, 11.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Shopping' AND t.name = 'Accessories';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-14', c.id, t.id, 11.05, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Home_Bills' AND t.name = 'Water';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-14', c.id, t.id, 3.3, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Breakfast';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-14', c.id, t.id, 13.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-14', c.id, t.id, 3.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Morning Coffee';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-14', c.id, t.id, 27.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-14', c.id, t.id, 8.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Supper';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-15', c.id, t.id, 18.9, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Brunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-15', c.id, t.id, 19.3, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-16', c.id, t.id, 11.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-16', c.id, t.id, 15.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-16', c.id, t.id, 8.8, 'For next 2 day', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Breakfast';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-17', c.id, t.id, 10.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-17', c.id, t.id, 20.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Snack';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-17', c.id, t.id, 14.2, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-18', c.id, t.id, 12.7, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-18', c.id, t.id, 19.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-19', c.id, t.id, 15.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-19', c.id, t.id, 3.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Morning Coffee';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-19', c.id, t.id, 13.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-19', c.id, t.id, 21.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Shopping' AND t.name = 'Accessories';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-19', c.id, t.id, 51.3, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Transport' AND t.name = 'Petrol';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-20', c.id, t.id, 110.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Home_Bills' AND t.name = 'Electric';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-20', c.id, t.id, 13.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-20', c.id, t.id, 6.7, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Breakfast';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-20', c.id, t.id, 14.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-20', c.id, t.id, 90.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Home_Bills' AND t.name = 'Indah Water';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-21', c.id, t.id, 27.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-21', c.id, t.id, 27.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Entertainment' AND t.name = 'Movie';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-21', c.id, t.id, 4.2, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Transport' AND t.name = 'Toll';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-21', c.id, t.id, 6.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Transport' AND t.name = 'Parking';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-21', c.id, t.id, 13.7, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Brunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-22', c.id, t.id, 319.0, '', true
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Health' AND t.name = 'Hospital';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-22', c.id, t.id, 3.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Transport' AND t.name = 'Parking';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-22', c.id, t.id, 4.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Snack';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-22', c.id, t.id, 13.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-23', c.id, t.id, 11.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-23', c.id, t.id, 21.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-23', c.id, t.id, 1.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Transport' AND t.name = 'Parking';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-23', c.id, t.id, 15.9, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Breakfast';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-24', c.id, t.id, 7.9, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Morning Coffee';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-24', c.id, t.id, 10.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-24', c.id, t.id, 22.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Entertainment' AND t.name = 'Movie';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-24', c.id, t.id, 24.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-24', c.id, t.id, 10.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Health' AND t.name = 'Drugs';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-25', c.id, t.id, 18.86, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Brunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-25', c.id, t.id, 17.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-25', c.id, t.id, 3.9, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Subscription' AND t.name = 'iCloud';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-25', c.id, t.id, 10.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Subscription' AND t.name = 'Youtube Membership';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-26', c.id, t.id, 15.6, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Breakfast & Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-26', c.id, t.id, 17.9, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-27', c.id, t.id, 10.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Breakfast';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-27', c.id, t.id, 21.1, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-28', c.id, t.id, 21.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-28', c.id, t.id, 7.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Breakfast';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-28', c.id, t.id, 13.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-28', c.id, t.id, 3.8, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Supper';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-29', c.id, t.id, 18.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Brunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-29', c.id, t.id, 18.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-29', c.id, t.id, 120.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Transport' AND t.name = 'Season Parking';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-30', c.id, t.id, 2.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Transport' AND t.name = 'Parking';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-30', c.id, t.id, 29.0, 'Jaya Grocer + Mr.diy', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Shopping' AND t.name = 'Groceries';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-30', c.id, t.id, 12.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-30', c.id, t.id, 7.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Snack';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-31', c.id, t.id, 18.9, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Breakfast';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-08-31', c.id, t.id, 11.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-01', c.id, t.id, 19.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Breakfast';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-01', c.id, t.id, 9.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-01', c.id, t.id, 15.3, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-01', c.id, t.id, 20.9, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Subscription' AND t.name = 'Youtube Premium';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-01', c.id, t.id, 42.9, 'car wiper', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Shopping' AND t.name = 'Accessories';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-02', c.id, t.id, 21.9, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Breakfast & Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-02', c.id, t.id, 12.1, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-02', c.id, t.id, 5.67, 'nfc tag', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Shopping' AND t.name = 'Accessories';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-03', c.id, t.id, 8.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Breakfast';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-03', c.id, t.id, 13.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-03', c.id, t.id, 12.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-04', c.id, t.id, 6.9, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Breakfast';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-04', c.id, t.id, 7.9, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-04', c.id, t.id, 15.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-04', c.id, t.id, 5.2, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Supper';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-04', c.id, t.id, 5.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Snack';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-05', c.id, t.id, 18.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-05', c.id, t.id, 17.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-06', c.id, t.id, 12.2, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-06', c.id, t.id, 12.7, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Breakfast';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-06', c.id, t.id, 4.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Snack';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-06', c.id, t.id, 220.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Own_Interest' AND t.name = 'Guitar Class';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-06', c.id, t.id, 80.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Home_Bills' AND t.name = 'Cuckoo';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-07', c.id, t.id, 29.9, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Subscription' AND t.name = 'Netflix';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-07', c.id, t.id, 1.7, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Breakfast';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-07', c.id, t.id, 17.6, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-07', c.id, t.id, 21.1, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-08', c.id, t.id, 4.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Breakfast';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-08', c.id, t.id, 13.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-08', c.id, t.id, 16.9, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-09', c.id, t.id, 18.9, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Breakfast & Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-09', c.id, t.id, 17.4, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-10', c.id, t.id, 14.3, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Breakfast & Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-10', c.id, t.id, 25.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-11', c.id, t.id, 10.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-11', c.id, t.id, 16.7, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-11', c.id, t.id, 7.7, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Supper';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-12', c.id, t.id, 6.6, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Breakfast';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-12', c.id, t.id, 18.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-12', c.id, t.id, 15.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-12', c.id, t.id, 4.6, 'baking soda', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Shopping' AND t.name = 'Accessories';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-12', c.id, t.id, 9.9, 'hydrogen peroxide', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Shopping' AND t.name = 'Accessories';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-12', c.id, t.id, 25.0, 'guitar strap', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Shopping' AND t.name = 'Accessories';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-12', c.id, t.id, 7.9, 'Brush', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Shopping' AND t.name = 'Accessories';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-13', c.id, t.id, 19.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Breakfast';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-13', c.id, t.id, 12.8, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-13', c.id, t.id, 12.6, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-13', c.id, t.id, 7.7, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Snack';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-13', c.id, t.id, 51.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Transport' AND t.name = 'Petrol';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-14', c.id, t.id, 13.3, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-14', c.id, t.id, 9.9, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-15', c.id, t.id, 18.9, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Breakfast & Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-15', c.id, t.id, 30.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-16', c.id, t.id, 15.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-16', c.id, t.id, 18.28, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-16', c.id, t.id, 1.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Transport' AND t.name = 'Toll';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-17', c.id, t.id, 15.3, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Breakfast & Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-17', c.id, t.id, 21.7, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-17', c.id, t.id, 10.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Subscription' AND t.name = 'Youtube Membership';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-17', c.id, t.id, 7.15, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Home_Bills' AND t.name = 'Water';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-18', c.id, t.id, 1.6, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Morning Coffee';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-18', c.id, t.id, 10.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-18', c.id, t.id, 13.5, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Dinner';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-19', c.id, t.id, 17.3, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Breakfast';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-19', c.id, t.id, 10.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Food' AND t.name = 'Lunch';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-19', c.id, t.id, 52.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Self_care' AND t.name = 'Haircut';
  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT target_user_id, '2026-09-19', c.id, t.id, 58.0, '', false
  FROM public.categories c
  JOIN public.tags t ON t.category_id = c.id
  WHERE c.name = 'Self_care' AND t.name = 'Product';

  -- Insert Monthly Savings
  DELETE FROM public.monthly_savings;
  INSERT INTO public.monthly_savings (user_id, month, main_checking, gx_bank, gx_rate, ryt_bank, ryt_rate, epf_locked)
  VALUES (target_user_id, '2026-08-01', 0.0, 3558.62, 0.0355, 0.0, 0.0, 10.0);
  INSERT INTO public.monthly_savings (user_id, month, main_checking, gx_bank, gx_rate, ryt_bank, ryt_rate, epf_locked)
  VALUES (target_user_id, '2026-09-01', 0.0, 0.0, 0.0355, 0.0, 0.0, 0.0);
  INSERT INTO public.monthly_savings (user_id, month, main_checking, gx_bank, gx_rate, ryt_bank, ryt_rate, epf_locked)
  VALUES (target_user_id, '2026-10-01', 0.0, 0.0, 0.0355, 0.0, 0.0, 0.0);
  INSERT INTO public.monthly_savings (user_id, month, main_checking, gx_bank, gx_rate, ryt_bank, ryt_rate, epf_locked)
  VALUES (target_user_id, '2026-11-01', 0.0, 0.0, 0.0355, 0.0, 0.0, 0.0);
  INSERT INTO public.monthly_savings (user_id, month, main_checking, gx_bank, gx_rate, ryt_bank, ryt_rate, epf_locked)
  VALUES (target_user_id, '2026-12-01', 0.0, 0.0, 0.0355, 0.0, 0.0, 0.0);
END $$;

-- Verification query:
SELECT 'Categories:' AS entity, count(*) FROM public.categories
UNION ALL
SELECT 'Tags:' AS entity, count(*) FROM public.tags
UNION ALL
SELECT 'Transactions:' AS entity, count(*) FROM public.transactions
UNION ALL
SELECT 'Monthly Savings:' AS entity, count(*) FROM public.monthly_savings;
