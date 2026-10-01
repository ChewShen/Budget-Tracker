"use client";

import { useEffect, useState } from "react";
import { Check, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { DefaultDateMode, getDefaultDateMode, setDefaultDateMode } from "@/lib/preferences";
import { setTheme, useTheme, type Theme } from "@/lib/theme";

const DATE_OPTIONS: { value: DefaultDateMode; label: string; description: string }[] = [
  { value: "today", label: "Today", description: "Every new expense starts on today's date." },
  {
    value: "last",
    label: "Same as last entry",
    description:
      "Keep the date you used last time, and move to the next day once that day has a dinner or supper entry. Handy when catching up on past days in order.",
  },
];

const THEMES: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
];

function RadioCard({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition",
        active ? "border-foreground/70 bg-secondary/50" : "hover:bg-secondary/40"
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
          active ? "border-transparent bg-primary text-primary-foreground" : "border-input"
        )}
      >
        {active && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <span className="min-w-0">{children}</span>
    </button>
  );
}

export default function GeneralSettingsPage() {
  const [dateMode, setDateMode] = useState<DefaultDateMode>("today");
  const theme = useTheme();

  useEffect(() => setDateMode(getDefaultDateMode()), []);

  return (
    <>
      <section className="card p-5 sm:p-6">
        <h3 className="text-[15px] font-semibold">Adding expenses</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Default date when you open Add expense · saved on this device
        </p>
        <div role="radiogroup" aria-label="Default date" className="mt-4 space-y-2">
          {DATE_OPTIONS.map((opt) => (
            <RadioCard
              key={opt.value}
              active={dateMode === opt.value}
              onClick={() => {
                setDateMode(opt.value);
                setDefaultDateMode(opt.value);
              }}
            >
              <span className="block text-sm font-medium">{opt.label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{opt.description}</span>
            </RadioCard>
          ))}
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h3 className="text-[15px] font-semibold">Appearance</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Also switchable from the sun/moon button in the top bar</p>
        <div role="radiogroup" aria-label="Theme" className="mt-4 grid grid-cols-2 gap-2">
          {THEMES.map(({ value, label, icon: Icon }) => (
            <RadioCard key={value} active={theme === value} onClick={() => setTheme(value)}>
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Icon className="h-4 w-4" /> {label}
              </span>
            </RadioCard>
          ))}
        </div>
      </section>
    </>
  );
}
