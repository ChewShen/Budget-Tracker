"use client";

import { AlertCircle, X } from "lucide-react";
import { useBudget } from "@/lib/budget-context";

export function ToastHost() {
  const { toast, dismissToast } = useBudget();
  if (!toast) return null;

  const isError = toast.tone === "error";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 md:bottom-6">
      <div
        key={toast.id}
        role={isError ? "alert" : "status"}
        className="pointer-events-auto flex w-full max-w-sm animate-sheet-up items-center gap-3 rounded-2xl border bg-popover py-2.5 pl-4 pr-2 text-sm text-popover-foreground shadow-2xl shadow-black/40"
      >
        {isError && <AlertCircle className="h-4 w-4 shrink-0 text-danger" />}
        <span className="flex-1">{toast.message}</span>
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold text-highlight transition hover:bg-secondary"
          >
            {toast.action.label}
          </button>
        )}
        <button
          onClick={dismissToast}
          className="shrink-0 rounded-full p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
