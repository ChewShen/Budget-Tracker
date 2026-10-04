"use client";

import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { jobStatuses, recentIngestErrors, useJobRuns, type JobState } from "@/lib/job-health";
import { cn } from "@/lib/utils";

// Settings → Account: when each background job last ran, and whether it worked.

const DOT: Record<JobState, string> = {
  ok: "bg-success",
  failed: "bg-danger",
  late: "bg-warning",
  never: "bg-muted-foreground/50",
};

// "permission denied" → "permission denied."; leaves "…ago." alone.
const sentence = (s: string) => (/[.!?]$/.test(s) ? s : `${s}.`);
const when = (iso: string) => `${format(parseISO(iso), "d MMM, h:mm a")} (${formatDistanceToNowStrict(parseISO(iso), { addSuffix: true })})`;

export function JobStatusCard() {
  const { runs, isLoaded, needsMigration } = useJobRuns(true);
  const now = new Date();
  const statuses = jobStatuses(runs, now);
  const ingestErrors = recentIngestErrors(runs, now);

  return (
    <section className="card p-5 sm:p-6">
      <h3 className="text-[15px] font-semibold">Background jobs</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        What runs on its own, and whether its last run worked. Overview warns you when one fails or stops.
      </p>
      {needsMigration ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Run <code className="font-mono">scripts/migrations/2026-10-04_job_runs.sql</code> in Supabase to see this.
        </p>
      ) : !isLoaded ? (
        <div className="mt-3 h-24 animate-pulse rounded-xl bg-secondary/60" />
      ) : (
        <ul className="mt-3 divide-y divide-border/70">
          {statuses.map((s) => (
            <li key={s.job} className="flex gap-3 py-2.5">
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", DOT[s.state])} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{s.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {s.state === "never"
                    ? s.job === "backup"
                      ? "Not set up yet (README → Backups)."
                      : `No runs logged yet (${s.schedule}).`
                    : s.state === "ok"
                      ? `Last ran ${when(s.last!.ran_at)}.`
                      : s.state === "late"
                        ? `Hasn't run since ${when(s.last!.ran_at)}; it should run ${s.schedule}.`
                        : `Failed ${when(s.last!.ran_at)}${s.last!.detail ? `: ${sentence(s.last!.detail)}` : "."}${
                            s.lastOk ? ` Last worked ${format(parseISO(s.lastOk.ran_at), "d MMM")}.` : ""
                          }`}
                </span>
              </span>
            </li>
          ))}
          {ingestErrors.length > 0 && (
            <li className="flex gap-3 py-2.5">
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", DOT.failed)} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">Shortcut payments</span>
                <span className="block text-xs text-muted-foreground">
                  {ingestErrors.length} couldn&apos;t be saved in the last 7 days, latest {when(ingestErrors[0].ran_at)}
                  {ingestErrors[0].detail ? `: ${ingestErrors[0].detail}` : ""}. Double-tap the receipt again to retry.
                </span>
              </span>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
