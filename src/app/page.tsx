"use client";

import Link from "next/link";
import { ArrowRight, Download, CheckCircle, Database } from "lucide-react";
import { useBudget } from "@/lib/budget-context";
import { MonthSelector } from "@/components/month-selector";
import { KpiCards } from "@/components/kpi-cards";
import { SalaryEngine } from "@/components/salary-engine";
import { RecurringSentinel } from "@/components/recurring-sentinel";
import { CategoryChart } from "@/components/category-chart";
import { TagsBarChart } from "@/components/tags-bar-chart";
import { LedgerTable } from "@/components/ledger-table";
import {
  calculateDailyAverage,
  calculateSalaryMetrics,
} from "@/lib/formulas";

// Recurring bill tags to monitor
const RECURRING_TAGS = [
  "Netflix",
  "iCloud",
  "Youtube Premium",
  "Youtube Membership",
  "Cuckoo",
  "Electric",
  "Water",
  "Season Parking",
];

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#B6FF2E",
  Transport: "#06b6d4",
  Home_Bills: "#3b82f6",
  Self_care: "#ec4899",
  Subscription: "#a855f7",
  Health: "#ef4444",
  Own_Interest: "#eab308",
  Entertainment: "#f97316",
  Shopping: "#10b981",
  Others: "#777E90",
};

export default function DashboardPage() {
  const {
    transactions,
    selectedMonth,
    setSelectedMonth,
    deleteTransaction,
    isSyncedWithSupabase,
  } = useBudget();

  // Filter transactions for currently selected month (YYYY-MM)
  const monthTransactions = transactions.filter((t) =>
    t.date.startsWith(selectedMonth)
  );

  // 1. Calculate Total Spend & Food Spend
  const totalSpend = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
  const foodSpend = monthTransactions
    .filter((t) => (t.category_name || "").toLowerCase() === "food")
    .reduce((sum, t) => sum + t.amount, 0);

  // 2. Daily Average (excluding one-off)
  const dailyAverage = calculateDailyAverage(
    monthTransactions,
    selectedMonth,
    new Date()
  );

  // 3. Largest Expense
  let largestExpense = null;
  if (monthTransactions.length > 0) {
    const sorted = [...monthTransactions].sort((a, b) => b.amount - a.amount);
    largestExpense = {
      amount: sorted[0].amount,
      tag_name: sorted[0].tag_name || "Unknown",
      category_name: sorted[0].category_name || "Unknown",
    };
  }

  // 4. Salary Engine (Gross RM 3,500 default)
  const salaryMetrics = calculateSalaryMetrics(3500, totalSpend);

  // 5. Category Breakdown for Donut Chart
  const catMap: Record<string, number> = {};
  monthTransactions.forEach((t) => {
    const cName = t.category_name || "Others";
    catMap[cName] = (catMap[cName] || 0) + t.amount;
  });
  const categoryChartData = Object.entries(catMap)
    .map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
      color: CATEGORY_COLORS[name] || "#6b7280",
    }))
    .sort((a, b) => b.value - a.value);

  // 6. Tag Breakdown for Bar Chart
  const tagMap: Record<string, number> = {};
  monthTransactions.forEach((t) => {
    const tName = t.tag_name || "Misc";
    tagMap[tName] = (tagMap[tName] || 0) + t.amount;
  });
  const tagChartData = Object.entries(tagMap).map(([name, value]) => ({
    name,
    value: Math.round(value * 100) / 100,
  }));

  // 7. Recurring Sentinel Status
  const loggedTagsInMonth = new Set(
    monthTransactions.map((t) => t.tag_name)
  );
  const recurringStatus = RECURRING_TAGS.map((tag) => ({
    tag_name: tag,
    isLogged: loggedTagsInMonth.has(tag),
  }));

  const handleExportCsv = () => {
    const headers = ["Date", "Category", "Tag", "Description", "Amount", "One-off"];
    const rows = transactions.map((t) => [
      t.date,
      t.category_name,
      t.tag_name,
      `"${t.description || ""}"`,
      t.amount,
      t.is_one_off ? "Y" : "N",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `budget_backup_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <MonthSelector
          currentMonth={selectedMonth}
          onChangeMonth={setSelectedMonth}
        />

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isSyncedWithSupabase ? (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <Database className="h-3 w-3" />
              Supabase Connected
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-primary" />
              Local Storage Mode
            </span>
          )}

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs transition hover:bg-muted"
            title="Export Backup CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards
        totalSpend={totalSpend}
        foodSpend={foodSpend}
        dailyAverage={dailyAverage}
        largestExpense={largestExpense}
        transactionCount={monthTransactions.length}
      />

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <CategoryChart data={categoryChartData} />
        <TagsBarChart data={tagChartData} />
      </div>

      {/* Salary & Deductions Engine */}
      <SalaryEngine
        gross={salaryMetrics.gross}
        epf={salaryMetrics.epf}
        socso={salaryMetrics.socso}
        eis={salaryMetrics.eis}
        netSalary={salaryMetrics.netSalary}
        netCashSaved={salaryMetrics.netCashSaved}
        savingsRate={salaryMetrics.savingsRate}
      />

      {/* Monthly Recurring Bills Sentinel */}
      <RecurringSentinel items={recurringStatus} />

      {/* Recent Transactions Snippet */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-foreground">
            Transactions ({monthTransactions.length})
          </h3>
          <Link
            href="/transactions"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Open Full Ledger <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <LedgerTable
          transactions={monthTransactions.slice(0, 10)}
          onDeleteTransaction={deleteTransaction}
        />
      </div>
    </div>
  );
}
