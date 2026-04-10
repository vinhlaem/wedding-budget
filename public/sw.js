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
          payload = { body: event.data.text() };
        }
      }

      const title =
        (payload.title && String(payload.title).trim()) || "Wedding Budget 💍";
      const body =
        (payload.body && String(payload.body).trim()) ||
        "Bạn có thông báo mới.";

      // Check if the app is currently open in a window
      const windowClients = await clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      const openClients = windowClients.filter((c) =>
        c.url.startsWith(self.location.origin),
      );

      if (openClients.length > 0) {
        // App is in foreground — let the page show its own in-app UI
        for (const client of openClients) {
          client.postMessage({
            type: "PUSH_RECEIVED",
            payload: { title, body, data: payload.data || {} },
          });
        }
        return;
      }

      // App is in background — show system notification
      await self.registration.showNotification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: payload.tag || "wedding-budget",
        renotify: true,
        data: payload.data || {},
      });
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
