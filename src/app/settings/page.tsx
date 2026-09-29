"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Phone: the layout shows the section list here. Desktop: open the first section beside the sidebar.
export default function SettingsIndexPage() {
  const router = useRouter();
  useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) router.replace("/settings/general");
  }, [router]);
  return null;
}
