import Link from "next/link";
import { Leaf } from "lucide-react";

import { AdminLogoutButton } from "@/components/layout/admin-logout-button";
import { AdminNotificationButton } from "@/components/notifications/admin-notification-button";
import { getOpenReportsCount, getRecentReportsForNotification } from "@/lib/data/admin";
import type { SmartWasteProfile } from "@/lib/types";

export async function AdminTopbar({
  profile,
}: {
  profile?: SmartWasteProfile | null;
}) {
  const [openCount, reports] = await Promise.all([
    getOpenReportsCount(),
    getRecentReportsForNotification(),
  ]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-slate-950/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">

        {/* Logo */}
        <Link href="/dashboard/admin" className="flex items-center gap-2.5 text-white">
          <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-400">
            <Leaf className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-none">
            <span
              className="text-base font-bold tracking-tight text-white"
              style={{ fontFamily: "var(--font-sora), sans-serif" }}
            >
              CoolWaste
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
              Admin Panel
            </span>
          </div>
        </Link>

        {/* Right: notification bell + user info + logout */}
        <div className="flex items-center gap-3">
          <AdminNotificationButton reports={reports} openCount={openCount} />

          {profile && (
            <div className="hidden flex-col items-end leading-none lg:flex">
              <span className="text-sm font-semibold text-white">{profile.name}</span>
              <span className="text-xs text-emerald-400">Administrator</span>
            </div>
          )}
          <AdminLogoutButton />
        </div>
      </div>
    </header>
  );
}
