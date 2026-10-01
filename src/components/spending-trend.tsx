"use client";

import { format, parseISO } from "date-fns";
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface TrendPoint {
  month: string; // YYYY-MM
  total: number;
  projectedRest: number; // forecast still to come (current month only)
  projectedTotal: number; // total + projectedRest; drawn faded behind the actual bar
}

interface SpendingTrendProps {
  data: TrendPoint[];
  average: number | null; // average of completed months shown; null when there are none
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
}

const monthLabel = (month: string, pattern: string) => format(parseISO(`${month}-01`), pattern);

function TrendTooltip({ active, payload }: { active?: boolean; payload?: { payload: TrendPoint }[] }) {
  if (!active || !payload?.length) return null;
  const { month, total, projectedRest } = payload[0].payload;
  return (
    <div className="rounded-xl border bg-popover px-3 py-2 text-xs shadow-xl">
      <div className="text-muted-foreground">{monthLabel(month, "MMMM yyyy")}</div>
      <div className="mt-0.5 font-semibold tabular-nums text-popover-foreground">{formatCurrency(total)}</div>
      {projectedRest > 0 && (
        <div className="text-muted-foreground">On pace for {formatCurrency(total + projectedRest)}</div>
      )}
    </div>
  );
}

export function SpendingTrend({ data, average, selectedMonth, onSelectMonth }: SpendingTrendProps) {
  const select = (point: { month?: string }) => point.month && onSelectMonth(point.month);

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-[15px] font-semibold">Monthly spending</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {data.length < 2 ? "Builds up as you log more months" : `${data.length} months · tap a bar to open it`}
          </p>
        </div>
        {average !== null && (
          <div className="text-right">
            <div className="eyebrow">Average</div>
            <div className="text-sm font-semibold tabular-nums">{formatCurrency(average)}</div>
          </div>
        )}
      </div>

      <div className="mt-5 h-44 w-full" aria-label="Spending by month">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barCategoryGap="24%">
            <XAxis
              dataKey="month"
              tickFormatter={(m: string) => monthLabel(m, "MMM")}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              height={20}
            />
            <Tooltip cursor={{ fill: "hsl(var(--foreground) / 0.06)", radius: 4 }} content={<TrendTooltip />} />
            {average !== null && (
              <ReferenceLine y={average} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeWidth={1} />
            )}
            {/* Forecast (full height, faded) behind; actual spend drawn over it on a second, hidden axis. */}
            <XAxis xAxisId="overlay" dataKey="month" hide />
            <Bar
              dataKey="projectedTotal"
              maxBarSize={56}
              radius={[4, 4, 4, 4]}
              isAnimationActive={false}
              className="cursor-pointer"
              onClick={select}
              fill="hsl(var(--primary) / 0.22)"
            />
            <Bar
              dataKey="total"
              xAxisId="overlay"
              maxBarSize={56}
              radius={[4, 4, 4, 4]}
              isAnimationActive={false}
              className="cursor-pointer"
              onClick={select}
            >
              {data.map((d) => (
                <Cell
                  key={d.month}
                  fill={d.month === selectedMonth ? "hsl(var(--primary))" : "hsl(var(--chart-bar))"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {data.some((d) => d.projectedRest > 0) && (
        <p className="mt-2 text-xs text-muted-foreground">Faded part: forecast for the rest of this month.</p>
      )}
    </section>
  );
}
