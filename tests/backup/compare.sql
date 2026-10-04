-- What must survive a backup and restore (plus re-running the migrations), as one line.
SELECT string_agg(t || '=' || n, ' ' ORDER BY t) FROM (
  SELECT 'accounts' t, count(*)::text n FROM auth.users
  UNION ALL SELECT 'expenses', count(*)::text FROM public.transactions
  UNION ALL SELECT 'expense_total', coalesce(sum(amount), 0)::text FROM public.transactions
  UNION ALL SELECT 'categories', count(*)::text FROM public.categories
  UNION ALL SELECT 'tags', count(*)::text FROM public.tags
  UNION ALL SELECT 'savings_balances', count(*)::text FROM public.savings_balances
  UNION ALL SELECT 'policies', count(*)::text FROM pg_policies WHERE schemaname = 'public'
  UNION ALL SELECT 'tables_without_rls', count(*)::text FROM pg_class
    WHERE relnamespace = 'public'::regnamespace AND relkind = 'r' AND NOT relrowsecurity
  UNION ALL SELECT 'app_functions', count(*)::text FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace AND proname IN ('auto_log_bills', 'seed_new_user', 'handle_new_user')
  UNION ALL SELECT 'signup_trigger', count(*)::text FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  UNION ALL SELECT 'nightly_job', count(*)::text FROM cron.job WHERE jobname = 'auto-log-monthly-bills'
) x;
