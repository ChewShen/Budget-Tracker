#!/usr/bin/env bash
# Restores a backup made by scripts/backup.sh into an EMPTY database: a new Supabase project
# (Settings → Database → connection string), never the one you're using.
# Afterwards, run every file in scripts/migrations/ again in the README's order (they're safe to
# re-run): that brings back what lives outside the public schema, i.e. the new-account trigger
# and the nightly auto-add schedule.
#
# Usage: DB_URL=postgresql://… scripts/restore-backup.sh budget-backup-YYYY-MM-DD.tar.gz.age path/to/key.txt
# Needs psql and age.
set -euo pipefail
: "${DB_URL:?Set DB_URL to the EMPTY database to restore into}"
backup="${1:?Pass the .tar.gz.age backup file}"
key="${2:?Pass your age private key file}"

umask 077
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
age --decrypt --identity "$key" "$backup" | tar -xzf - -C "$work"

if [ "$(psql "$DB_URL" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions'")" != "0" ]; then
  echo "This database already has the app's tables. Restore into a new, empty project instead." >&2
  exit 1
fi

# Supabase keeps uuid-ossp in the "extensions" schema; the tables' defaults use it.
psql "$DB_URL" -v ON_ERROR_STOP=1 --quiet -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions'
psql "$DB_URL" -v ON_ERROR_STOP=1 --quiet -o /dev/null -f "$work/auth_users.sql"
# A new project already has the public schema (and its comment), so those lines are skipped.
sed -E '/^(CREATE SCHEMA public|COMMENT ON SCHEMA public) /d; /^CREATE SCHEMA public;$/d' "$work/public.sql" > "$work/public-restore.sql"
psql "$DB_URL" -v ON_ERROR_STOP=1 --quiet -o /dev/null -f "$work/public-restore.sql"
psql "$DB_URL" -tAc "SELECT 'Restored: ' || (SELECT count(*) FROM auth.users) || ' accounts, ' || (SELECT count(*) FROM public.transactions) || ' expenses.'"
