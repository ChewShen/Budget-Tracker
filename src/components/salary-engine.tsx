"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { UserSalaryProfile } from "@/lib/types";

interface SalaryEngineProps {
  gross: number;
  epf: number;
  socso: number;
  eis: number;
  netSalary: number;
  netCashSaved: number;
  savingsRate: number;
  profile: UserSalaryProfile;
  onSaveProfile: (profile: UserSalaryProfile) => Promise<void>;
}

function SalaryForm({
  profile,
  onSave,
  onCancel,
}: {
  profile: UserSalaryProfile;
  onSave: (profile: UserSalaryProfile) => void;
  onCancel: () => void;
}) {
  const [gross, setGross] = useState(String(profile.default_gross_salary));
  const [epfPct, setEpfPct] = useState(String(Math.round(profile.epf_rate * 10000) / 100));
  const [socso, setSocso] = useState(String(profile.socso_rate));
  const [eis, setEis] = useState(String(profile.eis_rate));

  const fields = [
    { label: "Gross salary (RM)", value: gross, set: setGross },
    { label: "EPF (%)", value: epfPct, set: setEpfPct },
    { label: "SOCSO (RM)", value: socso, set: setSocso },
    { label: "EIS (RM)", value: eis, set: setEis },
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      default_gross_salary: Math.max(0, Number(gross) || 0),
      epf_rate: Math.max(0, Number(epfPct) || 0) / 100,
      socso_rate: Math.max(0, Number(socso) || 0),
      eis_rate: Math.max(0, Number(eis) || 0),
    });
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {fields.map((f) => (
          <label key={f.label} className="block">
            <span className="text-xs text-muted-foreground">{f.label}</span>
            <input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              required
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              className="field mt-1 tabular-nums"
            />
          </label>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        SOCSO and EIS depend on your salary bracket. Copy them from your payslip.
      </p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-95"
        >
          Save
        </button>
      </div>
    </form>
  );
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
  profile,
  onSaveProfile,
}: SalaryEngineProps) {
  const [isEditing, setIsEditing] = useState(false);
  const totalSpend = netSalary - netCashSaved;
  const isPositiveSavings = netCashSaved >= 0;
  const TARGET = 20;

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold">Cash flow</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Salary after EPF, SOCSO and EIS</p>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="-ml-2 mt-1 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <Pencil className="h-3 w-3" /> Edit salary
            </button>
          )}
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

      {isEditing ? (
        <SalaryForm
          profile={profile}
          onCancel={() => setIsEditing(false)}
          onSave={(next) => {
            setIsEditing(false);
            onSaveProfile(next);
          }}
        />
      ) : (
        <>
          <div className="mt-4 divide-y divide-border/70">
            <Line label="Gross salary" value={formatCurrency(gross)} />
            <div>
              <Line
            label={`EPF (${Math.round(profile.epf_rate * 10000) / 100}%)`}
            value={`−${formatCurrency(epf)}`}
            tone="muted"
          />
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
        </>
      )}
    </section>
  );
}
