"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface TagSpend {
  name: string;
  value: number;
}

interface TagsBarChartProps {
  data: TagSpend[];
}

export function TagsBarChart({ data }: TagsBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border bg-card text-muted-foreground text-sm">
        No tag data recorded for this month
      </div>
    );
  }

  // Top 8 tags sorted descending
  const topTags = [...data].sort((a, b) => b.value - a.value).slice(0, 8);

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <h3 className="font-bold text-base text-foreground mb-1">
        Top Expenses by Tag
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Highest spending areas for the month
      </p>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={topTags}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              width={80}
            />
            <Tooltip
              formatter={(value: any) => [
                formatCurrency(Number(value || 0)),
                "Amount",
              ]}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {topTags.map((_, index) => (
                <Cell
                  key={`tag-bar-${index}`}
                  fill={index === 0 ? "#8b5cf6" : "#3b82f6"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
