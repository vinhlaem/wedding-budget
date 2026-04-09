// src/services/serviceWorker.ts

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    console.log("[SW] registered, scope:", reg.scope);
    return reg;
  } catch (err) {
    console.error("[SW] registration failed:", err);
    return null;
  }
}
