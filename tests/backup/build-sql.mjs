// Writes the SQL for the backup round-trip check (tests/backup/roundtrip.sh), into the folder given:
//   target.sql: an empty Supabase-like database (uuid-ossp in "extensions", roles, auth.users, cron)
//   source.sql: target.sql + the app's database built as a real one was (README tables, an example
//               import, secure_rls.sql, every migration in the README's order) + a second account
//   rerun.sql:  every migration again, as the restore steps say to do afterwards
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const out = process.argv[2];
const read = (p) => readFileSync(p, "utf8");
const readme = read("README.md");
const schema = readme.slice(readme.indexOf("### 1. Initial Tables Setup")).match(/```sql\n([\s\S]*?)```/)[1];
const section = readme.slice(readme.indexOf("### 4. Migrations"));
const migrations = [...section.slice(0, section.indexOf("\n### ", 1)).matchAll(/^- `([^`]+\.sql)`/gm)].map((m) => m[1]);
// pg_cron isn't in the postgres image; supabase-stub.sql stands in for it.
const migration = (f) => `\n-- ${f}\n` + read(`scripts/migrations/${f}`).replace(/CREATE EXTENSION IF NOT EXISTS pg_cron[^;]*;/gi, "");

const target = `
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
DO $$ BEGIN EXECUTE format('ALTER DATABASE %I SET search_path TO "$user", public, extensions', current_database()); END $$;
SET search_path TO "$user", public, extensions;
${read("tests/db/supabase-stub.sql")}`;

// Example data only.
const source = `${target}
${schema}
INSERT INTO auth.users (id, email) VALUES ('11111111-1111-1111-1111-111111111111', 'owner@example.com');
INSERT INTO public.categories (id, name) VALUES ('00000000-0000-0000-0000-0000000000c1', 'Food');
INSERT INTO public.tags (id, category_id, name) VALUES ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Lunch');
ALTER TABLE public.transactions ALTER COLUMN user_id DROP NOT NULL;
INSERT INTO public.transactions (date, category_id, tag_id, amount, description)
  VALUES ('2026-08-03', '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 12.50, 'Kedai Contoh');
INSERT INTO public.monthly_savings (month, main_checking, gx_bank) VALUES ('2026-08-01', 1200, 2100);
${read("scripts/secure_rls.sql").replace("'you@example.com'", "'owner@example.com'")}
${migrations.map(migration).join("\n")}
INSERT INTO auth.users (id, email) VALUES ('22222222-2222-2222-2222-222222222222', 'friend@example.com');
INSERT INTO public.transactions (user_id, date, category_id, tag_id, amount)
  SELECT t.user_id, '2026-10-01', t.category_id, t.id, 7.90 FROM public.tags t
  WHERE t.user_id = '22222222-2222-2222-2222-222222222222' AND t.name = 'Lunch';
`;

writeFileSync(join(out, "target.sql"), target);
writeFileSync(join(out, "source.sql"), source);
writeFileSync(join(out, "rerun.sql"), migrations.map(migration).join("\n"));
console.log(`${migrations.length} migrations`);
