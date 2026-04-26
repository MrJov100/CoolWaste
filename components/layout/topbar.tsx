import Link from "next/link";
import { LayoutDashboard, Leaf } from "lucide-react";

import { FloatingChatWidget } from "@/components/chat/floating-chat-widget";
import { NotificationButton } from "@/components/notifications/notification-button";
import { DevAccountSwitcher } from "@/components/layout/dev-account-switcher";
import { DemoSwitcher } from "@/components/layout/demo-switcher";
import { MobileNav, NavUserDropdown } from "@/components/layout/nav-dropdown";
import { Button } from "@/components/ui/button";
import { ROLE_LABEL } from "@/lib/constants";
import { countUnreadChatsForProfile, getChatThreadsForProfile } from "@/lib/data/chat";
import { isDevAccountSwitcherEnabled } from "@/lib/dev-accounts";
import { getNotificationsForProfile, countUnreadNotifications } from "@/lib/notifications";
import type { NotificationEntry } from "@/lib/notifications";
import type { SmartWasteProfile } from "@/lib/types";

export async function Topbar({ profile }: { profile?: SmartWasteProfile | null }) {
  const isChatUser = profile && (profile.role === "USER" || profile.role === "COLLECTOR");

  const [unreadChats, chatThreads, notifications, unreadNotifications] = isChatUser
    ? await Promise.all([
        countUnreadChatsForProfile(profile.id, profile.role),
        getChatThreadsForProfile({ profileId: profile.id, role: profile.role }),
        getNotificationsForProfile(profile.id),
        countUnreadNotifications(profile.id),
      ])
    : [0, [], [], 0];

  const roleLabel = profile ? ROLE_LABEL[profile.role] : "";

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-slate-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2.5 text-white">
          <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-400">
            <Leaf className="h-5 w-5" />
          </div>
          <span
            className="text-lg font-bold tracking-tight"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            CoolWaste
          </span>
        </Link>

        {/* ── Desktop Navigation ── */}
        <nav className="hidden items-center gap-1 lg:flex">
          {profile ? (
            <>
              {/* Dev / Demo tools – only visible in dev */}
              {isDevAccountSwitcherEnabled() ? (
                <DevAccountSwitcher currentEmail={profile.email} />
              ) : null}
              <DemoSwitcher currentEmail={profile.email} />

              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>

              {/* Notification bell – only for USER / COLLECTOR */}
              {isChatUser && (
                <NotificationButton
                  notifications={notifications as NotificationEntry[]}
                  unreadCount={unreadNotifications as number}
                />
              )}

              {/* User dropdown (Pengaturan / Riwayat Pickup / Logout) */}
              <div className="ml-2">
                <NavUserDropdown
                  name={profile.name}
                  role={roleLabel}
                />
              </div>
            </>
          ) : (
            <>
              {isDevAccountSwitcherEnabled() ? <DevAccountSwitcher /> : null}

              <Link href="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Daftar Sekarang</Button>
              </Link>
            </>
          )}
        </nav>

        {/* ── Mobile Navigation (hamburger) ── */}
        <div className="relative lg:hidden">
          <MobileNav
            isLoggedIn={!!profile}
            name={profile?.name}
            role={roleLabel}
          />
        </div>
      </div>

      {/* Floating chat widget for USER / COLLECTOR */}
      {isChatUser && profile ? (
        <FloatingChatWidget
          threads={chatThreads}
          profileId={profile.id}
          role={profile.role}
          profileName={profile.name}
          unreadCount={unreadChats}
        />
      ) : null}
    </header>
  );
}
