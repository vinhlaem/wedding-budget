// src/services/push.service.ts

import { pushApi } from "../api/budgetApi";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}

export async function requestAndSubscribePush(): Promise<boolean> {
  if (!("Notification" in window) || !("PushManager" in window)) return false;

  // Ask permission
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

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

  // Check existing subscription
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    // Re-save it in case the server lost it
    await pushApi
      .subscribe(existing.toJSON() as PushSubscriptionJSON)
      .catch(() => null);
    return true;
  }

  // Subscribe
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  await pushApi.subscribe(subscription.toJSON() as PushSubscriptionJSON);
  return true;
}
