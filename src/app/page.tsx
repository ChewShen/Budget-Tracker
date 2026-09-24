"use client";

import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { format, getDaysInMonth, parse, subMonths } from "date-fns";
import { useBudget } from "@/lib/budget-context";
import { MonthSelector } from "@/components/month-selector";
import { KpiCards } from "@/components/kpi-cards";
import { SpendHero } from "@/components/spend-hero";
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

  // 1b. Previous month total & daily series for the hero chart
  const monthDate = parse(`${selectedMonth}-01`, "yyyy-MM-dd", new Date());
  const monthLabel = format(monthDate, "MMMM");
  const previousMonth = format(subMonths(monthDate, 1), "yyyy-MM");
  const previousSpend = transactions
    .filter((t) => t.date.startsWith(previousMonth))
    .reduce((sum, t) => sum + t.amount, 0);
  const dailySeries = Array.from({ length: getDaysInMonth(monthDate) }, (_, i) => ({
    day: i + 1,
    amount: 0,
  }));
  monthTransactions.forEach((t) => {
    const day = Number(t.date.slice(8, 10));
    if (dailySeries[day - 1]) dailySeries[day - 1].amount += t.amount;
  });

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
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthSelector
          currentMonth={selectedMonth}
          onChangeMonth={setSelectedMonth}
        />

        <div className="flex items-center gap-1">
          <span
            className="flex items-center gap-1.5 px-2 text-xs text-muted-foreground"
            title={isSyncedWithSupabase ? "Synced with Supabase" : "Saved on this device only"}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isSyncedWithSupabase ? "bg-success" : "bg-muted-foreground"
              }`}
            />
            {isSyncedWithSupabase ? "Synced" : "Local only"}
          </span>
          <button
            onClick={handleExportCsv}
            className="flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            title="Export all transactions as CSV"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      <SpendHero
        monthLabel={monthLabel}
        totalSpend={totalSpend}
        previousSpend={previousSpend}
        transactionCount={monthTransactions.length}
        daily={dailySeries}
      />

      <KpiCards
        totalSpend={totalSpend}
        foodSpend={foodSpend}
        dailyAverage={dailyAverage}
        largestExpense={largestExpense}
        savingsRate={salaryMetrics.savingsRate}
      />

      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        <CategoryChart data={categoryChartData} />
        <TagsBarChart data={tagChartData} />
        <SalaryEngine
          gross={salaryMetrics.gross}
          epf={salaryMetrics.epf}
          socso={salaryMetrics.socso}
          eis={salaryMetrics.eis}
          netSalary={salaryMetrics.netSalary}
          netCashSaved={salaryMetrics.netCashSaved}
          savingsRate={salaryMetrics.savingsRate}
        />
        <RecurringSentinel items={recurringStatus} />
      </div>

      {/* Recent transactions */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold">Recent</h3>
          <Link
            href="/transactions"
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            See all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <LedgerTable
          transactions={[...monthTransactions]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 8)}
          onDeleteTransaction={deleteTransaction}
          showFilters={false}
        />
      </section>
    </div>
  );
}
