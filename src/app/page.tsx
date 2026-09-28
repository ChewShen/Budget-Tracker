"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ExportMenu } from "@/components/export-menu";
import { format, getDaysInMonth, parse, subMonths } from "date-fns";
import { useBudget } from "@/lib/budget-context";
import { MonthSelector } from "@/components/month-selector";
import { KpiCards } from "@/components/kpi-cards";
import { SpendHero } from "@/components/spend-hero";
import { SalaryEngine } from "@/components/salary-engine";
import { RecurringSentinel, type BillStatus } from "@/components/recurring-sentinel";
import { canAutoLog } from "@/lib/bills";
import {
  baseline,
  monthForecast,
  monthInsights,
  monthProgress,
  monthlyTotals,
  spendSplit,
  yearToDate,
} from "@/lib/analytics";
import { YearToDateCard } from "@/components/year-to-date";
import { SpendSplitCard } from "@/components/spend-split";
import { SpendingCalendar } from "@/components/spending-calendar";
import { InsightsCard } from "@/components/insights-card";
import { SpendingTrend } from "@/components/spending-trend";
import { CategoryChart } from "@/components/category-chart";
import { TagsBarChart } from "@/components/tags-bar-chart";
import { LedgerTable } from "@/components/ledger-table";
import {
  calculateDailyAverage,
  calculateSalaryMetrics,
} from "@/lib/formulas";

export default function DashboardPage() {
  const {
    transactions,
    selectedMonth,
    setSelectedMonth,
    deleteTransaction,
    isSyncedWithSupabase,
    profile,
    updateProfile,
    tags,
    bills,
    addTransaction,
    showToast,
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
    count: 0,
  }));
  monthTransactions.forEach((t) => {
    const day = Number(t.date.slice(8, 10));
    if (dailySeries[day - 1]) {
      dailySeries[day - 1].amount += t.amount;
      dailySeries[day - 1].count += 1;
    }
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

  // 4. Salary Engine (gross salary and SOCSO/EIS from the user's profile)
  const salaryMetrics = calculateSalaryMetrics(profile.default_gross_salary, totalSpend, profile);

  // 5. Category Breakdown for Donut Chart
  const catMap: Record<string, number> = {};
  monthTransactions.forEach((t) => {
    const cName = t.category_name || "Others";
    catMap[cName] = (catMap[cName] || 0) + t.amount;
  });
  // Compared with the 3-month average, pro-rated to today for the current month.
  const categoryBaseline = baseline(transactions, selectedMonth, (t) => t.category_name || "Others");
  const progress = monthProgress(selectedMonth, format(new Date(), "yyyy-MM-dd"));
  const categoryChartData = Object.entries(catMap)
    .map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
      usual: categoryBaseline.monthsUsed
        ? Math.round((categoryBaseline.average.get(name) || 0) * progress * 100) / 100
        : undefined,
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

  // 7. Monthly bills: matched by tag id, so renaming a tag doesn't break them.
  const billTagIds = new Set(bills.map((b) => b.tag_id));
  const daysInSelectedMonth = getDaysInMonth(monthDate);
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const currentMonthStr = todayStr.slice(0, 7);
  const loggedTagIds = new Set(monthTransactions.map((t) => t.tag_id));
  const dayStr = (day: number) =>
    `${selectedMonth}-${String(Math.min(day, daysInSelectedMonth)).padStart(2, "0")}`;

  const billRows = bills
    .filter((b) => b.is_active)
    .flatMap((bill) => {
      const tag = tags.find((t) => t.id === bill.tag_id);
      if (!tag) return [];
      const isLogged = loggedTagIds.has(tag.id);
      const dueDate = bill.due_day ? dayStr(bill.due_day) : null;
      const daysLeft = dueDate
        ? Math.round((new Date(dueDate + "T00:00:00").getTime() - new Date(todayStr + "T00:00:00").getTime()) / 86400000)
        : null;

      // Auto bills are added by the daily job (or on open in local-only mode), so they aren't "due".
      const isAuto = Boolean(bill.auto_log && canAutoLog(bill));

      let status: BillStatus = "missing";
      if (isLogged) status = "logged";
      else if (isAuto && selectedMonth >= currentMonthStr)
        status = selectedMonth > currentMonthStr || (daysLeft ?? 0) > 0 ? "auto" : "auto-pending";
      else if (selectedMonth > currentMonthStr) status = "upcoming";
      else if (selectedMonth === currentMonthStr) {
        if (daysLeft === null) status = "missing";
        else if (daysLeft < 0) status = "overdue";
        else if (daysLeft <= 3) status = "due-soon";
        else status = "upcoming";
      }

      // What "Log missing bills" would enter: expected amount, else the last payment.
      const last = transactions
        .filter((t) => t.tag_id === tag.id && t.date < `${selectedMonth}-01`)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      const amount = bill.expected_amount ?? last?.amount ?? null;
      const rawDate = dueDate ?? (last ? dayStr(Number(last.date.slice(8, 10))) : null) ?? todayStr;
      return [
        {
          id: bill.id,
          tag_id: tag.id,
          category_id: tag.category_id,
          tag_name: tag.name,
          status,
          daysLeft,
          dueDate,
          amount,
          date: rawDate > todayStr ? todayStr : rawDate,
        },
      ];
    })
    .sort((a, b) => a.tag_name.localeCompare(b.tag_name));

  // Don't offer to log bills into a future month, or ones with no known amount.
  const loggableBills =
    selectedMonth > currentMonthStr
      ? []
      : billRows
          .filter((r) => r.status !== "logged" && r.status !== "auto" && r.status !== "auto-pending" && r.amount !== null)
          .map((r) => ({ ...r, amount: r.amount as number }));

  // 8. Month-end forecast (current month only). Bills still to come use their known amount.
  const forecast = monthForecast(
    monthTransactions,
    selectedMonth,
    todayStr,
    billTagIds,
    billRows.filter((r) => r.status !== "logged" && r.amount !== null).reduce((sum, r) => sum + (r.amount as number), 0)
  );

  // 9. Monthly trend ending at the selected month; average over completed months only.
  const trend = monthlyTotals(transactions, selectedMonth).map((m) => {
    const projectedRest = forecast && m.month === selectedMonth ? Math.max(0, forecast.projected - m.total) : 0;
    return { ...m, projectedRest, projectedTotal: m.total + projectedRest };
  });
  const completed = trend.filter((m) => m.month < currentMonthStr && m.total > 0);
  const trendAverage = completed.length
    ? Math.round((completed.reduce((sum, m) => sum + m.total, 0) / completed.length) * 100) / 100
    : null;

  const handleLogMissingBills = () => {
    loggableBills.forEach((b) =>
      addTransaction({
        amount: b.amount,
        date: b.date,
        category_id: b.category_id,
        tag_id: b.tag_id,
        is_one_off: false,
      })
    );
    showToast({
      tone: "default",
      message: `Logged ${loggableBills.length} bill${loggableBills.length === 1 ? "" : "s"}`,
    });
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
          <ExportMenu />
        </div>
      </div>

      <SpendHero
        monthLabel={monthLabel}
        totalSpend={totalSpend}
        previousSpend={previousSpend}
        transactionCount={monthTransactions.length}
        daily={dailySeries}
        forecast={forecast}
        monthEndLabel={format(new Date(`${selectedMonth}-${String(daysInSelectedMonth).padStart(2, "0")}T00:00:00`), "d MMM")}
      />

      <KpiCards
        totalSpend={totalSpend}
        foodSpend={foodSpend}
        dailyAverage={dailyAverage}
        largestExpense={largestExpense}
        savingsRate={salaryMetrics.savingsRate}
      />

      <InsightsCard insights={monthInsights(transactions, selectedMonth, todayStr)} />

      <SpendingTrend
        data={trend}
        average={trendAverage}
        selectedMonth={selectedMonth}
        onSelectMonth={setSelectedMonth}
      />

      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        <CategoryChart
          data={categoryChartData}
          baselineMonths={categoryBaseline.monthsUsed}
          isMonthToDate={progress < 1}
        />
        <TagsBarChart data={tagChartData} />
        <SalaryEngine
          gross={salaryMetrics.gross}
          epf={salaryMetrics.epf}
          socso={salaryMetrics.socso}
          eis={salaryMetrics.eis}
          netSalary={salaryMetrics.netSalary}
          netCashSaved={salaryMetrics.netCashSaved}
          savingsRate={salaryMetrics.savingsRate}
          profile={profile}
          onSaveProfile={updateProfile}
        />
        <RecurringSentinel
          items={billRows}
          loggableBills={loggableBills}
          onLogMissing={handleLogMissingBills}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        <SpendingCalendar month={selectedMonth} today={todayStr} days={dailySeries} />
        <div className="space-y-4 sm:space-y-5">
          <SpendSplitCard split={spendSplit(monthTransactions, billTagIds)} />
          <YearToDateCard ytd={yearToDate(transactions, selectedMonth, salaryMetrics.netSalary)} />
        </div>
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
