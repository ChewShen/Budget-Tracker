"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface DailySpend {
  day: number;
  amount: number;
}

interface SpendHeroProps {
  monthLabel: string; // e.g. "August"
  totalSpend: number;
  previousSpend: number;
  transactionCount: number;
  daily: DailySpend[];
}

function DailyTooltip({
  active,
  payload,
  monthLabel,
}: {
  active?: boolean;
  payload?: { payload: DailySpend }[];
  monthLabel: string;
}) {
  if (!active || !payload?.length) return null;
  const { day, amount } = payload[0].payload;
  return (
    <div className="rounded-xl border bg-popover px-3 py-2 text-xs shadow-xl">
      <div className="text-muted-foreground">
        {day} {monthLabel}
      </div>
      <div className="mt-0.5 font-semibold tabular-nums text-popover-foreground">
        {formatCurrency(amount)}
      </div>
    </div>
  );
}

export function SpendHero({
  monthLabel,
  totalSpend,
  previousSpend,
  transactionCount,
  daily,
}: SpendHeroProps) {
  const hasComparison = previousSpend > 0;
  const deltaPct = hasComparison ? ((totalSpend - previousSpend) / previousSpend) * 100 : 0;
  const isUp = deltaPct > 0;
  const DeltaIcon = isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <div className="eyebrow">Spent in {monthLabel}</div>
          <div className="mt-1.5 text-4xl font-semibold tracking-tight sm:text-5xl">
            {formatCurrency(totalSpend)}
          </div>
        </div>
        <div className="flex items-center gap-3 pb-1 text-sm">
          {hasComparison && (
            <span
              className={`flex items-center gap-0.5 font-medium ${
                isUp ? "text-danger" : "text-success"
              }`}
            >
              <DeltaIcon className="h-4 w-4" />
              {Math.abs(deltaPct).toFixed(0)}% {isUp ? "more" : "less"}
            </span>
          )}
          <span className="text-muted-foreground">
            {hasComparison ? "than last month · " : ""}
            {transactionCount} transactions
          </span>
        </div>
      </div>

      <div className="mt-6 h-28 w-full sm:h-32" aria-label={`Daily spend in ${monthLabel}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={daily} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barCategoryGap="18%">
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              ticks={[1, 8, 15, 22, daily.length]}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              height={20}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--foreground) / 0.06)", radius: 4 }}
              content={<DailyTooltip monthLabel={monthLabel} />}
            />
            <Bar
              dataKey="amount"
              fill="hsl(var(--primary))"
              radius={[4, 4, 4, 4]}
              minPointSize={2}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
