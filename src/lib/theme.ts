"use client";

import { useEffect, useState } from "react";

export type Theme = "dark" | "light";
const EVENT = "budget-theme-change";

export const currentTheme = (): Theme =>
  typeof document !== "undefined" && document.documentElement.dataset.theme === "light" ? "light" : "dark";

// Applies and remembers the theme (the no-flash script in layout.tsx reads it on load).
export function setTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "light") root.dataset.theme = "light";
  else delete root.dataset.theme;
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // Storage unavailable (private mode); the theme still applies for this session.
  }
  window.dispatchEvent(new Event(EVENT));
}

// Current theme, kept in sync wherever it's changed (top-bar toggle or Settings).
export function useTheme(): Theme {
  const [theme, setThemeState] = useState<Theme>("dark");
  useEffect(() => {
    const sync = () => setThemeState(currentTheme());
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  return theme;
}
