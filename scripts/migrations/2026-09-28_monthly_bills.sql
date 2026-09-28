-- ========================================================
-- Monthly bills: make recurring_sentinel the editable list behind the
-- "Monthly bills" card (Settings > Monthly bills). Run once; safe to re-run.
-- ========================================================

-- 1. Optional expected amount and due day per bill.
ALTER TABLE public.recurring_sentinel
  ADD COLUMN IF NOT EXISTS expected_amount numeric(10, 2) CHECK (expected_amount IS NULL OR expected_amount > 0),
  ADD COLUMN IF NOT EXISTS due_day smallint CHECK (due_day IS NULL OR due_day BETWEEN 1 AND 31);

-- 2. One row per bill: remove duplicate (user, tag) rows, then enforce it.
DELETE FROM public.recurring_sentinel a
USING public.recurring_sentinel b
WHERE a.user_id = b.user_id AND a.tag_id = b.tag_id AND a.ctid < b.ctid;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recurring_sentinel_user_tag_key') THEN
    ALTER TABLE public.recurring_sentinel
      ADD CONSTRAINT recurring_sentinel_user_tag_key UNIQUE (user_id, tag_id);
  END IF;
END $$;

-- 3. Carry over the bills the app used to hard-code, for the owner (the user who owns the expenses).
--    Only adds ones that are missing; remove any you don't want in Settings.
INSERT INTO public.recurring_sentinel (user_id, tag_id, is_active)
SELECT owner.user_id, t.id, true
FROM public.tags t
CROSS JOIN (
  SELECT user_id FROM public.transactions WHERE user_id IS NOT NULL LIMIT 1
) owner
WHERE t.name IN ('Netflix', 'iCloud', 'Youtube Premium', 'Youtube Membership',
                 'Cuckoo', 'Electric', 'Water', 'Season Parking')
ON CONFLICT (user_id, tag_id) DO NOTHING;

-- 4. Check: your bills.
SELECT t.name AS bill, r.expected_amount, r.due_day, r.is_active
FROM public.recurring_sentinel r
JOIN public.tags t ON t.id = r.tag_id
ORDER BY t.name;
