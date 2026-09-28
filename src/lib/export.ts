import { format, parseISO } from "date-fns";
import { categoryLabel } from "./categories";
import { liquidOf, netWorthOf, recordedHistory } from "./savings";
import type { Category, MonthlySavings, RecurringBill, Tag, Transaction, UserSalaryProfile } from "./types";

// ---- CSV ----

// Text a spreadsheet would treat as a formula (e.g. "=HYPERLINK(...)") gets a leading
// apostrophe, so opening an export can never run anything.
const guardFormula = (text: string) => (/^[=+\-@\t\r]/.test(text) ? `'${text}` : text);

function cell(value: string | number | null | undefined, isText = true): string {
  if (value === null || value === undefined) return "";
  const text = isText ? guardFormula(String(value)) : String(value);
  return /[",\r\n]|^\s|\s$/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// CRLF rows and a UTF-8 BOM so Excel opens it with the right encoding.
function toCsv(headers: string[], rows: string[][]): string {
  return "﻿" + [headers.map((h) => cell(h)), ...rows].map((r) => r.join(",")).join("\r\n") + "\r\n";
}

const money = (n: number) => cell(n.toFixed(2), false);

export function transactionsCsv(txs: Transaction[]): string {
  const rows = [...txs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => [
      cell(t.date, false),
      cell(format(parseISO(t.date), "EEE")),
      cell(categoryLabel(t.category_name)),
      cell(t.tag_name),
      cell(t.description),
      money(t.amount),
      cell(t.is_one_off ? "Yes" : "No"),
    ]);
  return toCsv(["Date", "Day", "Category", "Tag", "Note", "Amount (RM)", "One-off"], rows);
}

export function savingsCsv(savings: MonthlySavings[]): string {
  const rows = recordedHistory(savings).map((s) => [
    cell(s.month.slice(0, 7), false),
    money(s.main_checking),
    money(s.gx_bank),
    cell((s.gx_rate * 100).toFixed(2), false),
    money(s.ryt_bank),
    cell((s.ryt_rate * 100).toFixed(2), false),
    money(s.epf_locked),
    money(liquidOf(s)),
    money(netWorthOf(s)),
  ]);
  return toCsv(
    [
      "Month",
      "Main checking (RM)",
      "GXBank (RM)",
      "GXBank rate (% p.a.)",
      "RYT / Rize (RM)",
      "RYT rate (% p.a.)",
      "EPF & locked (RM)",
      "Liquid (RM)",
      "Net worth (RM)",
    ],
    rows
  );
}

// ---- JSON backup ----

export function backupJson(data: {
  profile: UserSalaryProfile;
  categories: Category[];
  tags: Tag[];
  bills: RecurringBill[];
  transactions: Transaction[];
  savings: MonthlySavings[];
}): string {
  return JSON.stringify({ app: "budget-tracker", schema: 1, exportedAt: new Date().toISOString(), ...data }, null, 2);
}

// ---- Download ----

export function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before releasing the blob.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const CSV = "text/csv;charset=utf-8";
export const JSON_TYPE = "application/json";
