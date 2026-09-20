"use client";

import { useState } from "react";
import { PiggyBank, Landmark, Percent, TrendingUp, Save, Check } from "lucide-react";
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
  const { savings, transactions, selectedMonth, setSelectedMonth, updateSavings } =
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
  const { netCashSaved } = calculateSalaryMetrics(3500, totalSpend);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">
            Savings & Asset Tracking
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor bank accounts, digital bank yields, and locked assets
          </p>
        </div>

        <MonthSelector
          currentMonth={selectedMonth}
          onChangeMonth={setSelectedMonth}
        />
      </div>

      {/* Asset KPI Highlights */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Liquid Assets
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <PiggyBank className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-foreground">
            {formatCurrency(totalLiquid)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Checking + GXBank + Rize
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Est. Monthly Interest
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-blue-600">
            +{formatCurrency(estMonthlyInterest)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Compounded daily for this calendar month
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Net Worth
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-purple-600">
            {formatCurrency(totalNetWorth)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Liquid + EPF Locked ({formatCurrency(epfLocked)})
          </div>
        </div>
      </div>

      {/* Account Balances Form */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h3 className="font-bold text-base text-foreground">
            Account Balances for {selectedMonth}
          </h3>
          {isSaved && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 animate-in fade-in">
              <Check className="h-4 w-4" /> Saved
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Main Checking */}
            <div className="rounded-lg border p-3">
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Main Checking (RM)
              </label>
              <input
                type="number"
                step="0.01"
                value={mainChecking}
                onChange={(e) => setMainChecking(parseFloat(e.target.value) || 0)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm font-bold text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* EPF Locked */}
            <div className="rounded-lg border p-3">
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                EPF / Other - Locked (RM)
              </label>
              <input
                type="number"
                step="0.01"
                value={epfLocked}
                onChange={(e) => setEpfLocked(parseFloat(e.target.value) || 0)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm font-bold text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* GXBank */}
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  GXBank Balance (RM)
                </label>
                <div className="flex items-center gap-1 text-xs">
                  <span>Rate:</span>
                  <input
                    type="number"
                    step="0.01"
                    value={gxRate}
                    onChange={(e) => setGxRate(parseFloat(e.target.value) || 0)}
                    className="w-14 rounded border bg-background px-1.5 py-0.5 text-xs text-right font-semibold"
                  />
                  <span>%</span>
                </div>
              </div>
              <input
                type="number"
                step="0.01"
                value={gxBank}
                onChange={(e) => setGxBank(parseFloat(e.target.value) || 0)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm font-bold text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Rize / RYT Bank */}
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  RYT / Rize Bank (RM)
                </label>
                <div className="flex items-center gap-1 text-xs">
                  <span>Rate:</span>
                  <input
                    type="number"
                    step="0.01"
                    value={rytRate}
                    onChange={(e) => setRytRate(parseFloat(e.target.value) || 0)}
                    className="w-14 rounded border bg-background px-1.5 py-0.5 text-xs text-right font-semibold"
                  />
                  <span>%</span>
                </div>
              </div>
              <input
                type="number"
                step="0.01"
                value={rytBank}
                onChange={(e) => setRytBank(parseFloat(e.target.value) || 0)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm font-bold text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-95"
            >
              <Save className="h-4 w-4" />
              <span>Update Balances</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
