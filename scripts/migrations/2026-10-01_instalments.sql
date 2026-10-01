-- ========================================================
-- Instalment plans: a monthly bill that ends. Bought a goal on instalments (or added a plan in
-- Settings → Monthly bills): N payments of expected_amount from start_month, then it stops.
-- Run once in the Supabase SQL Editor, after 2026-09-28_auto_bills.sql and
-- 2026-09-30_multi_user.sql. Safe to re-run.
-- ========================================================

-- 1. Plan columns on monthly bills. Ongoing bills leave them empty.
ALTER TABLE public.recurring_sentinel
  ADD COLUMN IF NOT EXISTS installment_count smallint
    CHECK (installment_count IS NULL OR installment_count BETWEEN 1 AND 120),
  ADD COLUMN IF NOT EXISTS start_month date
    CHECK (start_month IS NULL OR EXTRACT(DAY FROM start_month) = 1),          -- first payment, YYYY-MM-01
  ADD COLUMN IF NOT EXISTS goal_id uuid REFERENCES public.goals ON DELETE SET NULL,  -- goal it paid for
  ADD COLUMN IF NOT EXISTS cash_price numeric(12, 2)
    CHECK (cash_price IS NULL OR cash_price >= 0),                              -- price if paid upfront
  ADD COLUMN IF NOT EXISTS down_payment numeric(12, 2)
    CHECK (down_payment IS NULL OR down_payment >= 0);

-- A plan needs both its length and first month, plus a monthly amount and a due day.
ALTER TABLE public.recurring_sentinel DROP CONSTRAINT IF EXISTS recurring_sentinel_plan_complete;
ALTER TABLE public.recurring_sentinel
  ADD CONSTRAINT recurring_sentinel_plan_complete CHECK (
    (installment_count IS NULL AND start_month IS NULL)
    OR (installment_count IS NOT NULL AND start_month IS NOT NULL
        AND expected_amount IS NOT NULL AND due_day IS NOT NULL)
  );

-- 2. Bills may only point at your own tag, and your own goal.
DROP POLICY IF EXISTS "Owner manages recurring" ON public.recurring_sentinel;
CREATE POLICY "Owner manages recurring" ON public.recurring_sentinel
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.tags t WHERE t.id = tag_id AND t.user_id = auth.uid())
    AND (goal_id IS NULL OR EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.user_id = auth.uid()))
  );

-- 3. The daily auto-add job (pg_cron, 00:05 Malaysia time) skips plans outside their months.
--    Same as 2026-09-28_auto_bills.sql otherwise; the schedule there is unchanged.
CREATE OR REPLACE FUNCTION public.auto_log_bills()
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  today       date := (now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date;
  month_start date := date_trunc('month', today)::date;
  month_end   date := (date_trunc('month', today) + interval '1 month - 1 day')::date;
  added       integer;
BEGIN
  -- One run at a time, so a manual run and the scheduled run can't double-insert.
  PERFORM pg_advisory_xact_lock(hashtext('auto_log_bills'));

  INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount, description, is_one_off)
  SELECT due.user_id, due.due_date, due.category_id, due.tag_id, due.expected_amount,
         'Auto-added monthly bill', false
  FROM (
    SELECT r.user_id, r.tag_id, r.expected_amount, t.category_id,
           (month_start + (LEAST(r.due_day, EXTRACT(DAY FROM month_end)::int) - 1))::date AS due_date
    FROM public.recurring_sentinel r
    JOIN public.tags t ON t.id = r.tag_id
    WHERE r.is_active AND r.auto_log
      AND r.expected_amount IS NOT NULL AND r.due_day IS NOT NULL
      -- Instalment plans: only from the first payment month to the last.
      AND (r.installment_count IS NULL
           OR (month_start >= r.start_month
               AND month_start < (r.start_month + make_interval(months => r.installment_count))::date))
  ) due
  WHERE due.due_date <= today
    AND NOT EXISTS (
      SELECT 1 FROM public.transactions x
      WHERE x.user_id = due.user_id
        AND x.tag_id = due.tag_id
        AND x.date BETWEEN month_start AND month_end
    );

  GET DIAGNOSTICS added = ROW_COUNT;
  RETURN added;
END;
$$;

REVOKE ALL ON FUNCTION public.auto_log_bills() FROM PUBLIC, anon, authenticated;

-- 4. Check: plans and where they are.
SELECT t.name AS plan, r.expected_amount AS monthly, r.installment_count AS payments,
       to_char(r.start_month, 'YYYY-MM') AS first_month,
       to_char(r.start_month + make_interval(months => r.installment_count - 1), 'YYYY-MM') AS last_month
FROM public.recurring_sentinel r
JOIN public.tags t ON t.id = r.tag_id
WHERE r.installment_count IS NOT NULL
ORDER BY r.start_month;
