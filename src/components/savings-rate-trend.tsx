"use client";

import { format, parseISO } from "date-fns";
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface RatePoint {
  month: string; // YYYY-MM
  rate: number; // %
  saved: number;
  inProgress: boolean; // current month, so far
}

interface SavingsRateTrendProps {
  data: RatePoint[];
  target: number; // %
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
}

const label = (m: string, pattern: string) => format(parseISO(`${m}-01`), pattern);
// Proper minus sign, matching the rest of the app.
const pct = (n: number) => `${n < 0 ? "−" : ""}${Math.abs(n).toFixed(1)}%`;

function RateTooltip({ active, payload, target }: { active?: boolean; payload?: { payload: RatePoint }[]; target: number }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl border bg-popover px-3 py-2 text-xs shadow-xl">
      <div className="text-muted-foreground">
        {label(p.month, "MMMM yyyy")}
        {p.inProgress ? " (so far)" : ""}
      </div>
      <div className="mt-0.5 font-semibold tabular-nums text-popover-foreground">{pct(p.rate)}</div>
      <div className="text-muted-foreground">
        {p.saved >= 0 ? `Saved ${formatCurrency(p.saved)}` : `Overspent ${formatCurrency(-p.saved)}`} ·{" "}
        {p.rate >= target ? "on target" : "below target"}
      </div>
    </div>
  );
}

export function SavingsRateTrend({ data, target, selectedMonth, onSelectMonth }: SavingsRateTrendProps) {
  const completed = data.filter((d) => !d.inProgress);
  const average = completed.length ? completed.reduce((sum, d) => sum + d.rate, 0) / completed.length : null;
  const onTarget = completed.filter((d) => d.rate >= target).length;
  const min = Math.min(0, ...data.map((d) => d.rate));
  const max = Math.max(target, ...data.map((d) => d.rate));

  const fillFor = (d: RatePoint) =>
    d.rate < 0 ? "hsl(var(--danger))" : d.rate >= target ? "hsl(var(--primary))" : "hsl(var(--chart-bar))";

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-[15px] font-semibold">Savings rate by month</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Take-home minus spending · uses your current salary · tap a bar to open it
          </p>
        </div>
        {average !== null && (
          <div className="text-right">
            <div className="eyebrow">Average</div>
            <div className="text-sm font-semibold tabular-nums">{pct(average)}</div>
            <div className="text-[11px] text-muted-foreground">
              {onTarget} of {completed.length} month{completed.length === 1 ? "" : "s"} on target
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 h-44 w-full" aria-label="Savings rate by month">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }} barCategoryGap="24%">
            <XAxis
              dataKey="month"
              tickFormatter={(m: string) => label(m, "MMM")}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              height={20}
            />
            <YAxis hide domain={[min, max * 1.1]} />
            <Tooltip cursor={{ fill: "hsl(var(--foreground) / 0.06)", radius: 4 }} content={<RateTooltip target={target} />} />
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
            <ReferenceLine
              y={target}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="4 4"
              label={{ value: `Target ${target}%`, position: "insideTopRight", fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <Bar
              dataKey="rate"
              maxBarSize={56}
              radius={[4, 4, 4, 4]}
              isAnimationActive={false}
              className="cursor-pointer"
              onClick={(p: { month?: string }) => p.month && onSelectMonth(p.month)}
            >
              {data.map((d) => (
                <Cell
                  key={d.month}
                  fill={fillFor(d)}
                  fillOpacity={d.inProgress ? 0.45 : 1}
                  stroke={d.month === selectedMonth ? "hsl(var(--foreground))" : "none"}
                  strokeWidth={d.month === selectedMonth ? 1.5 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-hidden>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary" /> On target</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: "hsl(var(--chart-bar))" }} /> Below target</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-danger" /> Overspent</span>
        {data.some((d) => d.inProgress) && <span>Faded: this month so far</span>}
      </div>
    </section>
  );
}
