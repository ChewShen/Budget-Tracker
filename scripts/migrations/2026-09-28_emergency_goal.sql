-- ========================================================
-- Emergency fund goal (months of spending) on the Savings page. Run once; safe to re-run.
-- ========================================================
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS emergency_months smallint NOT NULL DEFAULT 6
  CHECK (emergency_months BETWEEN 1 AND 24);

-- Check: your goal (6 unless you've changed it).
SELECT email, emergency_months FROM public.user_profiles;
