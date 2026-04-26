"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ArrowRight,
  Bell,
  CheckCheck,
  Clock,
  Flag,
  MessageCircle,
  Truck,
  X,
} from "lucide-react";

import { markAllNotificationsRead, markSingleNotificationRead } from "@/lib/actions/notifications";
import type { NotificationEntry, NotificationType } from "@/lib/notifications";

const POLL_INTERVAL_MS = 15_000;

function notifIcon(type: NotificationType) {
  switch (type) {
    case "PICKUP_MENUNGGU_MATCHING":
      return <Clock className="h-3.5 w-3.5 text-amber-400" />;
    case "PICKUP_MATCHED":
      return <Truck className="h-3.5 w-3.5 text-emerald-400" />;
    case "PICKUP_SELESAI":
      return <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />;
    case "PICKUP_DIBATALKAN":
      return <X className="h-3.5 w-3.5 text-red-400" />;
    case "PICKUP_DALAM_PERJALANAN":
      return <Truck className="h-3.5 w-3.5 text-blue-400" />;
    case "LAPORAN_TERKIRIM":
      return <Flag className="h-3.5 w-3.5 text-amber-400" />;
    case "PESAN_MASUK":
      return <MessageCircle className="h-3.5 w-3.5 text-sky-400" />;
  }
}

export function NotificationButton({
  notifications,
  unreadCount,
}: {
  notifications: NotificationEntry[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  void isPending;

  // Poll for new notifications every 15 s
  useEffect(() => {
    const id = setInterval(() => {
      startTransition(() => {
        router.refresh();
      });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [router]);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function handleToggle() {
    const opening = !open;
    setOpen(opening);

    if (opening && unreadCount > 0) {
      startTransition(async () => {
        await markAllNotificationsRead();
        router.refresh();
      });
    }
  }

  function handleNotifClick(notif: NotificationEntry) {
    setOpen(false);

    if (!notif.isRead) {
      startTransition(async () => {
        await markSingleNotificationRead(notif.id);
      });
    }

    if (notif.type === "PESAN_MASUK" && notif.chatThreadId) {
      window.dispatchEvent(
        new CustomEvent("coolwaste:open-chat", { detail: { threadId: notif.chatThreadId } })
      );
    } else if (notif.type === "LAPORAN_TERKIRIM") {
      // info only — no navigation
    } else if (notif.pickupRequestId) {
      router.push(`/pickups/${notif.pickupRequestId}`);
    }
  }

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Bell button */}
      <button
        onClick={handleToggle}
        aria-label="Notifikasi"
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
          open
            ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
            : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/20 hover:text-white"
        }`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && !open && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-slate-950 bg-red-500 px-0.5 text-[9px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 flex w-80 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl shadow-black/60 backdrop-blur-xl">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/15">
                  <Bell className="h-3 w-3 text-amber-400" />
                </div>
                <p className="text-xs font-semibold text-white">Notifikasi</p>
                {unreadCount > 0 && (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-500 hover:bg-white/5 hover:text-slate-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* List — maks 5 item */}
            <div className="py-1">
              {notifications.length > 0 ? (
                notifications.slice(0, 5).map((notif) => (
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
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-slate-500">
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
                  <p className="text-xs font-medium text-slate-400">Belum ada notifikasi</p>
                  <p className="text-[10px] text-slate-600">
                    Notifikasi muncul saat ada aktivitas pickup.
                  </p>
                </div>
              )}
            </div>

            {/* Footer — Lihat lainnya */}
            {notifications.length > 0 && (
              <div className="border-t border-white/[0.07] p-2">
                <Link
                  href="/notifications"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-medium text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-white"
                >
                  Lihat semua notifikasi
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
