// Guest mode: try the app without an account. A session cookie (cleared when the browser
// closes) lets the middleware through; all data stays in memory, so a refresh wipes it.

export const GUEST_COOKIE = "budget_guest";

export function isGuestSession(): boolean {
  return typeof document !== "undefined" && document.cookie.split("; ").includes(`${GUEST_COOKIE}=1`);
}

export function enterGuest() {
  document.cookie = `${GUEST_COOKIE}=1; path=/; SameSite=Lax`;
  window.location.replace("/");
}

export function exitGuest(to = "/login") {
  document.cookie = `${GUEST_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  window.location.replace(to);
}
