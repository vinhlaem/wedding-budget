// src/store/notificationStore.ts

import { create } from "zustand";
import type { AppNotification } from "../types/budget";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notification.service";

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  highlightDeadline: string | null; // "YYYY-MM-DD" — set when notification clicked

  fetchAll: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  setHighlightDeadline: (date: string | null) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  highlightDeadline: null,

  fetchAll: async () => {
    set({ loading: true });
    try {
      const { notifications, unreadCount } = await fetchNotifications();
      set({ notifications, unreadCount, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  markRead: async (id) => {
    await markNotificationRead(id);
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n._id === id ? { ...n, isRead: true } : n,
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));
  },

  markAllRead: async () => {
    await markAllNotificationsRead();
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  setHighlightDeadline: (date) => set({ highlightDeadline: date }),
}));
