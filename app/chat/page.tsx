import Link from "next/link";
import { MessageCircleMore } from "lucide-react";

import { ChatShell } from "@/components/chat/chat-shell";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth";
import { getChatThreadByIdForProfile, getChatThreadsForProfile } from "@/lib/data/chat";

export default async function ChatPage({
  searchParams,
}: {
  searchParams?: Promise<{ thread?: string }>;
}) {
  const profile = await requireProfile();
  const resolvedSearchParams = await searchParams;
  const threads = await getChatThreadsForProfile({
    profileId: profile.id,
    role: profile.role,
  });

  const fallbackThreadId = threads[0]?.id;
  const activeThread = (resolvedSearchParams?.thread || fallbackThreadId
    ? await getChatThreadByIdForProfile({
        threadId: resolvedSearchParams?.thread ?? fallbackThreadId!,
        profileId: profile.id,
        role: profile.role,
      })
    : null) ?? null;

  const normalizedThreads = threads.map((thread) =>
    activeThread && thread.id === activeThread.id
      ? {
          ...thread,
          hasUnread: activeThread.hasUnread,
        }
      : thread,
  );

  return (
    <div className="min-h-screen">
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

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-10">
        <section className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <Badge variant="emerald" className="w-fit">
              <MessageCircleMore className="mr-2 h-3.5 w-3.5" />
              Chat Center
            </Badge>
            <h1 className="text-4xl font-semibold text-white" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
              Pusat chat pickup
            </h1>
            <p className="max-w-2xl text-slate-300">
              Semua percakapan antara user dan collector dikumpulkan di sini agar lebih mudah dipantau.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/pickups">
              <Button variant="outline">Lihat pickup</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary">Kembali ke dashboard</Button>
            </Link>
          </div>
        </section>

        <ChatShell
          threads={normalizedThreads}
          activeThread={activeThread}
          profile={{ id: profile.id, role: profile.role, name: profile.name }}
        />
      </main>
    </div>
  );
}
