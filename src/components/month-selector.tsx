"use client";

import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, addMonths, subMonths, parse } from "date-fns";

interface MonthSelectorProps {
  currentMonth: string; // "YYYY-MM"
  onChangeMonth: (newMonth: string) => void;
}

export function MonthSelector({ currentMonth, onChangeMonth }: MonthSelectorProps) {
  const date = parse(`${currentMonth}-01`, "yyyy-MM-dd", new Date());

  const handlePrev = () => {
    const prev = subMonths(date, 1);
    onChangeMonth(format(prev, "yyyy-MM"));
  };

  const handleNext = () => {
    const next = addMonths(date, 1);
    onChangeMonth(format(next, "yyyy-MM"));
  };

  const handleToday = () => {
    onChangeMonth(format(new Date(), "yyyy-MM"));
  };

  const isCurrentMonth = format(new Date(), "yyyy-MM") === currentMonth;

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border bg-card p-2 shadow-sm">
      <button
        onClick={handlePrev}
        className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-95"
        title="Previous Month"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2 px-2">
        <Calendar className="h-4 w-4 text-primary" />
        <span className="font-bold text-base sm:text-lg">
          {format(date, "MMMM yyyy")}
        </span>
        {!isCurrentMonth && (
          <button
            onClick={handleToday}
            className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary hover:bg-primary/20"
          >
            Today
          </button>
        )}
      </div>

      <button
        onClick={handleNext}
        className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-95"
        title="Next Month"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
