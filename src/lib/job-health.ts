"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "./supabase/client";
import type { Job } from "./job-log";

// Whether the background jobs are healthy, from job_runs (2026-10-04_job_runs.sql): shown in
// Settings → Account and, when something's wrong, as a warning on Overview. The status rules are
// pure functions so they're testable.

export interface JobRun {
  job: Job;
  ran_at: string; // ISO timestamp
  ok: boolean;
  detail: string | null;
  user_id: string | null;
}

export type JobState = "ok" | "failed" | "late" | "never";

export interface JobStatus {
  job: Exclude<Job, "ingest">;
  label: string;
  schedule: string;
  state: JobState;
  last: JobRun | null; // the latest run
  lastOk: JobRun | null; // the latest successful run
}

// Each job, and how long after its last run it counts as late (a missed run plus some slack).
export const JOBS: { job: JobStatus["job"]; label: string; schedule: string; lateAfterHours: number }[] = [
  { job: "reminders", label: "Nightly reminders", schedule: "every night at 8pm", lateAfterHours: 26 },
  { job: "auto_bills", label: "Auto-add bills", schedule: "every night just after midnight", lateAfterHours: 26 },
  { job: "backup", label: "Database backup", schedule: "every Sunday", lateAfterHours: 8 * 24 },
];

const HOUR = 60 * 60 * 1000;

// runs: newest first or in any order. A job that has never logged a run is "never" (not set up
// yet, or set up before the job log existed) and doesn't count as a problem.
export function jobStatuses(runs: JobRun[], now: Date): JobStatus[] {
  return JOBS.map(({ job, label, schedule, lateAfterHours }) => {
    const mine = runs.filter((r) => r.job === job).sort((a, b) => b.ran_at.localeCompare(a.ran_at));
    const last = mine[0] ?? null;
    const lastOk = mine.find((r) => r.ok) ?? null;
    let state: JobState = "never";
    if (last) state = !last.ok ? "failed" : now.getTime() - new Date(last.ran_at).getTime() > lateAfterHours * HOUR ? "late" : "ok";
    return { job, label, schedule, state, last, lastOk };
  });
}

// The Shortcut's server errors for this account in the last 7 days, newest first.
export function recentIngestErrors(runs: JobRun[], now: Date): JobRun[] {
  return runs
    .filter((r) => r.job === "ingest" && !r.ok && now.getTime() - new Date(r.ran_at).getTime() < 7 * 24 * HOUR)
    .sort((a, b) => b.ran_at.localeCompare(a.ran_at));
}

// One line for Overview when something needs a look, or null when all is well.
export function jobWarning(statuses: JobStatus[], ingestErrors: JobRun[]): string | null {
  const failed = statuses.find((s) => s.state === "failed");
  if (failed) return `${failed.label} failed on its last run.`;
  const late = statuses.find((s) => s.state === "late");
  if (late) return `${late.label} hasn't run when expected (${late.schedule}).`;
  if (ingestErrors.length) return `A payment from your Shortcut couldn't be saved.`;
  return null;
}

// The last 30 days of runs the signed-in account can see (cloud accounts only).
export function useJobRuns(enabled: boolean) {
  const [runs, setRuns] = useState<JobRun[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [needsMigration, setNeedsMigration] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) return setIsLoaded(true);
    const since = new Date(Date.now() - 30 * 24 * HOUR).toISOString();
    const { data, error } = await createClient()
      .from("job_runs")
      .select("job, ran_at, ok, detail, user_id")
      .gte("ran_at", since)
      .order("ran_at", { ascending: false })
      .limit(300);
    if (error) setNeedsMigration(["42P01", "PGRST205"].includes(error.code || ""));
    else setRuns(data as JobRun[]);
    setIsLoaded(true);
  }, [enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { runs, isLoaded, needsMigration, reload: load };
}
