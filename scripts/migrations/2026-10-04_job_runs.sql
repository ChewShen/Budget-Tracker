-- ========================================================
-- A log of background jobs (nightly reminders, the nightly bill auto-add, weekly backups, Shortcut
-- errors), so a job that fails or stops running shows up in the app instead of only in logs that
-- are gone after an hour. Shown in Settings → Account, with a warning on Overview.
-- Run once in the Supabase SQL Editor, after 2026-10-01_instalments.sql. Safe to re-run.
-- ========================================================

-- 1. One row per run. user_id is set only for one account's own events (a Shortcut error);
--    app-wide jobs have none. detail is an error message or a short note, never anyone's data.
CREATE TABLE IF NOT EXISTS public.job_runs (
  id      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  job     text NOT NULL CHECK (job IN ('reminders', 'auto_bills', 'backup', 'ingest')),
  ran_at  timestamptz NOT NULL DEFAULT now(),
  ok      boolean NOT NULL,
  detail  text,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_job_runs_job_ran_at ON public.job_runs (job, ran_at DESC);

-- 2. Signed-in users read app-wide runs and their own events. Only the server (service role) and
--    the database itself write.
ALTER TABLE public.job_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Signed-in users read job runs" ON public.job_runs;
CREATE POLICY "Signed-in users read job runs" ON public.job_runs
  FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid());

-- 3. The nightly auto-add logs each run, and a failure instead of losing it with the rollback.
--    Otherwise the same as 2026-10-01_instalments.sql.
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

  BEGIN
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
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.job_runs (job, ok, detail) VALUES ('auto_bills', false, left(SQLERRM, 300));
    RETURN 0;
  END;

  INSERT INTO public.job_runs (job, ok) VALUES ('auto_bills', true);
  DELETE FROM public.job_runs WHERE ran_at < now() - interval '90 days';
  RETURN added;
END;
$$;

REVOKE ALL ON FUNCTION public.auto_log_bills() FROM PUBLIC, anon, authenticated;

-- Check: the table exists and the job logs a run (this adds any bills due today, as tonight would).
SELECT public.auto_log_bills() AS bills_added;
SELECT job, ran_at, ok, detail FROM public.job_runs ORDER BY ran_at DESC LIMIT 5;
