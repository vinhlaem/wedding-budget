// src/services/push.service.ts

import { useEffect } from "react";
import { pushApi } from "../api/budgetApi";
import { useNotificationStore } from "../store/notificationStore";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}

/**
 * useForegroundPush
 *
 * React hook — listens for PUSH_RECEIVED messages posted by the service worker
 * when the app is open in the foreground. On receipt it:
 *   1. Refreshes the notification list from the server.
 *   2. Triggers a brief in-app toast via the notification store.
 *
 * Mount this hook once at the top of the app (e.g. NotificationCenter).
 */
export function useForegroundPush(): void {
  const fetchAll = useNotificationStore((s) => s.fetchAll);
  const showForegroundToast = useNotificationStore(
    (s) => s.showForegroundToast,
  );

  useEffect(() => {
    if (!navigator.serviceWorker) return;

    const handler = (event: MessageEvent) => {
      if (event.data?.type !== "PUSH_RECEIVED") return;
      const { title, body } =
        (event.data.payload as { title?: string; body?: string }) ?? {};
      // Refresh badge + panel
      fetchAll();
      // Show in-app toast
      showForegroundToast({
        title: title ?? "Wedding Budget 💍",
        body: body ?? "Bạn có thông báo mới.",
      });
    };

    navigator.serviceWorker.addEventListener("message", handler);
    return () =>
      navigator.serviceWorker.removeEventListener("message", handler);
  }, [fetchAll, showForegroundToast]);
}

export async function requestAndSubscribePush(): Promise<boolean> {
  if (!("Notification" in window) || !("PushManager" in window)) {
    return false;
  }

  // Reject early without prompting if the user has already denied
  if (Notification.permission === "denied") {
    return false;
  }

  // Get service worker registration
  const reg = await navigator.serviceWorker.ready;

  // Fetch VAPID key
  let publicKey: string;
  try {
    publicKey = await pushApi.getVapidKey();
  } catch {
    console.warn("[push] Could not fetch VAPID key");

    return false;
  }

  // Check existing subscription BEFORE asking for permission.
  // If we already have one, silently re-sync it with the server and return.
  // This prevents a double-call (e.g. from StrictMode or on app reopen) from
  // triggering the permission prompt a second time and showing conflicting alerts.
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    await pushApi
      .subscribe(existing.toJSON() as PushSubscriptionJSON)
      .catch(() => null);
    return true;
  }

  // Only call requestPermission() when the state is still "default" (undecided).
  // If already "granted" (e.g. iOS re-check), skip the prompt entirely.
  const permission =
    Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();

  if (permission !== "granted") {
    return false;
  }

  // Subscribe
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  await pushApi.subscribe(subscription.toJSON() as PushSubscriptionJSON);

  return true;
}
