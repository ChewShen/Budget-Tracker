import { format, isValid, parse, parseISO } from "date-fns";

// Turns what an automation captured into an Inbox item: either raw text (a TnG receipt read off
// the screen) or ready fields (Apple Pay gives the amount and merchant). Pure functions: used by
// /api/ingest and testable on their own. Parsing is deliberately forgiving; anything it can't
// find is left empty for you to fill in when confirming.

export interface Captured {
  amount: number | null;
  merchant: string | null;
  date: string | null; // YYYY-MM-DD
}

const MONEY = /(?:RM|MYR)\s*-?\s*(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?/gi;
const STARTS_WITH_MONEY = /^\s*-?\s*(?:RM|MYR)\s*\d/i;
// Lines that show money that isn't what you paid.
const NOT_THE_AMOUNT = /balance|baki|cashback|reward|points|limit|saving|discount|rebate|refund|reload/i;
// Lines that usually hold what you paid.
const PAID = /total|amount|paid|payment|pay |jumlah|charged|debited/i;

const toNumber = (whole: string, cents?: string) => {
  const n = Number(`${whole.replace(/,/g, "")}.${(cents ?? "0").padEnd(2, "0")}`);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
};

// "RM12.50", "MYR 1,234.5", "12.50", 12.5 → 12.5
export function parseAmount(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
  if (typeof value !== "string") return null;
  const m = value.replace(/\s/g, "").match(/(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?/);
  return m ? toNumber(m[1], m[2]) : null;
}

// The amount paid in a block of text: an RM amount on a "paid/total/amount" line if there is one,
// else the first RM amount that isn't a balance, reward or similar.
export function amountFromText(text: string): number | null {
  const lines = text.split(/\r?\n/);
  const found: { amount: number; paidLine: boolean }[] = [];
  lines.forEach((line, i) => {
    if (NOT_THE_AMOUNT.test(line)) return;
    // A label on the line above counts too ("Total Amount" / "RM 12.00" on separate lines).
    const paidLine = PAID.test(line) || (i > 0 && PAID.test(lines[i - 1]) && !NOT_THE_AMOUNT.test(lines[i - 1]));
    for (const m of line.matchAll(MONEY)) {
      const amount = toNumber(m[1], m[2]);
      if (amount) found.push({ amount, paidLine });
    }
  });
  return (found.find((f) => f.paidLine) ?? found[0])?.amount ?? null;
}

// A whole-word label at the start of a line, then the name (or nothing: the name is elsewhere).
const MERCHANT_LABEL = /^\s*(?:paid to|pay to|payment to|merchant(?: name)?|payee|recipient|to|at)\b\s*[:\-]?\s*(.*)$/i;
// TnG's "Payment Details" value: "Payment - MENG KEE CHAR SIEW RESTAURANT" (may wrap onto two lines).
const PAYMENT_DASH = /^payment\s*[-–—:]\s*(.+)$/i;
// Row labels on receipt screens. Screen reading often lists a column of labels and then their
// values, so a line after "Merchant" can be another label rather than the name.
const RECEIPT_LABEL =
  /^(transaction type|merchant(?: name)?|payment details|payment method|date\s*\/\s*time|date|time|wallet ref|status|transaction no\.?|reference(?: no\.?)?|ref(?: no\.?)?|details|amount|total|recipient|payee)$/i;
// Values on the same screens that are never the merchant.
// (Long digit runs are reference numbers; a line of only digits and separators is a date or time.)
const NOT_A_MERCHANT =
  /duitnow|ewallet|e-wallet|balance|successful|pending|failed|points|transaction|reference|tngd?$|\d{6,}|^[\d\s/:.-]+$/i;

// Logo fragments and stray symbols read off the screen ("D", "_", "•").
const isJunk = (line: string) => line.replace(/[^A-Za-z0-9]/g, "").length < 3;
const isWrapContinuation = (line: string) =>
  /^[A-Z0-9&'.,() -]+$/.test(line) && !RECEIPT_LABEL.test(line) && !NOT_A_MERCHANT.test(line) && !isJunk(line);

// The merchant in a block of text read off a receipt or payment screen.
export function merchantFromText(text: string): string | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const usable = (l: string | undefined) =>
    Boolean(l) && !isJunk(l as string) && !STARTS_WITH_MONEY.test(l as string) && !RECEIPT_LABEL.test(l as string) && !NOT_A_MERCHANT.test(l as string);

  // 1. "Payment - NAME": the most reliable. If it wrapped, use the full name when it appears
  //    on its own line (the Merchant row), else join the continuation line.
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(PAYMENT_DASH);
    if (!m || isJunk(m[1])) continue;
    const start = m[1].trim();
    const full = lines.find((l, j) => j !== i && l.length > start.length && l.toUpperCase().startsWith(start.toUpperCase()));
    if (full) return full.slice(0, 80);
    const next = lines[i + 1];
    return (next && isWrapContinuation(next) ? `${start} ${next}` : start).slice(0, 80);
  }

  // 2. "Merchant: NAME" on one line, or a label with the name on a later line (skipping other
  //    labels, logo fragments and values like "DuitNow QR TNGD").
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(MERCHANT_LABEL);
    if (!m) continue;
    const value = m[1].trim();
    if (value && usable(value)) return value.slice(0, 80);
    if (value) continue; // e.g. "Total Amount" isn't a merchant label
    const found = lines.slice(i + 1, i + 8).find(usable);
    if (found) return found.slice(0, 80);
  }
  return null;
}

const DATE_FORMATS = ["dd/MM/yyyy", "d/M/yyyy", "dd-MM-yyyy", "d MMM yyyy", "dd MMM yyyy", "d MMMM yyyy", "MMM d, yyyy"];

// A date given as a field, or found in text; anything unreadable or in the future is ignored.
export function parseDate(value: unknown, today: string): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const s = value.trim();
  const candidates: Date[] = [];
  const iso = s.match(/\d{4}-\d{2}-\d{2}/);
  if (iso) candidates.push(parseISO(iso[0]));
  const dmy = s.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b/);
  if (dmy) candidates.push(...DATE_FORMATS.slice(0, 3).map((f) => parse(dmy[0], f, new Date())));
  const named = s.match(/\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b|\b[A-Za-z]{3,9}\s+\d{1,2},\s*\d{4}\b/);
  if (named) candidates.push(...DATE_FORMATS.slice(3).map((f) => parse(named[0], f, new Date())));
  const ok = candidates.find((d) => isValid(d) && d.getFullYear() > 2000);
  if (!ok) return null;
  const out = format(ok, "yyyy-MM-dd");
  return out > today ? null : out;
}

export function parseCapture(
  input: { text?: unknown; amount?: unknown; merchant?: unknown; date?: unknown },
  today: string
): Captured {
  const text = typeof input.text === "string" ? input.text : "";
  const merchant =
    typeof input.merchant === "string" && input.merchant.trim() ? input.merchant.trim().slice(0, 80) : merchantFromText(text);
  return {
    amount: parseAmount(input.amount) ?? (text ? amountFromText(text) : null),
    merchant,
    date: parseDate(input.date, today) ?? (text ? parseDate(text, today) : null),
  };
}

// ---- Merchant rules ----

const STOPWORDS = new Set(["THE", "SDN", "BHD", "PLT", "ENTERPRISE", "TRADING", "KEDAI", "RESTORAN", "RESTAURANT", "CAFE", "STORE", "SHOP", "MY", "MALAYSIA", "KL", "PAYMENT"]);

// "Tealive @ Sunway Pyramid" → "TEALIVE SUNWAY PYRAMID"
export const normalizeMerchant = (m: string) =>
  m.toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim().replace(/\s+/g, " ");

// The part of a merchant name worth remembering: its first distinctive word, so branches and
// terminal numbers still match ("GRAB* A-1234 KL" and "GRAB*B-99 PJ" → "GRAB").
export function merchantKey(m: string): string | null {
  const word = normalizeMerchant(m)
    .split(" ")
    .find((w) => w.length >= 3 && !/\d/.test(w) && !STOPWORDS.has(w));
  return word ?? null;
}

// The tag to suggest for a merchant: the longest rule pattern found as a whole word in its name.
export function suggestTagId(merchant: string | null, rules: { pattern: string; tag_id: string }[]): string | null {
  if (!merchant) return null;
  const words = ` ${normalizeMerchant(merchant)} `;
  const hit = rules
    .filter((r) => words.includes(` ${normalizeMerchant(r.pattern)} `))
    .sort((a, b) => b.pattern.length - a.pattern.length)[0];
  return hit?.tag_id ?? null;
}
