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
  savingsRate: number;
}

function Stat({
  label,
  value,
  suffix,
  note,
}: {
  label: string;
  value: string;
  suffix?: string;
  note: React.ReactNode;
}) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="eyebrow">{label}</div>
      <div className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
        {value}
        {suffix && <span className="ml-0.5 text-sm font-normal text-muted-foreground">{suffix}</span>}
      </div>
      <div className="mt-1 truncate text-xs text-muted-foreground">{note}</div>
    </div>
  );
}

export function KpiCards({
  totalSpend,
  foodSpend,
  dailyAverage,
  largestExpense,
  savingsRate,
}: KpiCardsProps) {
  const foodPercentage = totalSpend > 0 ? Math.round((foodSpend / totalSpend) * 100) : 0;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat
        label="Food & dining"
        value={formatCurrency(foodSpend)}
        note={`${foodPercentage}% of spend`}
      />
      <Stat
        label="Daily average"
        value={formatCurrency(dailyAverage)}
        suffix="/day"
        note="Excludes one-offs"
      />
      <Stat
        label="Biggest expense"
        value={largestExpense ? formatCurrency(largestExpense.amount) : "—"}
        note={largestExpense ? largestExpense.tag_name : "Nothing logged yet"}
      />
      <Stat
        label="Savings rate"
        value={`${savingsRate.toFixed(1)}%`}
        note={
          <span className={savingsRate >= 20 ? "text-success" : savingsRate < 0 ? "text-danger" : undefined}>
            {savingsRate >= 20 ? "On target (20%+)" : savingsRate < 0 ? "Overspent" : "Target 20%+"}
          </span>
        }
      />
    </div>
  );
}
