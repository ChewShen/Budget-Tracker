"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, parse } from "date-fns";

interface MonthSelectorProps {
  currentMonth: string; // "YYYY-MM"
  onChangeMonth: (newMonth: string) => void;
}

export function MonthSelector({ currentMonth, onChangeMonth }: MonthSelectorProps) {
  const date = parse(`${currentMonth}-01`, "yyyy-MM-dd", new Date());
  const isCurrentMonth = format(new Date(), "yyyy-MM") === currentMonth;

  const shift = (delta: number) => {
    const next = delta > 0 ? addMonths(date, 1) : subMonths(date, 1);
    onChangeMonth(format(next, "yyyy-MM"));
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-full border bg-card p-1">
        <button
          onClick={() => shift(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[8.5rem] text-center text-sm font-semibold tabular-nums">
          {format(date, "MMMM yyyy")}
        </span>
        <button
          onClick={() => shift(1)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      {!isCurrentMonth && (
        <button
          onClick={() => onChangeMonth(format(new Date(), "yyyy-MM"))}
          className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          Today
        </button>
      )}
    </div>
  );
}
