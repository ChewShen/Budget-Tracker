#!/usr/bin/env bash
# Backup round trip on two real, empty Postgres databases (CI starts them; see ci.yml):
# build the app's database in SOURCE, back it up with scripts/backup.sh, restore it into TARGET
# with scripts/restore-backup.sh, re-run the migrations, and check everything came back.
# Usage: SOURCE_URL=… TARGET_URL=… tests/backup/roundtrip.sh   (needs node, psql, pg_dump, age)
set -euo pipefail
: "${SOURCE_URL:?}" "${TARGET_URL:?}"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
psql_q() { psql "$1" -v ON_ERROR_STOP=1 --quiet -o /dev/null -f "$2"; }

node tests/backup/build-sql.mjs "$work"
psql_q "$SOURCE_URL" "$work/source.sql"
psql_q "$TARGET_URL" "$work/target.sql"

age-keygen -o "$work/key.txt" 2>/dev/null
DB_URL="$SOURCE_URL" RECIPIENT="$(age-keygen -y "$work/key.txt")" scripts/backup.sh "$work/out"
backup="$(ls "$work"/out/*.age)"

# Encrypted: no example data readable in the file.
if gzip -t "$backup" 2>/dev/null || grep -q "Kedai Contoh" "$backup"; then echo "Backup isn't encrypted" >&2; exit 1; fi

DB_URL="$TARGET_URL" scripts/restore-backup.sh "$backup" "$work/key.txt"
# Restoring over existing data is refused.
if DB_URL="$TARGET_URL" scripts/restore-backup.sh "$backup" "$work/key.txt" 2>/dev/null; then echo "Restored over existing data" >&2; exit 1; fi
psql_q "$TARGET_URL" "$work/rerun.sql"

before="$(psql "$SOURCE_URL" -tA -f tests/backup/compare.sql)"
after="$(psql "$TARGET_URL" -tA -f tests/backup/compare.sql)"
echo "source:   $before"
echo "restored: $after"
[ "$before" = "$after" ] || { echo "Restored database differs" >&2; exit 1; }

# New accounts still get the default categories after a restore.
psql "$TARGET_URL" -q -c "INSERT INTO auth.users (email) VALUES ('new@example.com')"
n="$(psql "$TARGET_URL" -tAc "SELECT count(*) FROM public.categories c JOIN auth.users u ON u.id = c.user_id WHERE u.email = 'new@example.com'")"
[ "$n" -gt 0 ] || { echo "New account got no categories" >&2; exit 1; }
echo "Backup round trip OK."
