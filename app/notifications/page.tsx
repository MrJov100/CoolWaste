import Link from "next/link";
import { ArrowLeft, Bell } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { NotificationList } from "@/components/notifications/notification-list";
import { requireProfile } from "@/lib/auth";
import { getAllNotificationsForProfile, countUnreadNotifications } from "@/lib/notifications";
import { markAllNotificationsRead } from "@/lib/actions/notifications";

export default async function NotificationsPage() {
  const profile = await requireProfile();
  const [notifications, unreadCount] = await Promise.all([
    getAllNotificationsForProfile(profile.id),
    countUnreadNotifications(profile.id),
  ]);

  // Mark all as read when landing on this page
  if (unreadCount > 0) {
    await markAllNotificationsRead();
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Topbar
        profile={{
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          saldo: profile.saldo,
          address: profile.address,
        }}
      />

      <main className="mx-auto max-w-2xl px-4 pb-20 pt-8 sm:px-6">
        {/* Header */}
        <section className="mb-8 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-slate-400 transition-all hover:border-white/20 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-400" />
              <h1
                className="text-2xl font-bold text-white"
                style={{ fontFamily: "var(--font-sora), sans-serif" }}
              >
                Semua Notifikasi
              </h1>
            </div>
            <p className="mt-0.5 text-sm text-slate-400">
              {notifications.length} notifikasi tercatat
            </p>
          </div>
        </section>

        <NotificationList notifications={notifications} />
      </main>
    </div>
  );
}
