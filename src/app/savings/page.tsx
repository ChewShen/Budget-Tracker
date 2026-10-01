"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Lock, Pencil, Plus } from "lucide-react";
import { endOfMonth, format, parse } from "date-fns";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useBudget } from "@/lib/budget-context";
import { MonthSelector } from "@/components/month-selector";
import { BalancesSheet } from "@/components/balances-sheet";
import { EmergencyFundCard } from "@/components/emergency-fund";
import Link from "next/link";
import { earmarkedTotal } from "@/lib/goals";
import { AccountChanges } from "@/components/account-changes";
import { SavingsRateTrend } from "@/components/savings-rate-trend";
import { formatCurrency } from "@/lib/utils";
import { calculateSalaryMetrics, calculateUntrackedCash } from "@/lib/formulas";
import { totalOwed } from "@/lib/instalments";
import {
  accountsFor,
  averageMonthlySpend,
  buildSnapshots,
  draftFor,
  interestOf,
  latestBefore,
  liquidOf,
  netWorthOf,
  previousMonth,
  reachMonth,
  savingPace,
  snapshotFor,
} from "@/lib/savings";
import type { SavingsBalance } from "@/lib/types";

function TrendTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { label: string; value: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const { label, value } = payload[0].payload;
  return (
    <div className="rounded-xl border bg-popover px-3 py-2 text-xs shadow-xl">
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-semibold tabular-nums text-popover-foreground">{formatCurrency(value)}</div>
    </div>
  );
}

export default function SavingsPage() {
  const {
    savingsAccounts,
    savingsBalances,
    saveBalances,
    transactions,
    selectedMonth,
    setSelectedMonth,
    profile,
    showToast,
    emergencyMonths,
    setEmergencyMonths,
    goals,
    goalContributions,
    bills,
  } = useBudget();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const monthDate = parse(`${selectedMonth}-01`, "yyyy-MM-dd", new Date());
  const monthEndLabel = format(endOfMonth(monthDate), "d MMM yyyy");
  const monthName = format(monthDate, "MMMM");
  const isFutureMonth = selectedMonth > format(new Date(), "yyyy-MM");

  const snapshots = buildSnapshots(savingsBalances);
  const current = snapshotFor(snapshots, selectedMonth);
  const lastRecorded = latestBefore(snapshots, selectedMonth);
  // Growth and untracked cash only compare adjacent months; a gap would mix several months of saving.
  const prevAdjacent = snapshotFor(snapshots, previousMonth(selectedMonth));
  const liquid = (s: typeof current) => (s ? liquidOf(s, savingsAccounts) : 0);

  // Cash flow for the month: what salary minus spending says you should have saved.
  const totalSpend = transactions
    .filter((t) => t.date.startsWith(selectedMonth))
    .reduce((sum, t) => sum + t.amount, 0);
  const { netCashSaved, netSalary } = calculateSalaryMetrics(profile.default_gross_salary, totalSpend, profile);

  // Emergency fund: liquid money vs average spending of completed months.
  const spend = averageMonthlySpend(transactions, selectedMonth, format(new Date(), "yyyy-MM"));
  const pace = savingPace(snapshots, savingsAccounts, selectedMonth, netSalary, spend.average);
  // Money set aside for goals is today's figure, so it only applies to the latest recorded balances.
  const isLatestRecord = Boolean(current) && snapshots.at(-1)?.month === current?.month;
  const earmarked = isLatestRecord ? earmarkedTotal(goals, goalContributions) : 0;
  const freeLiquid = current ? Math.max(0, liquid(current) - earmarked) : 0;
  const emergencyTarget = emergencyMonths * spend.average;
  const reachBy = current ? reachMonth(selectedMonth, emergencyTarget - freeLiquid, pace.perMonth) : null;

  const growth = current && prevAdjacent ? liquid(current) - liquid(prevAdjacent) : null;
  const untracked =
    current && prevAdjacent ? calculateUntrackedCash(liquid(current), liquid(prevAdjacent), netCashSaved) : null;
  const estInterest = current ? interestOf(current, savingsAccounts) : 0;

  const history = snapshots.map((s) => ({
    month: s.month.slice(0, 7),
    label: format(parse(s.month, "yyyy-MM-dd", new Date()), "MMM yyyy"),
    short: format(parse(s.month, "yyyy-MM-dd", new Date()), "MMM"),
    value: Math.round(netWorthOf(s) * 100) / 100,
  }));

  // Savings rate for up to 12 months with expenses, ending at the selected month.
  const currentMonth = format(new Date(), "yyyy-MM");
  const rateHistory = Array.from(new Set(transactions.map((t) => t.date.slice(0, 7))))
    .filter((m) => m <= selectedMonth)
    .sort()
    .slice(-12)
    .map((m) => {
      const spent = transactions.filter((t) => t.date.startsWith(m)).reduce((sum, t) => sum + t.amount, 0);
      const metrics = calculateSalaryMetrics(profile.default_gross_salary, spent, profile);
      return { month: m, rate: metrics.savingsRate, saved: metrics.netCashSaved, inProgress: m === currentMonth };
    });

  const handleSave = async (lines: Pick<SavingsBalance, "account_id" | "balance" | "rate">[]) => {
    setIsSheetOpen(false);
    if (await saveBalances(selectedMonth, lines)) showToast({ tone: "default", message: `Balances saved for ${monthName}` });
  };
  const hasAccounts = savingsAccounts.some((a) => !a.archived);

  const netWorth = current ? netWorthOf(current) : 0;
  // Still owed on instalment plans at the end of the month (today for this month): a debt, so
  // it's shown next to net worth, and net worth after it.
  const todayIso = format(new Date(), "yyyy-MM-dd");
  const monthEndIso = format(endOfMonth(monthDate), "yyyy-MM-dd");
  const owed = totalOwed(
    bills,
    transactions,
    monthEndIso < todayIso ? monthEndIso : todayIso,
    (b) => goals.find((g) => g.id === b.goal_id)?.bought_at
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Savings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Month-end balances and net worth</p>
        </div>
        <MonthSelector currentMonth={selectedMonth} onChangeMonth={setSelectedMonth} />
      </div>

      {current ? (
        /* Net worth for a recorded month */
        <section className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="eyebrow">Net worth on {monthEndLabel}</div>
              <div className="mt-1.5 text-4xl font-semibold tracking-tight sm:text-5xl">
                {formatCurrency(netWorth)}
              </div>
            </div>
            <button
              onClick={() => setIsSheetOpen(true)}
              className="flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition hover:bg-secondary"
            >
              <Pencil className="h-3.5 w-3.5" />
              Update balances
            </button>
          </div>
          {owed > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              <Link href="/settings/bills" className="underline decoration-border underline-offset-4 hover:text-foreground">
                {formatCurrency(owed)} still owed on instalments
              </Link>{" "}
              · <span className="font-medium text-foreground tabular-nums">{formatCurrency(netWorth - owed)}</span> after
              what you owe
            </p>
          )}
          {earmarked > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              <Link href="/goals" className="underline decoration-border underline-offset-4 hover:text-foreground">
                {formatCurrency(earmarked)} set aside for goals
              </Link>{" "}
              · <span className="tabular-nums">{formatCurrency(freeLiquid)}</span> liquid money free
            </p>
          )}

          <ul className="mt-6 divide-y divide-border/70 border-t">
            {accountsFor(savingsAccounts, current)
              .filter((a) => a.id in current.balances)
              .map((account) => {
                const value = current.balances[account.id].balance;
                const share = netWorth > 0 ? (value / netWorth) * 100 : 0;
                return (
                  <li key={account.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className="flex w-28 shrink-0 items-center gap-1 truncate sm:w-36" title={account.name}>
                      <span className="truncate">{account.name}</span>
                      {account.kind === "locked" && (
                        <Lock className="h-3 w-3 shrink-0 text-muted-foreground" aria-label="Locked, not counted as liquid" />
                      )}
                    </span>
                    <div className="h-1.5 flex-1 rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
                    </div>
                    <span className="w-28 shrink-0 text-right tabular-nums">{formatCurrency(value)}</span>
                  </li>
                );
              })}
          </ul>
        </section>
      ) : !hasAccounts ? (
        /* No accounts yet (e.g. a new account holder) */
        <section className="card p-5 sm:p-6">
          <div className="eyebrow">Net worth</div>
          <div className="mt-1.5 text-2xl font-semibold tracking-tight text-muted-foreground">No accounts yet</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Add the accounts you want to track (bank accounts, e-wallets, EPF, investments), then record their
            balances at the end of each month.
          </p>
          <Link
            href="/settings/savings"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-95 active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add accounts
          </Link>
        </section>
      ) : (
        /* Month not recorded yet */
        <section className="card p-5 sm:p-6">
          <div className="eyebrow">Net worth on {monthEndLabel}</div>
          <div className="mt-1.5 text-2xl font-semibold tracking-tight text-muted-foreground">
            {isFutureMonth ? `${monthName} hasn't happened yet` : "Not recorded yet"}
          </div>
          {!isFutureMonth && (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                {lastRecorded
                  ? `Starts from your ${format(parse(lastRecorded.month, "yyyy-MM-dd", new Date()), "MMMM")} balances (${formatCurrency(netWorthOf(lastRecorded))}), so you only change what moved.`
                  : "Enter your account balances at the end of the month."}
              </p>
              <button
                onClick={() => setIsSheetOpen(true)}
                className="mt-4 flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-95 active:scale-[0.97]"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Record {monthName} balances
              </button>
            </>
          )}
        </section>
      )}

      {current && (
        <EmergencyFundCard
          liquid={freeLiquid}
          earmarked={earmarked}
          averageSpend={spend.average}
          spendMonths={spend.months}
          goalMonths={emergencyMonths}
          onChangeGoal={setEmergencyMonths}
          pace={pace}
          reachBy={reachBy}
        />
      )}

      {current && lastRecorded && (
        <AccountChanges
          accounts={[...savingsAccounts].sort((a, b) => a.position - b.position)}
          current={current}
          previous={lastRecorded}
          previousLabel={format(parse(lastRecorded.month, "yyyy-MM-dd", new Date()), "MMMM")}
        />
      )}

      {current && (
        /* This month: growth vs. what the budget says you saved */
        <section className="card p-5 sm:p-6">
          <h3 className="text-[15px] font-semibold">{monthName} check</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Did your liquid money grow by what you saved from salary?
          </p>

          {growth === null ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Record {format(parse(`${previousMonth(selectedMonth)}-01`, "yyyy-MM-dd", new Date()), "MMMM")}{" "}
              balances too, to compare month to month.
            </p>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <div className="eyebrow">Liquid money grew</div>
                  <div
                    className={`mt-1 flex items-center gap-1 text-lg font-semibold tabular-nums ${
                      growth >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {growth >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {formatCurrency(Math.abs(growth))}
                  </div>
                </div>
                <div>
                  <div className="eyebrow">Saved from salary</div>
                  <div className="mt-1 text-lg font-semibold tabular-nums">{formatCurrency(netCashSaved)}</div>
                  <div className="text-xs text-muted-foreground">Take-home minus logged spending</div>
                </div>
                <div>
                  <div className="eyebrow">Untracked</div>
                  <div className="mt-1 text-lg font-semibold tabular-nums">
                    {untracked === null ? "—" : `${untracked > 0 ? "+" : untracked < 0 ? "−" : ""}${formatCurrency(Math.abs(untracked))}`}
                  </div>
                </div>
              </div>

              {untracked !== null && Math.abs(untracked) >= 1 && (
                <p className="mt-4 rounded-xl bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
                  {untracked > 0
                    ? `You have ${formatCurrency(untracked)} more than your budget explains: interest, refunds or income you didn't log.`
                    : `You have ${formatCurrency(Math.abs(untracked))} less than your budget explains: probably spending you didn't log.`}
                </p>
              )}
            </>
          )}

          {estInterest > 0 && (
            <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
              <span className="text-muted-foreground">Est. interest for {monthName}</span>
              <span className="font-medium tabular-nums text-success">+{formatCurrency(estInterest)}</span>
            </div>
          )}
        </section>
      )}

      {/* Net worth trend */}
      {history.length >= 2 && (
        <section className="card p-5 sm:p-6">
          <h3 className="text-[15px] font-semibold">Net worth over time</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Recorded months · tap a bar to open it</p>
          <div className="mt-5 h-44 w-full" aria-label="Net worth by month">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={history} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barCategoryGap="24%">
                <XAxis
                  dataKey="short"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  height={20}
                />
                <Tooltip cursor={{ fill: "hsl(var(--foreground) / 0.06)", radius: 4 }} content={<TrendTooltip />} />
                <Bar
                  dataKey="value"
                  radius={[4, 4, 4, 4]}
                  maxBarSize={56}
                  isAnimationActive={false}
                  className="cursor-pointer"
                  onClick={(d: { month?: string }) => d.month && setSelectedMonth(d.month)}
                >
                  {history.map((h) => (
                    <Cell
                      key={h.month}
                      fill={h.month === selectedMonth ? "hsl(var(--primary))" : "hsl(var(--chart-bar))"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {rateHistory.length > 0 && (
        <SavingsRateTrend
          data={rateHistory}
          target={20}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
        />
      )}

      <BalancesSheet
        isOpen={isSheetOpen}
        monthLabel={monthEndLabel}
        lines={draftFor(savingsAccounts, snapshots, selectedMonth)}
        previousLabel={lastRecorded ? format(parse(lastRecorded.month, "yyyy-MM-dd", new Date()), "MMM") : undefined}
        onClose={() => setIsSheetOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
