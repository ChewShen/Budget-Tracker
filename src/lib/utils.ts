import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(amount).replace("MYR", "RM");
}

// "2026-08-31" -> "31 Aug 2026" (fixed pattern, independent of browser locale).
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  return format(parseISO(dateStr), "d MMM yyyy");
}
