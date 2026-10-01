"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// An optional date. Native date pickers (notably on iPhone) have no way to clear a date once
// picked, so a small × appears next to it when it has a value. Its space is kept when empty so
// the layout doesn't jump.
export function DateField({
  value,
  onChange,
  label,
  className,
  title,
}: {
  value: string; // YYYY-MM-DD or ""
  onChange: (value: string) => void;
  label: string; // accessible name, e.g. "Target date"
  className?: string;
  title?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn("field min-w-0 flex-1", className)}
        aria-label={label}
        title={title}
      />
      <button
        type="button"
        onClick={() => onChange("")}
        className={cn(
          "shrink-0 rounded-full p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground",
          !value && "invisible"
        )}
        aria-label={`Clear ${label.toLowerCase()}`}
        tabIndex={value ? 0 : -1}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
