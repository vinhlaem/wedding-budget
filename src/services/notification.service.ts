// src/services/notification.service.ts

import { notificationApi } from "../api/budgetApi";
import type { AppNotification } from "../types/budget";

export async function fetchNotifications(): Promise<{
  notifications: AppNotification[];
  unreadCount: number;
}> {
  return notificationApi.getAll();
}

export async function markNotificationRead(id: string): Promise<void> {
  await notificationApi.markRead(id);
}

export async function markAllNotificationsRead(): Promise<void> {
  await notificationApi.markAllRead();
}
