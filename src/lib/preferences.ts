// Per-device preferences kept in localStorage. Reads fall back to defaults when
// storage is unavailable (private mode, blocked site data).

export type DefaultDateMode = "today" | "last";

const KEYS = {
  DEFAULT_DATE: "pref_default_date",
  LAST_ENTRY_DATE: "last_entry_date",
};

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable; the preference just won't persist.
  }
}

export function getDefaultDateMode(): DefaultDateMode {
  return read(KEYS.DEFAULT_DATE) === "last" ? "last" : "today";
}

export function setDefaultDateMode(mode: DefaultDateMode) {
  write(KEYS.DEFAULT_DATE, mode);
}

export function getLastEntryDate(): string | null {
  const value = read(KEYS.LAST_ENTRY_DATE);
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export function setLastEntryDate(date: string) {
  write(KEYS.LAST_ENTRY_DATE, date);
}
