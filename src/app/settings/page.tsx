"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SETTINGS_SECTIONS } from "@/components/settings-nav";

// Phone: the layout shows the section list here. Desktop: open the first section in the list
// beside the sidebar.
export default function SettingsIndexPage() {
  const router = useRouter();
  useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) router.replace(SETTINGS_SECTIONS[0].href);
  }, [router]);
  return null;
}
