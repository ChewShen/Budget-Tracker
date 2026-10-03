"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Copy, KeyRound, Plus } from "lucide-react";
import { useBudget } from "@/lib/budget-context";
import { useApiTokens } from "@/lib/automation";

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold">
        {n}
      </span>
      <span className="min-w-0 text-sm text-muted-foreground">{children}</span>
    </li>
  );
}

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[12px] text-foreground">{children}</code>
);

export default function AutomationSettingsPage() {
  const { mode, showToast } = useBudget();
  const isCloud = mode === "cloud";
  const { tokens, error, create, revoke } = useApiTokens(isCloud);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [name, setName] = useState("iPhone Shortcut");
  const [isBusy, setIsBusy] = useState(false);
  const [endpoint, setEndpoint] = useState("/api/ingest");

  useEffect(() => setEndpoint(`${window.location.origin}/api/ingest`), []);

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast({ tone: "default", message: `${what} copied` });
    } catch {
      showToast({ tone: "error", message: "Couldn't copy. Select it and copy by hand." });
    }
  };

  const sendTest = async () => {
    if (!newToken) return;
    const res = await fetch("/api/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${newToken}` },
      body: JSON.stringify({
        source: "shortcut",
        text: `Payment Successful\nRM 1.00\nPaid to\nTest Merchant\n${format(new Date(), "d MMM yyyy")}`,
      }),
    });
    const body = await res.json().catch(() => ({}));
    showToast(
      res.ok
        ? { tone: "default", message: body.message || "Sent to Inbox" }
        : { tone: "error", message: body.error || "Test failed" }
    );
  };

  if (!isCloud)
    return (
      <section className="card p-5 sm:p-6">
        <h3 className="text-[15px] font-semibold">Automation</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Shortcuts send expenses to your account, so this needs you to be signed in.
        </p>
      </section>
    );

  const active = tokens.filter((t) => !t.revoked_at);

  return (
    <>
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-semibold">Personal tokens</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Lets a Shortcut add expenses to your <Link href="/inbox" className="underline underline-offset-2">Inbox</Link>.
              It can&apos;t read anything. Revoke it if your phone is lost.
            </p>
          </div>
        </div>
        {error && <p className="mt-3 text-xs text-danger">{error}</p>}

        {newToken ? (
          <div className="mt-4 rounded-xl border border-warning/50 bg-warning/10 p-4">
            <p className="text-sm font-medium">Copy your token now. It won&apos;t be shown again.</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 break-all rounded-lg bg-background px-3 py-2 font-mono text-xs">{newToken}</code>
              <button
                onClick={() => copy(newToken, "Token")}
                className="shrink-0 rounded-full border p-2 transition hover:bg-secondary"
                aria-label="Copy token"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={sendTest} className="rounded-full border px-3.5 py-1.5 text-xs font-medium transition hover:bg-secondary">
                Send a test to the Inbox
              </button>
              <button
                onClick={() => setNewToken(null)}
                className="rounded-full px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-secondary"
              >
                I&apos;ve copied it
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsBusy(true);
              const token = await create(name);
              setIsBusy(false);
              if (token) setNewToken(token);
            }}
            className="mt-4 flex gap-2"
          >
            <input
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              className="field min-w-0 flex-1 py-2"
              aria-label="Token name"
              placeholder="e.g. iPhone Shortcut"
            />
            <button
              type="submit"
              disabled={isBusy}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" /> Create token
            </button>
          </form>
        )}

        {active.length > 0 && (
          <ul className="mt-4 divide-y divide-border/70">
            {active.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2.5">
                <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{t.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {t.token_prefix}… · created {format(parseISO(t.created_at), "d MMM yyyy")} ·{" "}
                    {t.last_used_at ? `last used ${format(parseISO(t.last_used_at), "d MMM, h:mm a")}` : "never used"}
                  </span>
                </span>
                <button
                  onClick={() => {
                    if (window.confirm(`Revoke "${t.name}"? Shortcuts using it will stop working.`)) revoke(t.id);
                  }}
                  className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-danger transition hover:bg-danger/10"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5 sm:p-6">
        <h3 className="text-[15px] font-semibold">iPhone Shortcut: TnG and other receipts</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          After paying, double-tap the back of your phone on the success screen. It reads the screen on your phone and
          sends only the text.
        </p>
        <ol className="mt-4 space-y-3">
          <Step n={1}>
            Open <strong className="text-foreground">Shortcuts</strong> → <Code>+</Code> and name it{" "}
            <Code>Log payment</Code>.
          </Step>
          <Step n={2}>
            Add <Code>Take Screenshot</Code>, then <Code>Extract Text from Screenshot</Code>.
          </Step>
          <Step n={3}>
            Add <Code>Get Contents of URL</Code>. URL:{" "}
            <button onClick={() => copy(endpoint, "URL")} className="break-all text-left font-mono text-[12px] text-foreground underline underline-offset-2">
              {endpoint}
            </button>
            . Tap ▸ to show more: Method <Code>POST</Code>; Headers: <Code>Authorization</Code> ={" "}
            <Code>Bearer your-token</Code>; Request Body <Code>JSON</Code> with <Code>text</Code> = Text (from step 2) and{" "}
            <Code>source</Code> = <Code>tng</Code>.
          </Step>
          <Step n={4}>
            Add <Code>Get Dictionary Value</Code> for <Code>message</Code>, then <Code>Show Notification</Code> with it,
            so you see “RM 12.50 · Tealive → Coffee · added to Inbox”.
          </Step>
          <Step n={5}>
            iPhone <strong className="text-foreground">Settings → Accessibility → Touch → Back Tap → Double Tap</strong> →
            choose <Code>Log payment</Code>.
          </Step>
        </ol>
      </section>

      <section className="card p-5 sm:p-6">
        <h3 className="text-[15px] font-semibold">Apple Pay and Siri</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Apple Pay, automatic:</strong> Shortcuts → Automation → <Code>+</Code> →{" "}
            <Code>Transaction</Code> → your cards → Run Immediately. Then <Code>Get Contents of URL</Code> as above, with
            JSON <Code>amount</Code> = Amount, <Code>merchant</Code> = Merchant, <Code>source</Code> ={" "}
            <Code>applepay</Code>.
          </li>
          <li>
            <strong className="text-foreground">Siri:</strong> a Shortcut with <Code>Ask for Input</Code> (number) and{" "}
            <Code>Ask for Input</Code> (text), sending <Code>amount</Code> and <Code>merchant</Code>. Name it “Log expense”
            and say “Hey Siri, log expense”.
          </li>
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Everything lands in the <Link href="/inbox" className="underline underline-offset-2">Inbox</Link> first. When you
          confirm one, the app remembers the merchant&apos;s tag and suggests it next time.
        </p>
      </section>
    </>
  );
}
