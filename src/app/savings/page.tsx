"use client";

import { useState } from "react";
import { Save, Check } from "lucide-react";
import { format, parse } from "date-fns";
import { useBudget } from "@/lib/budget-context";
import { MonthSelector } from "@/components/month-selector";
import { formatCurrency } from "@/lib/utils";
import {
  calculateDigitalBankInterest,
  calculateSalaryMetrics,
  calculateUntrackedCash,
} from "@/lib/formulas";
import { MonthlySavings } from "@/lib/types";

export default function SavingsPage() {
  const { savings, transactions, selectedMonth, setSelectedMonth, updateSavings, profile } =
    useBudget();

  // Find savings entry for active month or fallback
  const activeSavings =
    savings.find((s) => s.month.startsWith(selectedMonth)) || {
      month: `${selectedMonth}-01`,
      main_checking: 0,
      gx_bank: 0,
      gx_rate: 0.0355,
      ryt_bank: 0,
      ryt_rate: 0,
      epf_locked: 0,
    };

  // State for editing balances
  const [mainChecking, setMainChecking] = useState(activeSavings.main_checking);
  const [gxBank, setGxBank] = useState(activeSavings.gx_bank);
  const [gxRate, setGxRate] = useState(activeSavings.gx_rate * 100);
  const [rytBank, setRytBank] = useState(activeSavings.ryt_bank);
  const [rytRate, setRytRate] = useState(activeSavings.ryt_rate * 100);
  const [epfLocked, setEpfLocked] = useState(activeSavings.epf_locked);
  const [isSaved, setIsSaved] = useState(false);

  // Sync state when activeSavings changes
  const [lastMonth, setLastMonth] = useState(selectedMonth);
  if (selectedMonth !== lastMonth) {
    setLastMonth(selectedMonth);
    setMainChecking(activeSavings.main_checking);
    setGxBank(activeSavings.gx_bank);
    setGxRate(activeSavings.gx_rate * 100);
    setRytBank(activeSavings.ryt_bank);
    setRytRate(activeSavings.ryt_rate * 100);
    setEpfLocked(activeSavings.epf_locked);
  }

  // Calculate Liquid & Total
  const totalLiquid = mainChecking + gxBank + rytBank;
  const totalNetWorth = totalLiquid + epfLocked;

  // Calculate Compound Interest
  const estMonthlyInterest = calculateDigitalBankInterest(
    gxBank,
    gxRate / 100,
    rytBank,
    rytRate / 100,
    selectedMonth
  );

  // Untracked Cash calculation against Net Cash Saved
  const monthTransactions = transactions.filter((t) =>
    t.date.startsWith(selectedMonth)
  );
  const totalSpend = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
  const { netCashSaved } = calculateSalaryMetrics(profile.default_gross_salary, totalSpend, profile);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: MonthlySavings = {
      month: `${selectedMonth}-01`,
      main_checking: Number(mainChecking) || 0,
      gx_bank: Number(gxBank) || 0,
      gx_rate: (Number(gxRate) || 0) / 100,
      ryt_bank: Number(rytBank) || 0,
      ryt_rate: (Number(rytRate) || 0) / 100,
      epf_locked: Number(epfLocked) || 0,
    };
    await updateSavings(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const accounts = [
    { label: "Main checking", value: mainChecking, set: setMainChecking },
    { label: "GXBank", value: gxBank, set: setGxBank, rate: gxRate, setRate: setGxRate },
    { label: "RYT / Rize", value: rytBank, set: setRytBank, rate: rytRate, setRate: setRytRate },
    { label: "EPF & locked", value: epfLocked, set: setEpfLocked },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Savings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Balances, interest and net worth
          </p>
        </div>
        <MonthSelector
          currentMonth={selectedMonth}
          onChangeMonth={setSelectedMonth}
        />
      </div>

      {/* Net worth hero */}
      <section className="card p-5 sm:p-6">
        <div className="eyebrow">Net worth</div>
        <div className="mt-1.5 text-4xl font-semibold tracking-tight sm:text-5xl">
          {formatCurrency(totalNetWorth)}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-5 sm:grid-cols-3">
          <div>
            <div className="eyebrow">Liquid</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{formatCurrency(totalLiquid)}</div>
          </div>
          <div>
            <div className="eyebrow">Locked (EPF)</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{formatCurrency(epfLocked)}</div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <div className="eyebrow">Est. interest this month</div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-success">
              +{formatCurrency(estMonthlyInterest)}
            </div>
          </div>
        </div>

        {/* Allocation bar */}
        {totalNetWorth > 0 && (
          <div className="mt-5">
            <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full">
              {accounts.map((a, i) =>
                a.value > 0 ? (
                  <div
                    key={a.label}
                    className="h-full"
                    style={{
                      width: `${(a.value / totalNetWorth) * 100}%`,
                      background: `hsl(var(--primary) / ${1 - i * 0.25})`,
                    }}
                    title={`${a.label}: ${formatCurrency(a.value)}`}
                  />
                ) : null
              )}
            </div>
            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {accounts.map((a, i) => (
                <span key={a.label} className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: `hsl(var(--primary) / ${1 - i * 0.25})` }}
                  />
                  {a.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Balances form */}
      <form onSubmit={handleSave} className="card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-semibold">Account balances</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Snapshot for {format(parse(`${selectedMonth}-01`, "yyyy-MM-dd", new Date()), "MMMM yyyy")}
            </p>
          </div>
          {isSaved && (
            <span className="flex animate-fade-in items-center gap-1 text-xs font-medium text-success">
              <Check className="h-4 w-4" /> Saved
            </span>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {accounts.map((a) => (
            <div key={a.label} className="rounded-xl bg-secondary/50 p-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">{a.label}</label>
                {a.setRate && (
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <input
                      type="number"
                      step="0.01"
                      value={a.rate}
                      onChange={(e) => a.setRate(parseFloat(e.target.value) || 0)}
                      className="w-12 rounded-md bg-background px-1.5 py-0.5 text-right font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/30"
                      aria-label={`${a.label} interest rate`}
                    />
                    % p.a.
                  </label>
                )}
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-sm text-muted-foreground">RM</span>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={a.value}
                  onChange={(e) => a.set(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent text-xl font-semibold tabular-nums tracking-tight outline-none"
                  aria-label={`${a.label} balance`}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-95 active:scale-[0.97]"
          >
            <Save className="h-4 w-4" />
            Save balances
          </button>
        </div>
      </form>
    </div>
  );
}
