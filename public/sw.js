// public/sw.js — Wedding Budget Service Worker

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      let payload = {};

      if (event.data) {
        try {
          payload = event.data.json();
        } catch {
          // If JSON parse fails, treat raw text as the body
          payload = { body: event.data.text() };
        }
      }

      const title =
        (payload.title && String(payload.title).trim()) || "Wedding Budget 💍";
      const options = {
        body:
          (payload.body && String(payload.body).trim()) ||
          "Bạn có thông báo mới.",
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: payload.tag || "wedding-budget",
        renotify: true,
        // requireInteraction omitted — not supported on iOS and causes
        // push registration to fail on some WebKit versions.
        data: payload.data || {},
      };

      await self.registration.showNotification(title, options);
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const deadlineDate = data.deadlineDate || "";
  const notificationId = data.notificationId || "";

  const urlToOpen = new URL("/", self.location.origin);
  if (deadlineDate) urlToOpen.searchParams.set("deadline", deadlineDate);
  if (notificationId) urlToOpen.searchParams.set("notif", notificationId);

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Focus existing tab if open
        for (const client of windowClients) {
          if (client.url.startsWith(urlToOpen.origin) && "focus" in client) {
            client.navigate(urlToOpen.toString());
            return client.focus();
          }
        }
        // Otherwise open a new tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen.toString());
        }
      }),
  );
});
