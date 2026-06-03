// shramdan-web service worker — roadmap 8.3.
// Minimal scope: handle push events, click-through to a URL, and
// stay out of the way of normal navigation. The Next.js runtime
// caches its own assets; this SW only owns the push channel.

self.addEventListener("install", () => {
  // Activate immediately — no transitional cache to wait on.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = { title: "श्रमदान", body: "", url: "/" };
  try {
    if (event.data) {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    }
  } catch {
    // Fall back to a generic notification when the payload is not JSON.
    payload.body = event.data ? event.data.text() : "";
  }
  const { title, body, url, ...rest } = payload;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/branding/favicon/favicon-32x32.png",
      badge: "/branding/favicon/favicon-16x16.png",
      data: { url, ...rest },
      tag: rest.tag || "shramdan-push",
      renotify: Boolean(rest.tag)
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.endsWith(url) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
      return null;
    })
  );
});
