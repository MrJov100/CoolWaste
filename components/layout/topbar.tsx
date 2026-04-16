import Link from "next/link";
import { ArrowRight, Leaf, LogOut, Settings, ShieldCheck } from "lucide-react";

import { signOut } from "@/app/(auth)/actions";
import { FloatingChatButton } from "@/components/chat/floating-chat-button";
import { DevAccountSwitcher } from "@/components/layout/dev-account-switcher";
import { DemoSwitcher } from "@/components/layout/demo-switcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABEL } from "@/lib/constants";
import { countUnreadChatsForProfile } from "@/lib/data/chat";
import { isDevAccountSwitcherEnabled } from "@/lib/dev-accounts";
import type { SmartWasteProfile } from "@/lib/types";

export async function Topbar({ profile }: { profile?: SmartWasteProfile | null }) {
  const unreadChats =
    profile && (profile.role === "USER" || profile.role === "COLLECTOR")
      ? await countUnreadChatsForProfile(profile.id, profile.role)
      : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3 text-white">
          <div className="rounded-2xl bg-emerald-500/15 p-2 text-emerald-300">
            <Leaf className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">Cool Waste</p>
            <p className="text-xs text-slate-400">Competition Platform</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {profile ? (
            <>
              {isDevAccountSwitcherEnabled() ? <DevAccountSwitcher currentEmail={profile.email} /> : null}
              <DemoSwitcher currentEmail={profile.email} />
              <Link href="/leaderboard">
                <Button variant="ghost" size="sm">
                  Leaderboard
                </Button>
              </Link>
              <Badge variant="emerald">
                <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                {ROLE_LABEL[profile.role]}
              </Badge>
              <Link href="/dashboard">
                <Button variant="secondary" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Link href="/chat">
                <Button variant="ghost" size="sm">
                  Chat
                  {unreadChats > 0 ? (
                    <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] text-emerald-950">
                      {unreadChats}
                    </span>
                  ) : null}
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
              <Link href="/dashboard/demo">
                <Button variant="ghost" size="sm">
                  Demo View
                </Button>
              </Link>
              <form action={signOut}>
                <Button variant="ghost" size="sm">
                  <LogOut className="mr-2 h-4 w-4" />
                  Keluar
                </Button>
              </form>
            </>
          ) : (
            <>
              {isDevAccountSwitcherEnabled() ? <DevAccountSwitcher /> : null}
              <Link href="/leaderboard">
                <Button variant="ghost" size="sm">
                  Leaderboard
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="secondary" size="sm">
                  Daftar
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="sm">
                  Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard/demo">
                <Button variant="ghost" size="sm">
                  Lihat Demo
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
      {profile && (profile.role === "USER" || profile.role === "COLLECTOR") ? (
        <FloatingChatButton unreadChats={unreadChats} />
      ) : null}
    </header>
  );
}
