import { DollarSign, Utensils, TrendingUp, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface KpiCardsProps {
  totalSpend: number;
  foodSpend: number;
  dailyAverage: number;
  largestExpense: {
    amount: number;
    tag_name: string;
    category_name: string;
  } | null;
  transactionCount: number;
}

export function KpiCards({
  totalSpend,
  foodSpend,
  dailyAverage,
  largestExpense,
  transactionCount,
}: KpiCardsProps) {
  const foodPercentage = totalSpend > 0 ? Math.round((foodSpend / totalSpend) * 100) : 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {/* 1. Total Spend */}
      <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-sm transition hover:shadow-md">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs sm:text-sm font-medium uppercase tracking-wider">
            Total Spend
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
            <DollarSign className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            {formatCurrency(totalSpend)}
          </div>
          <div className="mt-1 flex items-center text-xs text-muted-foreground">
            <span>{transactionCount} transactions logged</span>
          </div>
        </div>
      </div>

      {/* 2. Food & Dining */}
      <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-sm transition hover:shadow-md">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs sm:text-sm font-medium uppercase tracking-wider">
            Food & Dining
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600">
            <Utensils className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            {formatCurrency(foodSpend)}
          </div>
          <div className="mt-1 flex items-center text-xs text-orange-600 font-medium">
            <span>{foodPercentage}% of total spend</span>
          </div>
        </div>
      </div>

      {/* 3. Daily Average */}
      <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-sm transition hover:shadow-md">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs sm:text-sm font-medium uppercase tracking-wider">
            Daily Average
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            {formatCurrency(dailyAverage)}
            <span className="text-xs font-normal text-muted-foreground">/day</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Excludes one-off expenses
          </div>
        </div>
      </div>

      {/* 4. Largest Expense */}
      <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-sm transition hover:shadow-md">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs sm:text-sm font-medium uppercase tracking-wider">
            Peak Expense
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
            <AlertCircle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            {largestExpense ? formatCurrency(largestExpense.amount) : "RM 0.00"}
          </div>
          <div className="mt-1 flex items-center gap-1.5 overflow-hidden">
            {largestExpense ? (
              <span className="inline-block truncate rounded-full bg-purple-100 dark:bg-purple-950 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
                {largestExpense.tag_name}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">None</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
