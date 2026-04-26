"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Bell,
  CheckCheck,
  Clock,
  Flag,
  MessageCircle,
  Package,
  Truck,
  X,
} from "lucide-react";

import { markAllNotificationsRead, markSingleNotificationRead } from "@/lib/actions/notifications";
import type { NotificationType } from "@/lib/notifications";

const POLL_INTERVAL_MS = 15_000;

type NotificationEntry = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  pickupRequestId: string | null;
  chatThreadId: string | null;
  createdAt: Date;
};

function notifIcon(type: NotificationType) {
  switch (type) {
    case "PICKUP_MENUNGGU_MATCHING": return <Clock className="h-4 w-4 text-amber-400" />;
    case "PICKUP_MATCHED":           return <Truck className="h-4 w-4 text-emerald-400" />;
    case "PICKUP_SELESAI":           return <CheckCheck className="h-4 w-4 text-emerald-400" />;
    case "PICKUP_DIBATALKAN":        return <X className="h-4 w-4 text-red-400" />;
    case "PICKUP_DALAM_PERJALANAN":  return <Truck className="h-4 w-4 text-blue-400" />;
    case "LAPORAN_TERKIRIM":         return <Flag className="h-4 w-4 text-amber-400" />;
    case "PESAN_MASUK":              return <MessageCircle className="h-4 w-4 text-sky-400" />;
    default:                         return <Package className="h-4 w-4 text-slate-400" />;
  }
}

export function FloatingNotificationWidget({
  notifications,
  unreadCount,
  profileId: _profileId,
}: {
  notifications: NotificationEntry[];
  unreadCount: number;
  profileId: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [localUnread, setLocalUnread] = useState(unreadCount);
  const prevUnreadRef = useRef(unreadCount);
  const pulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pulse, setPulse] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Portal guard — avoids SSR mismatch (deferred via setTimeout to satisfy linter)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  // Sync unread count from server and trigger pulse on new notifications
  useEffect(() => {
    const hadNewNotifs = unreadCount > prevUnreadRef.current;
    prevUnreadRef.current = unreadCount;

    const t1 = setTimeout(() => setLocalUnread(unreadCount), 0);

    if (hadNewNotifs) {
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
      const t2 = setTimeout(() => {
        setPulse(true);
        pulseTimeoutRef.current = setTimeout(() => setPulse(false), 1500);
      }, 0);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
      };
    }

    return () => clearTimeout(t1);
  }, [unreadCount]);

  // Poll server for new notifications
  useEffect(() => {
    const id = setInterval(() => {
      startTransition(() => {
        router.refresh();
      });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [router]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const btn = document.getElementById("notif-toggle-btn");
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        btn &&
        !btn.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleOpen() {
    const opening = !open;
    setOpen(opening);
    if (opening && localUnread > 0) {
      setLocalUnread(0);
      await markAllNotificationsRead();
      router.refresh();
    }
  }

  async function handleNotifClick(notif: NotificationEntry) {
    if (!notif.isRead) {
      await markSingleNotificationRead(notif.id);
    }
    setOpen(false);

    if (notif.type === "PESAN_MASUK" && notif.chatThreadId) {
      window.dispatchEvent(
        new CustomEvent("coolwaste:open-chat", { detail: { threadId: notif.chatThreadId } })
      );
    } else if (notif.type === "LAPORAN_TERKIRIM") {
      // No navigation — just info
    } else if (notif.pickupRequestId) {
      router.push(`/pickups/${notif.pickupRequestId}`);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          className="fixed bottom-[5.5rem] right-24 z-[9998] flex w-80 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/60 sm:right-28"
          style={{ maxHeight: 480 }}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/15">
                <Bell className="h-3 w-3 text-amber-400" />
              </div>
              <p className="text-xs font-semibold text-white">Notifikasi</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-500 hover:bg-white/5 hover:text-slate-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto py-1.5">
            {notifications.length ? (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.04] ${
                    !notif.isRead ? "bg-white/[0.025]" : ""
                  }`}
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-800">
                    {notifIcon(notif.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-[11px] font-semibold leading-tight ${notif.isRead ? "text-slate-300" : "text-white"}`}>
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      )}
                    </div>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500 line-clamp-2">
                      {notif.body}
                    </p>
                    <p className="mt-1 text-[9px] text-slate-600">
                      {format(new Date(notif.createdAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800">
                  <Bell className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Belum ada notifikasi</p>
                  <p className="mt-0.5 text-[10px] text-slate-600">
                    Notifikasi akan muncul saat ada aktivitas pickup.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating button */}
      <div className="fixed bottom-5 right-24 z-[9998] sm:bottom-6 sm:right-28">
        <button
          id="notif-toggle-btn"
          onClick={handleOpen}
          aria-label={open ? "Tutup notifikasi" : "Buka notifikasi"}
          className={`relative flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-200 ${
            open
              ? "bg-slate-700 shadow-black/40 hover:bg-slate-600"
              : "bg-amber-500 shadow-amber-950/40 hover:bg-amber-400"
          } ${pulse ? "animate-bounce" : ""}`}
        >
          {localUnread > 0 && !open && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-slate-950 bg-red-500 px-1 text-[10px] font-bold text-white">
              {localUnread > 99 ? "99+" : localUnread}
            </span>
          )}
          {open ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <Bell className="h-6 w-6 text-amber-950" />
          )}
        </button>
      </div>
    </>,
    document.body,
  );
}
