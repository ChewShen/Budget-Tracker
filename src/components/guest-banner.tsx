"use client";

import { Info } from "lucide-react";
import { exitGuest } from "@/lib/guest";

export function GuestBanner() {
  return (
    <div className="border-b border-warning/30 bg-warning/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 text-xs sm:px-6">
        <span className="flex items-center gap-1.5 text-foreground">
          <Info className="h-3.5 w-3.5 shrink-0 text-warning" />
          <span>
            <span className="font-semibold">Guest mode</span>: sample data, nothing is saved. Refreshing starts over.
          </span>
        </span>
        <button onClick={() => exitGuest()} className="font-semibold text-foreground underline underline-offset-2">
          Sign in to save
        </button>
      </div>
    </div>
  );
}
