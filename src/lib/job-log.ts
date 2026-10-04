import type { SupabaseClient } from "@supabase/supabase-js";

// Server side: records a background job's run in job_runs (2026-10-04_job_runs.sql), so Settings
// and Overview can show when one failed or stopped. Never throws: logging must not break the job,
// and before the migration there's simply nowhere to log.

export type Job = "reminders" | "auto_bills" | "backup" | "ingest";

export async function logJobRun(
  db: Pick<SupabaseClient, "from">,
  job: Job,
  ok: boolean,
  detail?: string | null,
  userId?: string | null // only for one account's own events
) {
  try {
    const { error } = await db
      .from("job_runs")
      .insert({ job, ok, detail: detail ? detail.slice(0, 300) : null, user_id: userId ?? null });
    if (error) console.warn(`[jobs] Couldn't log ${job} run:`, error.message);
  } catch (e) {
    console.warn(`[jobs] Couldn't log ${job} run:`, e);
  }
}
