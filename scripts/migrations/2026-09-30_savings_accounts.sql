-- ========================================================
-- Savings accounts: each account tracks its own list (banks, e-wallets, EPF, investments…)
-- instead of the fixed Main checking / GXBank / RYT / EPF columns of monthly_savings.
-- Run once in the Supabase SQL Editor, after 2026-09-30_multi_user.sql. Safe to re-run.
-- ========================================================
-- Existing balances are copied over: one account per column you've used (same names; rename
-- them in Settings → Savings accounts) and one balance per account per recorded month.
-- monthly_savings is left as it was, as a backup; the app no longer reads it.

-- 1. Accounts.
CREATE TABLE IF NOT EXISTS public.savings_accounts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE,
  name       text NOT NULL CHECK (length(trim(name)) > 0),
  kind       text NOT NULL DEFAULT 'liquid' CHECK (kind IN ('liquid', 'locked')), -- locked = e.g. EPF
  position   integer NOT NULL DEFAULT 0,
  archived   boolean NOT NULL DEFAULT false,  -- closed: hidden for new months, history kept
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

-- 2. Month-end balance per account (with the interest rate at the time).
CREATE TABLE IF NOT EXISTS public.savings_balances (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.savings_accounts ON DELETE CASCADE,
  month      date NOT NULL CHECK (EXTRACT(DAY FROM month) = 1),       -- YYYY-MM-01
  balance    numeric(14, 2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  rate       numeric(6, 4) NOT NULL DEFAULT 0 CHECK (rate >= 0 AND rate < 1), -- 0.0355 = 3.55% p.a.
  UNIQUE (account_id, month)
);

CREATE INDEX IF NOT EXISTS idx_savings_accounts_user      ON public.savings_accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_savings_balances_user_month ON public.savings_balances (user_id, month);

-- 3. Owner-only access; a balance can only belong to one of your own accounts.
ALTER TABLE public.savings_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner manages savings accounts" ON public.savings_accounts;
DROP POLICY IF EXISTS "Owner manages savings balances" ON public.savings_balances;

CREATE POLICY "Owner manages savings accounts" ON public.savings_accounts
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner manages savings balances" ON public.savings_balances
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.savings_accounts a WHERE a.id = account_id AND a.user_id = auth.uid())
  );

-- 4. Copy monthly_savings, for accounts that don't have savings accounts yet (so re-running
--    never duplicates). All-zero months were never recorded (an old import artifact) and are
--    skipped, as are columns that were always 0.
DO $$
DECLARE
  u     record;
  col   record;
  v_acc uuid;
  v_pos integer;
  v_used boolean;
BEGIN
  FOR u IN
    SELECT DISTINCT ms.user_id FROM public.monthly_savings ms
    WHERE ms.user_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.savings_accounts a WHERE a.user_id = ms.user_id)
  LOOP
    v_pos := 0;
    FOR col IN
      SELECT * FROM (VALUES
        ('Main checking', 'liquid', 'main_checking', NULL),
        ('GXBank',        'liquid', 'gx_bank',       'gx_rate'),
        ('RYT / Rize',    'liquid', 'ryt_bank',      'ryt_rate'),
        ('EPF & locked',  'locked', 'epf_locked',    NULL)
      ) AS c(name, kind, balance_col, rate_col)
    LOOP
      -- Skip columns that were never above 0 in a recorded month.
      -- (EXECUTE doesn't set FOUND, so the answer is read into a variable.)
      EXECUTE format(
        'SELECT EXISTS (SELECT 1 FROM public.monthly_savings
                        WHERE user_id = $1 AND COALESCE(%I, 0) > 0)', col.balance_col)
      INTO v_used
      USING u.user_id;
      IF NOT v_used THEN CONTINUE; END IF;

      INSERT INTO public.savings_accounts (user_id, name, kind, position)
      VALUES (u.user_id, col.name, col.kind, v_pos)
      RETURNING id INTO v_acc;
      v_pos := v_pos + 1;

      EXECUTE format(
        'INSERT INTO public.savings_balances (user_id, account_id, month, balance, rate)
         SELECT user_id, $2, date_trunc(''month'', month)::date, COALESCE(%I, 0), %s
         FROM public.monthly_savings
         WHERE user_id = $1
           AND COALESCE(main_checking, 0) + COALESCE(gx_bank, 0) + COALESCE(ryt_bank, 0) + COALESCE(epf_locked, 0) > 0
         ON CONFLICT (account_id, month) DO NOTHING',
        col.balance_col,
        CASE WHEN col.rate_col IS NULL THEN '0' ELSE format('COALESCE(%I, 0)', col.rate_col) END)
      USING u.user_id, v_acc;
    END LOOP;
  END LOOP;
END $$;

-- 5. Check: accounts per person, and each month's net worth before (old table) and after (new).
SELECT u.email, a.position, a.name, a.kind, count(b.id) AS months
FROM public.savings_accounts a
JOIN auth.users u ON u.id = a.user_id
LEFT JOIN public.savings_balances b ON b.account_id = a.id
GROUP BY u.email, a.position, a.name, a.kind
ORDER BY u.email, a.position;

SELECT to_char(ms.month, 'YYYY-MM') AS month,
       COALESCE(ms.main_checking, 0) + COALESCE(ms.gx_bank, 0) + COALESCE(ms.ryt_bank, 0) + COALESCE(ms.epf_locked, 0) AS before,
       (SELECT sum(b.balance) FROM public.savings_balances b
        WHERE b.user_id = ms.user_id AND b.month = date_trunc('month', ms.month)::date) AS after
FROM public.monthly_savings ms
WHERE COALESCE(ms.main_checking, 0) + COALESCE(ms.gx_bank, 0) + COALESCE(ms.ryt_bank, 0) + COALESCE(ms.epf_locked, 0) > 0
ORDER BY ms.user_id, ms.month;
