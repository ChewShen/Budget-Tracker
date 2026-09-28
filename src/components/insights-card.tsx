import { CalendarCheck, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import type { Insight } from "@/lib/analytics";

// Tone is shown by icon + wording, never colour alone.
function InsightIcon({ insight }: { insight: Insight }) {
  if (insight.tone === "up") return <TrendingUp className="h-4 w-4 text-danger" aria-label="Higher than usual" />;
  if (insight.tone === "down")
    return insight.id === "no-spend" ? (
      <CalendarCheck className="h-4 w-4 text-success" aria-hidden />
    ) : (
      <TrendingDown className="h-4 w-4 text-success" aria-label="Lower than usual" />
    );
  return <Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden />;
}

export function InsightsCard({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;
  return (
    <section className="card p-5 sm:p-6">
      <h3 className="text-[15px] font-semibold">Insights</h3>
      <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {insights.map((insight) => (
          <li key={insight.id} className="flex gap-3 rounded-xl bg-secondary/50 p-4">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background">
              <InsightIcon insight={insight} />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-medium">{insight.title}</div>
              {insight.detail && <div className="mt-0.5 text-xs text-muted-foreground">{insight.detail}</div>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
