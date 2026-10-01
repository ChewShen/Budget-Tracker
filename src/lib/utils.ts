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

// 1 → "1st", 22 → "22nd", 13 → "13th" (due days).
export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}
