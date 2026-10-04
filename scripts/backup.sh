#!/usr/bin/env bash
# Encrypted backup of the app's database: every table, policy and function in the public schema,
# plus the accounts (auth.users), packed and encrypted with age for one recipient (your public key,
# "age1…"). Only the matching private key, kept on your own computer, can open it.
# Run weekly by .github/workflows/backup.yml; see README → Backups. Restore with
# scripts/restore-backup.sh.
#
# Usage: DB_URL=postgresql://… RECIPIENT=age1… scripts/backup.sh [output-dir]
# Needs pg_dump (same major version as the database or newer) and age.
set -euo pipefail
: "${DB_URL:?Set DB_URL to the database connection string}"
: "${RECIPIENT:?Set RECIPIENT to your age public key (age1…)}"
out="${1:-backup-out}"

umask 077 # the unencrypted dump is only ever readable by this user, and deleted on exit
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

pg_dump "$DB_URL" --schema=public --no-owner --no-privileges --file="$work/public.sql"
pg_dump "$DB_URL" --data-only --table=auth.users --column-inserts --file="$work/auth_users.sql"
cat > "$work/README.txt" <<TXT
Budget Tracker backup, made $(date -u +"%Y-%m-%d %H:%M UTC").
public.sql: tables, data, policies and functions. auth_users.sql: the accounts.
Restore: scripts/restore-backup.sh (see README → Backups).
TXT

mkdir -p "$out"
file="$out/budget-backup-$(date -u +%Y-%m-%d).tar.gz.age"
tar -czf - -C "$work" . | age --encrypt --recipient "$RECIPIENT" --output "$file"
echo "$file ($(wc -c < "$file" | tr -d ' ') bytes, encrypted)"
