-- ========================================================
-- Reminders (phone notifications): which devices to notify, which reminders you
-- want, and what was already sent. Run once in the Supabase SQL Editor; safe to re-run.
-- The sender is the Vercel cron job at /api/reminders (see README > Reminders).
-- ========================================================

-- 1. One row per device (browser / home-screen app) that allowed notifications.
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE,
  endpoint     text NOT NULL UNIQUE,
  p256dh       text NOT NULL,
  auth         text NOT NULL,
  device       text,                                   -- e.g. "iPhone", shown in Settings
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions (user_id);

-- 2. Which reminders to send. No row = the defaults below.
CREATE TABLE IF NOT EXISTS public.reminder_settings (
  user_id    uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE,
  bills      boolean NOT NULL DEFAULT true,   -- bill due tomorrow / overdue
  vouchers   boolean NOT NULL DEFAULT true,   -- goal voucher expiring
  budgets    boolean NOT NULL DEFAULT true,   -- budget at 80% / over
  daily_log  boolean NOT NULL DEFAULT false,  -- nothing logged today
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Reminders already sent, so each one goes out once. Written by the sender only.
CREATE TABLE IF NOT EXISTS public.reminder_log (
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  key     text NOT NULL,                      -- e.g. "budget:<category>:2026-09:over"
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);

-- Owner-only access. reminder_log has RLS on and no policies: only the service role
-- (the sender) can touch it.
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_log       ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner manages push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Owner manages reminder settings"  ON public.reminder_settings;

CREATE POLICY "Owner manages push subscriptions" ON public.push_subscriptions
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner manages reminder settings" ON public.reminder_settings
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Check: all three tables exist with RLS on.
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('push_subscriptions', 'reminder_settings', 'reminder_log');
