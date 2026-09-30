import { format, parseISO } from "date-fns";
import { categoryLabel } from "./categories";
import { accountsFor, buildSnapshots, liquidOf, netWorthOf } from "./savings";
import type {
  Category,
  Goal,
  GoalContribution,
  RecurringBill,
  SavingsAccount,
  SavingsBalance,
  Tag,
  Transaction,
  UserSalaryProfile,
} from "./types";

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

// One row per recorded month, one column per account (plus its rate when it ever had one).
export function savingsCsv(accounts: SavingsAccount[], balances: SavingsBalance[]): string {
  const snapshots = buildSnapshots(balances);
  const columns = accountsFor(accounts).concat(accounts.filter((a) => a.archived));
  const shown = columns.filter((a) => snapshots.some((s) => a.id in s.balances));
  const withRate = new Set(balances.filter((b) => b.rate > 0).map((b) => b.account_id));

  const header = [
    "Month",
    ...shown.flatMap((a) => [
      `${a.name} (RM)`,
      ...(withRate.has(a.id) ? [`${a.name} rate (% p.a.)`] : []),
    ]),
    "Liquid (RM)",
    "Net worth (RM)",
  ];
  const rows = snapshots.map((s) => [
    cell(s.month.slice(0, 7), false),
    ...shown.flatMap((a) => {
      const b = s.balances[a.id];
      return [
        b ? money(b.balance) : "",
        ...(withRate.has(a.id) ? [b ? cell((b.rate * 100).toFixed(2), false) : ""] : []),
      ];
    }),
    money(liquidOf(s, accounts)),
    money(netWorthOf(s)),
  ]);
  return toCsv(header, rows);
}

// ---- JSON backup ----

export function backupJson(data: {
  profile: UserSalaryProfile;
  categories: Category[];
  tags: Tag[];
  bills: RecurringBill[];
  goals: Goal[];
  goalContributions: GoalContribution[];
  transactions: Transaction[];
  savingsAccounts: SavingsAccount[];
  savingsBalances: SavingsBalance[];
}): string {
  // schema 2: savings as accounts + balances (schema 1 had fixed monthly_savings columns).
  return JSON.stringify({ app: "budget-tracker", schema: 2, exportedAt: new Date().toISOString(), ...data }, null, 2);
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
