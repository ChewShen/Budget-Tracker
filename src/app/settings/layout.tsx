"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBudget } from "@/lib/budget-context";
import { useAccountEmail } from "@/lib/account";
import { SETTINGS_SECTIONS, SettingsNav } from "@/components/settings-nav";

// Phone: /settings is the section list; each section opens on its own page with a back link.
// Desktop: section list as a sidebar, the open section on the right.
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { mode } = useBudget();
  const email = useAccountEmail(mode === "cloud");
  const isRoot = pathname === "/settings";
  const section = SETTINGS_SECTIONS.find((s) => s.href === pathname);

  return (
    <div className="mx-auto max-w-5xl">
      <div className={cn("mb-5", !isRoot && "hidden md:block")}>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Preferences, money setup and account</p>
      </div>

      <div className="md:grid md:grid-cols-[240px_1fr] md:items-start md:gap-6">
        <aside className={cn(!isRoot && "hidden md:block", "md:sticky md:top-20")}>
          <SettingsNav email={email} />
          <p className="mt-3 px-4 text-xs text-muted-foreground md:px-3">
            Budget Tracker v{process.env.NEXT_PUBLIC_APP_VERSION} ·{" "}
            <a
              href="https://github.com/ChewShen/budget-tracker/blob/main/docs/changelog.md"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-border underline-offset-4 transition hover:text-foreground"
            >
              What&apos;s new
            </a>
          </p>
        </aside>

        <div className={cn("min-w-0 space-y-4 sm:space-y-5", isRoot && "hidden md:block")}>
          {section && (
            <div>
              <Link
                href="/settings"
                className="-ml-1 mb-2 inline-flex items-center gap-0.5 text-sm text-muted-foreground transition hover:text-foreground md:hidden"
              >
                <ChevronLeft className="h-4 w-4" /> Settings
              </Link>
              <h2 className="text-xl font-semibold tracking-tight">{section.label}</h2>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
