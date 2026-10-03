"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Check, ChevronLeft, Copy, Inbox, X } from "lucide-react";
import { useBudget } from "@/lib/budget-context";
import { useInbox, type InboxItem } from "@/lib/automation";
import { categoryLabel } from "@/lib/categories";
import { merchantKey, parseCapture } from "@/lib/ingest";
import { cn, formatCurrency } from "@/lib/utils";

const SOURCE_LABELS: Record<string, string> = {
  tng: "TnG",
  applepay: "Apple Pay",
  shortcut: "Shortcut",
  email: "Email",
  bank: "Bank",
};

// Items keep the text that was read off the screen, so they're read again with the latest rules
// here: an item captured before a parsing fix (e.g. a logo read as the merchant) fixes itself.
type ReadItem = InboxItem & { isTransfer: boolean };

function reread(item: InboxItem): ReadItem {
  if (!item.raw_text) return { ...item, isTransfer: false };
  const fresh = parseCapture({ text: item.raw_text }, format(new Date(), "yyyy-MM-dd"));
  return {
    ...item,
    merchant: fresh.merchant, // same text, newer rules: trust it even when it finds none
    amount: item.amount ?? fresh.amount,
    occurred_on: fresh.date ?? item.occurred_on,
    isTransfer: fresh.isTransfer,
  };
}

interface Draft {
  amount: string;
  date: string;
  categoryId: string;
  tagId: string;
  remember: boolean;
}

const isMoney = (t: string) => /^\d*\.?\d{0,2}$/.test(t);

function InboxRow({
  item,
  draft,
  onChange,
  onConfirm,
  onDismiss,
}: {
  item: ReadItem;
  draft: Draft;
  onChange: (d: Partial<Draft>) => void;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const { categories, tags, transactions, showToast } = useBudget();
  const [showRaw, setShowRaw] = useState(false);
  const categoryTags = tags.filter((t) => t.category_id === draft.categoryId);
  const amount = parseFloat(draft.amount);
  const canConfirm = amount > 0 && Boolean(draft.tagId) && Boolean(draft.date);
  const key = item.merchant ? merchantKey(item.merchant) : null;
  // Already logged? (typed in by hand, or the same payment captured from another screen, which
  // has different reference numbers so it couldn't be blocked automatically.)
  const sameDay = amount > 0 ? transactions.find((t) => t.date === draft.date && Math.abs(t.amount - amount) < 0.005) : undefined;

  return (
    <li className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold">{item.merchant || "Unknown merchant"}</span>
            {sameDay && (
        <p className="mt-2 rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
          You already have {formatCurrency(sameDay.amount)} on {format(parseISO(sameDay.date), "d MMM")} (
          {categoryLabel(sameDay.category_name ?? categories.find((c) => c.id === sameDay.category_id)?.name)} ·{" "}
          {sameDay.tag_name ?? tags.find((t) => t.id === sameDay.tag_id)?.name}). Dismiss this if it&apos;s the same one.
        </p>
      )}

      {item.isTransfer && (
              <span className="shrink-0 rounded-full border px-1.5 py-px text-[10px] font-medium text-muted-foreground">
                Transfer
              </span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {SOURCE_LABELS[item.source] ?? item.source} · received {format(parseISO(item.created_at), "d MMM, h:mm a")}
            {item.raw_text && (
              <>
                {" · "}
                <button onClick={() => setShowRaw((v) => !v)} className="underline underline-offset-2">
                  {showRaw ? "hide" : "original"}
                </button>
              </>
            )}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="-mr-1.5 -mt-1 shrink-0 rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          aria-label={`Dismiss ${item.merchant || "item"}`}
          title="Dismiss (not an expense)"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {item.isTransfer && (
        <p className="mt-2 text-xs text-muted-foreground">
          A transfer: moving money to your own account isn&apos;t spending, so dismiss it if that&apos;s what it was.
        </p>
      )}

      {showRaw && item.raw_text && (
        <div className="mt-3 rounded-lg bg-secondary/60 p-3">
          <pre className="whitespace-pre-wrap text-xs text-muted-foreground">{item.raw_text}</pre>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(item.raw_text as string);
                showToast({ tone: "default", message: "Original text copied" });
              } catch {
                showToast({ tone: "error", message: "Couldn't copy. Select the text instead." });
              }
            }}
            className="mt-2 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition hover:bg-secondary"
          >
            <Copy className="h-3 w-3" /> Copy
          </button>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-xs text-muted-foreground">Amount (RM)</span>
          <input
            inputMode="decimal"
            placeholder="Not found"
            value={draft.amount}
            onChange={(e) => isMoney(e.target.value) && onChange({ amount: e.target.value })}
            className="field mt-1 py-2 font-semibold tabular-nums"
            aria-label="Amount"
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">Date</span>
          <input
            type="date"
            value={draft.date}
            onChange={(e) => onChange({ date: e.target.value })}
            className="field mt-1 py-2"
            aria-label="Date"
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">Category</span>
          <select
            value={draft.categoryId}
            onChange={(e) =>
              onChange({ categoryId: e.target.value, tagId: tags.find((t) => t.category_id === e.target.value)?.id ?? "" })
            }
            className="field mt-1 py-2"
            aria-label="Category"
          >
            <option value="" disabled>
              Choose
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {categoryLabel(c.name)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">Tag</span>
          <select
            value={draft.tagId}
            onChange={(e) => onChange({ tagId: e.target.value })}
            className="field mt-1 py-2"
            aria-label="Tag"
          >
            <option value="" disabled>
              Choose
            </option>
            {categoryTags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        {key ? (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={draft.remember}
              onChange={(e) => onChange({ remember: e.target.checked })}
              className="h-4 w-4 accent-[hsl(var(--primary))]"
            />
            Next time, suggest this tag for “{key}”
          </label>
        ) : (
          <span />
        )}
        <button
          onClick={onConfirm}
          disabled={!canConfirm}
          className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:opacity-40"
        >
          <Check className="h-4 w-4" strokeWidth={2.5} />
          {amount > 0 ? `Add ${formatCurrency(amount)}` : "Add"}
        </button>
      </div>
    </li>
  );
}

export default function InboxPage() {
  const { mode, tags, addTransaction, showToast } = useBudget();
  const isCloud = mode === "cloud";
  const { items: stored, isLoaded, error, resolve } = useInbox(isCloud);
  const items = useMemo(() => stored.map(reread), [stored]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  // A draft per item, prefilled from what was captured and the suggested tag.
  useEffect(() => {
    setDrafts((prev) => {
      if (items.every((i) => prev[i.id])) return prev; // nothing new
      const next = { ...prev };
      for (const i of items) {
        if (next[i.id]) continue;
        const tag = tags.find((t) => t.id === i.suggested_tag_id);
        next[i.id] = {
          amount: i.amount ? String(i.amount) : "",
          date: i.occurred_on ?? format(new Date(), "yyyy-MM-dd"),
          categoryId: tag?.category_id ?? i.suggested_category_id ?? "",
          tagId: tag?.id ?? "",
          remember: !tag, // learn new merchants; known ones are already remembered
        };
      }
      return next;
    });
  }, [items, tags]);

  const update = (id: string, d: Partial<Draft>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...d, ...(d.tagId && d.tagId !== prev[id]?.tagId ? { remember: true } : {}) } }));

  const confirm = async (item: ReadItem, quiet = false) => {
    const d = drafts[item.id];
    const amount = parseFloat(d?.amount ?? "");
    if (!d || !(amount > 0) || !d.tagId) return false;
    const ok = await resolve(item, "accepted", d.remember ? { tagId: d.tagId } : undefined);
    if (!ok) return false;
    await addTransaction({
      amount: Math.round(amount * 100) / 100,
      date: d.date,
      category_id: d.categoryId,
      tag_id: d.tagId,
      description: item.merchant ?? undefined,
      is_one_off: false,
    });
    if (!quiet) showToast({ tone: "default", message: `Added ${formatCurrency(amount)}${item.merchant ? ` · ${item.merchant}` : ""}` });
    return true;
  };

  const ready = items.filter((i) => {
    const d = drafts[i.id];
    return d && parseFloat(d.amount) > 0 && d.tagId && d.date;
  });

  const confirmAll = async () => {
    let n = 0;
    for (const i of ready) if (await confirm(i, true)) n++;
    showToast({ tone: "default", message: `Added ${n} expense${n === 1 ? "" : "s"} from the Inbox` });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Link
          href="/"
          className="-ml-1 mb-2 inline-flex items-center gap-0.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Overview
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Expenses sent by your Shortcuts. Check them, then add.{" "}
              <Link href="/settings/automation" className="underline underline-offset-2 hover:text-foreground">
                Set up
              </Link>
            </p>
          </div>
          {ready.length > 1 && (
            <button
              onClick={confirmAll}
              className="rounded-full border px-4 py-2 text-sm font-medium transition hover:bg-secondary"
            >
              Add all {ready.length} ready
            </button>
          )}
        </div>
      </div>

      {!isCloud ? (
        <section className="card p-5 text-sm text-muted-foreground">
          The Inbox is filled by Shortcuts sending to your account, so it needs you to be signed in.
        </section>
      ) : error ? (
        <section className="card p-5 text-sm text-danger">{error}</section>
      ) : !isLoaded ? (
        <div className="h-40 animate-pulse rounded-2xl bg-card" />
      ) : items.length === 0 ? (
        <section className="card flex flex-col items-center px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Inbox className="h-5 w-5" />
          </span>
          <h3 className="mt-4 text-[15px] font-semibold">Nothing to confirm</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Payments sent from your iPhone Shortcut (TnG, Apple Pay, Siri) show up here.
          </p>
        </section>
      ) : (
        <ul className={cn("space-y-3")}>
          {items.map((item) =>
            drafts[item.id] ? (
              <InboxRow
                key={item.id}
                item={item}
                draft={drafts[item.id]}
                onChange={(d) => update(item.id, d)}
                onConfirm={() => confirm(item)}
                onDismiss={async () => {
                  if (await resolve(item, "dismissed")) showToast({ tone: "default", message: "Dismissed" });
                }}
              />
            ) : null
          )}
        </ul>
      )}
    </div>
  );
}
