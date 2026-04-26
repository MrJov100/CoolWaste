"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { format, isToday, isYesterday, startOfDay } from "date-fns";
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

import { markSingleNotificationRead } from "@/lib/actions/notifications";
import type { NotificationEntry, NotificationType } from "@/lib/notifications";

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

function dateLabel(date: Date): string {
  if (isToday(date)) return "Hari ini";
  if (isYesterday(date)) return "Kemarin";
  return format(date, "EEEE, dd MMMM yyyy", { locale: localeId });
}

function groupByDate(notifications: NotificationEntry[]): Array<{ label: string; items: NotificationEntry[] }> {
  const map = new Map<string, NotificationEntry[]>();

  for (const notif of notifications) {
    const dayKey = startOfDay(new Date(notif.createdAt)).toISOString();
    if (!map.has(dayKey)) map.set(dayKey, []);
    map.get(dayKey)!.push(notif);
  }

  return Array.from(map.entries()).map(([dayKey, items]) => ({
    label: dateLabel(new Date(dayKey)),
    items,
  }));
}

export function NotificationList({ notifications }: { notifications: NotificationEntry[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function handleClick(notif: NotificationEntry) {
    if (!notif.isRead) {
      startTransition(async () => {
        await markSingleNotificationRead(notif.id);
        router.refresh();
      });
    }

    if (notif.type === "PESAN_MASUK" && notif.chatThreadId) {
      window.dispatchEvent(
        new CustomEvent("coolwaste:open-chat", { detail: { threadId: notif.chatThreadId } })
      );
    } else if (notif.type === "LAPORAN_TERKIRIM") {
      // info only
    } else if (notif.pickupRequestId) {
      router.push(`/pickups/${notif.pickupRequestId}`);
    }
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-slate-900/60 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800">
          <Bell className="h-5 w-5 text-slate-600" />
        </div>
        <p className="text-sm font-medium text-slate-400">Belum ada notifikasi</p>
        <p className="text-xs text-slate-600">
          Notifikasi akan muncul saat ada aktivitas pickup.
        </p>
      </div>
    );
  }

  const groups = groupByDate(notifications);

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.label}>
          {/* Separator tanggal */}
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.06]" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              {group.label}
            </span>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>

          {/* Notifikasi dalam tanggal ini */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
            {group.items.map((notif, idx) => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={[
                  "flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.04]",
                  !notif.isRead ? "bg-white/[0.025]" : "",
                  idx < group.items.length - 1 ? "border-b border-white/[0.05]" : "",
                ].join(" ")}
              >
                {/* Ikon */}
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800">
                  {notifIcon(notif.type)}
                </div>

                {/* Konten */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className={`text-sm font-semibold leading-snug ${notif.isRead ? "text-slate-300" : "text-white"}`}>
                      {notif.title}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      {!notif.isRead && (
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                      )}
                      <span className="text-[10px] text-slate-600 whitespace-nowrap">
                        {format(new Date(notif.createdAt), "HH:mm")}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {notif.body}
                  </p>
                  {notif.pickupRequestId && notif.type !== "PESAN_MASUK" && notif.type !== "LAPORAN_TERKIRIM" && (
                    <p className="mt-1.5 text-[10px] font-medium text-amber-500/70">
                      Ketuk untuk melihat detail pickup →
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
