"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import { useNotificationStore } from "../store/notificationStore";
import type { AppNotification } from "../types/budget";
import { NOTIFY_STAGE_LABELS } from "../types/budget";
import { useForegroundPush } from "../services/push.service";

const STAGE_COLORS: Record<number, { bg: string; text: string }> = {
  1: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
  2: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
  3: { bg: "bg-orange-50 border-orange-200", text: "text-orange-700" },
  4: { bg: "bg-red-50 border-red-200", text: "text-red-700" },
};

function formatDeadline(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface NotifItemProps {
  notif: AppNotification;
  onRead: (id: string) => void;
  onNavigate: (deadline: string) => void;
}

function NotifItem({ notif, onRead, onNavigate }: NotifItemProps) {
  const stageColor = STAGE_COLORS[notif.stage] ?? STAGE_COLORS[1];
  return (
    <div
      className={`relative px-4 py-3 cursor-pointer hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-b-0 ${!notif.isRead ? "bg-blue-50/40" : ""}`}
      onClick={() => {
        if (!notif.isRead) onRead(notif._id);
        onNavigate(notif.deadlineDate);
      }}
    >
      {!notif.isRead && (
        <span className="absolute top-3.5 right-4 w-2 h-2 rounded-full bg-blue-500" />
      )}
      <div className="flex items-start gap-2.5 pr-4">
        <div className="mt-0.5 shrink-0">
          <span
            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${stageColor.bg} ${stageColor.text}`}
          >
            {NOTIFY_STAGE_LABELS[notif.stage]}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-800 font-medium leading-snug">
            {notif.message}
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Hạn: {formatDeadline(notif.deadlineDate)}
          </p>
        </div>
      </div>
    </div>
  );
}

interface NotifPanelProps {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate: (deadline: string) => void;
}

function NotifPanel({
  notifications,
  unreadCount,
  loading,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
}: NotifPanelProps) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
        <span className="text-sm font-bold text-zinc-900">Thông báo</span>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
              title="Đánh dấu tất cả đã đọc"
            >
              <CheckCheck size={12} />
              Đọc tất cả
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X size={14} className="text-zinc-400" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[60dvh] md:max-h-[380px] overflow-y-auto">
        {loading && notifications.length === 0 ? (
          <div className="py-10 text-center text-sm text-zinc-400">
            Đang tải…
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-10 text-center">
            <Check size={28} className="mx-auto text-zinc-300 mb-2" />
            <p className="text-sm text-zinc-400">Không có thông báo nào</p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotifItem
              key={n._id}
              notif={n}
              onRead={onMarkRead}
              onNavigate={onNavigate}
            />
          ))
        )}
      </div>

      {/* Safe area padding for iPhone home indicator */}
      <div
        className="h-safe-bottom md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      />
    </>
  );
}

export default function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    loading,
    fetchAll,
    markRead,
    markAllRead,
    setHighlightDeadline,
    foregroundToast,
    clearForegroundToast,
  } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Wire foreground push listener
  useForegroundPush();

  // Auto-dismiss foreground toast after 4 seconds
  useEffect(() => {
    if (!foregroundToast) return;
    const id = setTimeout(clearForegroundToast, 4_000);
    return () => clearTimeout(id);
  }, [foregroundToast, clearForegroundToast]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch on mount and every 60 seconds
  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 60_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  // Handle URL params from SW click
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const deadline = params.get("deadline");
    const notifId = params.get("notif");
    if (deadline) {
      setHighlightDeadline(deadline);
      if (notifId) markRead(notifId);
      // Clean URL without reload
      window.history.replaceState({}, "", window.location.pathname);
      // Defer setOpen to avoid calling setState synchronously inside an effect
      setTimeout(() => setOpen(true), 0);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNavigate = (deadline: string) => {
    setHighlightDeadline(deadline);
    setOpen(false);
    // Scroll to first matching row
    setTimeout(() => {
      const el = document.querySelector(`[data-deadline="${deadline}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  return (
    <div className="relative" ref={ref}>
      {/* Foreground push toast */}
      {foregroundToast &&
        createPortal(
          <div className="fixed top-4 right-4 z-9999 w-80 max-w-[calc(100vw-2rem)] bg-white border border-zinc-200 rounded-2xl shadow-2xl p-4 flex items-start gap-3 animate-fade-in">
            <Bell size={18} className="text-blue-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-800 leading-snug">
                {foregroundToast.title}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5 leading-snug">
                {foregroundToast.body}
              </p>
            </div>
            <button
              onClick={clearForegroundToast}
              className="shrink-0 text-zinc-400 hover:text-zinc-600 transition-colors"
              aria-label="Đóng thông báo"
            >
              <X size={15} />
            </button>
          </div>,
          document.body,
        )}
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
        aria-label="Thông báo"
      >
        <Bell size={18} className="text-zinc-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Desktop dropdown */}
      {open && (
        <div className="hidden md:block absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-zinc-200/80 z-50 animate-fade-in overflow-hidden">
          <NotifPanel
            notifications={notifications}
            unreadCount={unreadCount}
            loading={loading}
            onClose={() => setOpen(false)}
            onMarkRead={markRead}
            onMarkAllRead={markAllRead}
            onNavigate={handleNavigate}
          />
        </div>
      )}

      {/* Mobile drawer via portal */}
      {open &&
        createPortal(
          <div className="md:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/30 z-50 animate-fade-in"
              onClick={() => setOpen(false)}
            />
            {/* Bottom sheet */}
            <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl animate-slide-up overflow-hidden">
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-zinc-200" />
              </div>
              <NotifPanel
                notifications={notifications}
                unreadCount={unreadCount}
                loading={loading}
                onClose={() => setOpen(false)}
                onMarkRead={markRead}
                onMarkAllRead={markAllRead}
                onNavigate={handleNavigate}
              />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
