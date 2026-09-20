"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface CategorySpend {
  name: string;
  value: number;
  color: string;
}

interface CategoryChartProps {
  data: CategorySpend[];
}

export function CategoryChart({ data }: CategoryChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border bg-card text-muted-foreground text-sm">
        No expenses recorded for this month
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <h3 className="font-bold text-base text-foreground mb-1">
        Spend by Category
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Distribution across {data.length} categories
      </p>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => [
                formatCurrency(Number(value || 0)),
                "Spend",
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Category Legend Grid */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {data.slice(0, 6).map((item) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.name}</span>
              </div>
              <span className="font-medium text-muted-foreground shrink-0">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
