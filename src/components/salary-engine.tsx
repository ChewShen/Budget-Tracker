import { formatCurrency } from "@/lib/utils";

interface SalaryEngineProps {
  gross: number;
  epf: number;
  socso: number;
  eis: number;
  netSalary: number;
  netCashSaved: number;
  savingsRate: number;
  onGrossChange?: (newGross: number) => void;
}

function Line({
  label,
  value,
  tone = "default",
  strong = false,
}: {
  label: string;
  value: string;
  tone?: "default" | "muted";
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className={tone === "muted" ? "text-muted-foreground" : strong ? "font-medium" : ""}>
        {label}
      </span>
      <span
        className={`tabular-nums ${tone === "muted" ? "text-muted-foreground" : ""} ${
          strong ? "font-semibold" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function SalaryEngine({
  gross,
  epf,
  socso,
  eis,
  netSalary,
  netCashSaved,
  savingsRate,
}: SalaryEngineProps) {
  const totalSpend = netSalary - netCashSaved;
  const isPositiveSavings = netCashSaved >= 0;
  const TARGET = 20;

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold">Cash flow</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Salary after EPF, SOCSO and EIS</p>
        </div>
        <div className="text-right">
          <div className="eyebrow">Saved</div>
          <div
            className={`text-xl font-semibold tracking-tight ${
              isPositiveSavings ? "text-success" : "text-danger"
            }`}
          >
            {formatCurrency(netCashSaved)}
          </div>
        </div>
      </div>

      <div className="mt-4 divide-y divide-border/70">
        <Line label="Gross salary" value={formatCurrency(gross)} />
        <div>
          <Line label="EPF (11%)" value={`−${formatCurrency(epf)}`} tone="muted" />
          <Line label="SOCSO" value={`−${formatCurrency(socso)}`} tone="muted" />
          <Line label="EIS" value={`−${formatCurrency(eis)}`} tone="muted" />
        </div>
        <Line label="Take-home" value={formatCurrency(netSalary)} strong />
        <Line label="Spent this month" value={`−${formatCurrency(totalSpend)}`} tone="muted" />
      </div>

      {/* Savings rate with target marker */}
      <div className="mt-4 rounded-xl bg-secondary/60 p-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-muted-foreground">Savings rate</span>
          <span className="font-semibold tabular-nums">{savingsRate.toFixed(1)}%</span>
        </div>
        <div className="relative mt-3 h-2 w-full rounded-full bg-background">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              savingsRate >= 0 ? "bg-primary" : "bg-danger"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, (savingsRate / 50) * 100))}%` }}
          />
          <div
            className="absolute -top-1 h-4 w-0.5 rounded-full bg-foreground/60"
            style={{ left: `${(TARGET / 50) * 100}%` }}
            aria-hidden
          />
        </div>
        <div className="relative mt-1.5 h-4 text-[11px] text-muted-foreground">
          <span className="absolute left-0">0%</span>
          <span className="absolute -translate-x-1/2" style={{ left: `${(TARGET / 50) * 100}%` }}>
            Target {TARGET}%
          </span>
          <span className="absolute right-0">50%</span>
        </div>
      </div>
    </section>
  );
}
