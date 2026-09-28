-- ========================================================
-- Auto-add monthly bills on their due day (daily pg_cron job).
-- Run once in the Supabase SQL Editor, after 2026-09-28_monthly_bills.sql. Safe to re-run.
-- ========================================================
-- If step 3 fails with "extension pg_cron is not available / permission denied",
-- enable it in Dashboard -> Database -> Extensions -> pg_cron, then run this file again.

-- 1. Per-bill switch. Auto-add needs a fixed amount and a due day.
ALTER TABLE public.recurring_sentinel
  ADD COLUMN IF NOT EXISTS auto_log boolean NOT NULL DEFAULT false;

ALTER TABLE public.recurring_sentinel DROP CONSTRAINT IF EXISTS recurring_sentinel_auto_log_needs_amount_day;
ALTER TABLE public.recurring_sentinel
  ADD CONSTRAINT recurring_sentinel_auto_log_needs_amount_day
  CHECK (NOT auto_log OR (expected_amount IS NOT NULL AND due_day IS NOT NULL));

-- 2. Adds this month's expense for every active auto bill whose due day has arrived
--    (Malaysia time) and that has no expense with its tag this month yet.
--    Due days past the month's end fall on its last day (31 -> 30 Sep / 28 Feb).
--    Returns how many expenses it added.
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

-- Only the scheduler (postgres) may run it; not callable from the app's API keys.
REVOKE ALL ON FUNCTION public.auto_log_bills() FROM PUBLIC, anon, authenticated;

-- 3. Run it every day at 00:05 Malaysia time (16:05 UTC).
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'auto-log-monthly-bills';
SELECT cron.schedule('auto-log-monthly-bills', '5 16 * * *', 'SELECT public.auto_log_bills()');

-- 4. Check: the job is scheduled, and a manual run (adds anything already due; 0 until you switch bills on).
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'auto-log-monthly-bills';
SELECT public.auto_log_bills() AS added_now;
