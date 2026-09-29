"use client";

import { useState } from "react";
import { useBudget } from "@/lib/budget-context";
import { calculateSalaryMetrics } from "@/lib/formulas";
import { formatCurrency } from "@/lib/utils";
import { SalaryForm } from "@/components/salary-engine";

export default function SalarySettingsPage() {
  const { profile, updateProfile, showToast } = useBudget();
  const [formKey, setFormKey] = useState(0); // remount to reset the form on Cancel
  const m = calculateSalaryMetrics(profile.default_gross_salary, 0, profile);

  const rows = [
    { label: "Gross salary", value: formatCurrency(m.gross) },
    { label: `EPF (${Math.round(profile.epf_rate * 10000) / 100}%)`, value: `−${formatCurrency(m.epf)}`, muted: true },
    { label: "SOCSO", value: `−${formatCurrency(m.socso)}`, muted: true },
    { label: "EIS", value: `−${formatCurrency(m.eis)}`, muted: true },
    { label: "Take-home", value: formatCurrency(m.netSalary), strong: true },
  ];

  return (
    <>
      <section className="card p-5 sm:p-6">
        <h3 className="text-[15px] font-semibold">Current</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Used for savings rate, cash flow and goals pace</p>
        <ul className="mt-3 divide-y divide-border/70 text-sm">
          {rows.map((r) => (
            <li key={r.label} className="flex justify-between py-2">
              <span className={r.muted ? "text-muted-foreground" : r.strong ? "font-medium" : ""}>{r.label}</span>
              <span className={`tabular-nums ${r.muted ? "text-muted-foreground" : ""} ${r.strong ? "font-semibold" : ""}`}>
                {r.value}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-5 sm:p-6">
        <h3 className="text-[15px] font-semibold">Change</h3>
        <SalaryForm
          key={formKey}
          profile={profile}
          onCancel={() => setFormKey((k) => k + 1)}
          onSave={async (next) => {
            await updateProfile(next);
            showToast({ tone: "default", message: "Salary saved" });
            setFormKey((k) => k + 1);
          }}
        />
      </section>
    </>
  );
}
