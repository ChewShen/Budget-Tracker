import { describe, expect, it } from "vitest";
import { jobStatuses, jobWarning, recentIngestErrors, type JobRun } from "@/lib/job-health";

// When Settings and Overview say a background job needs a look.

const NOW = new Date("2026-10-04T13:00:00Z"); // 9pm Malaysia time
const run = (job: JobRun["job"], hoursAgo: number, ok = true, detail: string | null = null): JobRun => ({
  job,
  ran_at: new Date(NOW.getTime() - hoursAgo * 3600_000).toISOString(),
  ok,
  detail,
  user_id: null,
});
const state = (runs: JobRun[], job: string) => jobStatuses(runs, NOW).find((s) => s.job === job)!;

describe("background job status", () => {
  it("is fine when the latest run worked and was on time", () => {
    const s = state([run("reminders", 1), run("reminders", 25, false)], "reminders");
    expect(s.state).toBe("ok");
    expect(s.lastOk?.ran_at).toBe(s.last?.ran_at);
  });

  it("is failed when the latest run failed, remembering the last good one", () => {
    const s = state([run("auto_bills", 13, false, "permission denied"), run("auto_bills", 37)], "auto_bills");
    expect(s.state).toBe("failed");
    expect(s.last?.detail).toBe("permission denied");
    expect(s.lastOk).not.toBeNull();
  });

  it("is late when a nightly job missed a night, or the weekly backup missed a week", () => {
    expect(state([run("reminders", 27)], "reminders").state).toBe("late");
    expect(state([run("backup", 6 * 24)], "backup").state).toBe("ok");
    expect(state([run("backup", 9 * 24)], "backup").state).toBe("late");
  });

  it("doesn't count a job that has never run as a problem", () => {
    expect(jobStatuses([], NOW).map((s) => s.state)).toEqual(["never", "never", "never"]);
    expect(jobWarning(jobStatuses([], NOW), [])).toBeNull();
  });

  it("warns on Overview: failures first, then late jobs, then Shortcut errors this week", () => {
    const ingest = { ...run("ingest", 2, false, "couldn't save"), user_id: "me" };
    expect(jobWarning(jobStatuses([run("reminders", 30), run("backup", 1, false)], NOW), [ingest])).toBe(
      "Database backup failed on its last run."
    );
    expect(jobWarning(jobStatuses([run("reminders", 30)], NOW), [ingest])).toBe(
      "Nightly reminders hasn't run when expected (every night at 8pm)."
    );
    expect(jobWarning(jobStatuses([run("reminders", 1)], NOW), recentIngestErrors([ingest], NOW))).toBe(
      "A payment from your Shortcut couldn't be saved."
    );
    expect(recentIngestErrors([{ ...ingest, ran_at: run("ingest", 8 * 24).ran_at }], NOW)).toEqual([]);
  });
});
