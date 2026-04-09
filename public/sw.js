// public/sw.js — Wedding Budget Service Worker

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Wedding Budget 💍", body: event.data.text() };
  }

  const title = payload.title || "Wedding Budget 💍";
  const options = {
    body: payload.body || "",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: payload.tag || "wedding-budget",
    renotify: true,
    requireInteraction: false,
    data: payload.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
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
