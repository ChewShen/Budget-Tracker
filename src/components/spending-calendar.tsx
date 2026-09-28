"use client";

import { useState } from "react";
import { format, getDaysInMonth, parseISO } from "date-fns";
import { cn, formatCurrency } from "@/lib/utils";

interface SpendingCalendarProps {
  month: string; // YYYY-MM
  today: string; // YYYY-MM-DD
  days: { amount: number; count: number }[]; // index 0 = day 1
}

// Sequential single-hue ramp (light -> full lime); no-spend days use the neutral surface.
const LEVELS = [
  "bg-primary/20 text-foreground",
  "bg-primary/40 text-foreground",
  "bg-primary/70 text-primary-foreground",
  "bg-primary text-primary-foreground",
];

// Quartile cut-offs of the days with spending, so the four shades are evenly used.
function levelOf(amount: number, sorted: number[]): number {
  if (amount <= 0 || sorted.length === 0) return -1;
  const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
  if (amount <= q(0.25)) return 0;
  if (amount <= q(0.5)) return 1;
  if (amount <= q(0.75)) return 2;
  return 3;
}

export function SpendingCalendar({ month, today, days }: SpendingCalendarProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const first = parseISO(`${month}-01`);
  const offset = (first.getDay() + 6) % 7; // Monday-first
  const total = getDaysInMonth(first);
  const sorted = days.map((d) => d.amount).filter((a) => a > 0).sort((a, b) => a - b);
  const dateOf = (day: number) => `${month}-${String(day).padStart(2, "0")}`;
  const label = (day: number) => format(parseISO(dateOf(day)), "EEE d MMM");
  const detailDay = selected ?? (today.startsWith(month) ? Number(today.slice(8, 10)) : null);

  return (
    <section className="card p-5 sm:p-6">
      <h3 className="text-[15px] font-semibold">Spending calendar</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">Darker days cost more · tap a day for details</p>

      <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-[11px] text-muted-foreground">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-1.5">
        {Array.from({ length: offset }, (_, i) => (
          <div key={`pad-${i}`} aria-hidden />
        ))}
        {Array.from({ length: total }, (_, i) => {
          const day = i + 1;
          const { amount, count } = days[i] || { amount: 0, count: 0 };
          const isFuture = dateOf(day) > today;
          const level = levelOf(amount, sorted);
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelected(day)}
              onMouseEnter={() => setSelected(day)}
              aria-label={`${label(day)}: ${isFuture ? "upcoming" : amount > 0 ? formatCurrency(amount) : "no spending"}`}
              aria-pressed={selected === day}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md text-xs tabular-nums transition",
                isFuture
                  ? "border border-dashed border-border text-muted-foreground/60"
                  : level < 0
                    ? "bg-secondary text-muted-foreground"
                    : LEVELS[level],
                dateOf(day) === today && "ring-2 ring-foreground/70 ring-offset-2 ring-offset-card",
                selected === day && "outline outline-2 outline-offset-1 outline-foreground/40"
              )}
            >
              {day}
              <span className="sr-only">{count ? ` (${count} expenses)` : ""}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="min-h-[1rem]" aria-live="polite">
          {detailDay !== null && dateOf(detailDay) <= today && (
            <>
              <span className="font-medium text-foreground">{label(detailDay)}</span> ·{" "}
              {days[detailDay - 1]?.amount
                ? `${formatCurrency(days[detailDay - 1].amount)} · ${days[detailDay - 1].count} expense${
                    days[detailDay - 1].count === 1 ? "" : "s"
                  }`
                : "No spending"}
            </>
          )}
        </div>
        <div className="flex items-center gap-1" aria-hidden>
          <span className="mr-1">No spend</span>
          <span className="h-3 w-3 rounded-sm bg-secondary" />
          <span className="ml-2 mr-1">Less</span>
          {LEVELS.map((l) => (
            <span key={l} className={cn("h-3 w-3 rounded-sm", l.split(" ")[0])} />
          ))}
          <span className="ml-1">More</span>
        </div>
      </div>
    </section>
  );
}
