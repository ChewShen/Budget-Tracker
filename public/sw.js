// Service worker for reminders (Settings > Reminders). Only handles push notifications:
// no caching, so the app always loads fresh from the network.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// Payload from /api/reminders: { title, body, url, tag }.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Budget", {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag, // same tag replaces an older notification instead of stacking
      data: { url: data.url || "/" },
    })
  );
});

// Tapping a notification focuses the open app (navigating it to the reminder's page), or opens it.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url.startsWith(self.location.origin));
      // navigate() only works on windows this worker controls; otherwise open a new one.
      if (open) return open.focus().then(() => open.navigate(url)).catch(() => self.clients.openWindow(url));
      return self.clients.openWindow(url);
    })
  );
});
