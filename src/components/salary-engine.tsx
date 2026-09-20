import { Wallet, ShieldCheck, ArrowDownRight, Percent } from "lucide-react";
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

export function SalaryEngine({
  gross,
  epf,
  socso,
  eis,
  netSalary,
  netCashSaved,
  savingsRate,
}: SalaryEngineProps) {
  const isPositiveSavings = netCashSaved >= 0;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-base text-foreground">
            Salary & Cash Flow Engine
          </h3>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          MY Statutory Rates
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Gross Salary */}
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="text-xs text-muted-foreground font-medium">GROSS SALARY</div>
          <div className="mt-1 text-lg font-bold">{formatCurrency(gross)}</div>
          <div className="text-[11px] text-muted-foreground">Base income</div>
        </div>

        {/* Deductions Breakdown */}
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="text-xs text-muted-foreground font-medium">DEDUCTIONS</div>
          <div className="mt-1 text-lg font-bold text-red-600">
            -{formatCurrency(epf + socso + eis)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            EPF: {formatCurrency(epf)} | SOCSO: {formatCurrency(socso)} | EIS: {formatCurrency(eis)}
          </div>
        </div>

        {/* Net Salary */}
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="text-xs text-muted-foreground font-medium">NET SALARY</div>
          <div className="mt-1 text-lg font-bold text-foreground">
            {formatCurrency(netSalary)}
          </div>
          <div className="text-[11px] text-muted-foreground">Take-home pay</div>
        </div>

        {/* Net Cash Saved */}
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="text-xs text-muted-foreground font-medium">NET CASH SAVED</div>
          <div
            className={`mt-1 text-lg font-bold ${
              isPositiveSavings ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {formatCurrency(netCashSaved)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Net Salary minus Total Spend
          </div>
        </div>
      </div>

      {/* Savings Rate Progress Gauge */}
      <div className="mt-5 rounded-lg border bg-background p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
            <Percent className="h-4 w-4 text-primary" />
            Monthly Savings Rate
          </span>
          <span
            className={`font-black text-base ${
              savingsRate >= 20
                ? "text-emerald-600"
                : savingsRate > 0
                ? "text-blue-600"
                : "text-red-600"
            }`}
          >
            {savingsRate.toFixed(1)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              savingsRate >= 20
                ? "bg-emerald-500"
                : savingsRate > 0
                ? "bg-blue-500"
                : "bg-red-500"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
          <span>0%</span>
          <span>Target: 20%+</span>
          <span>50%</span>
        </div>
      </div>
    </div>
  );
}
