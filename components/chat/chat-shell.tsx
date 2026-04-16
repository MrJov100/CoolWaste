import Link from "next/link";
import { format } from "date-fns";

import type { ChatThreadData } from "@/lib/types";
import { PickupChatPanel } from "@/components/chat/pickup-chat-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ChatShell({
  threads,
  activeThread,
  profile,
}: {
  threads: ChatThreadData[];
  activeThread: ChatThreadData | null;
  profile: {
    id: string;
    role: import("@prisma/client").Role;
  };
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.38fr_0.62fr]">
      <Card>
        <CardHeader>
          <CardDescription>Semua chat aktif dan riwayat chat pickup</CardDescription>
          <CardTitle>Daftar Percakapan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {threads.length ? (
            threads.map((thread) => (
              <Link
                key={thread.id}
                href={`/chat?thread=${thread.id}`}
                className={`block rounded-3xl border p-4 ${
                  activeThread?.id === thread.id
                    ? "border-emerald-400/30 bg-emerald-500/10"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{thread.participantName}</p>
                    <p className="mt-1 text-sm text-slate-400">{thread.pickupRequestNo}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {thread.lastMessageAt ? format(thread.lastMessageAt, "dd MMM yyyy, HH:mm") : "Belum ada pesan"}
                    </p>
                  </div>
                  {thread.hasUnread ? (
                    <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-emerald-500 px-2 py-1 text-[11px] font-semibold text-emerald-950">
                      Baru
                    </span>
                  ) : null}
                </div>
              </Link>
            ))
          ) : (
            <p className="text-sm text-slate-400">Belum ada chat pickup yang tersedia.</p>
          )}
        </CardContent>
      </Card>

      <div>
        {activeThread ? (
          <PickupChatPanel thread={activeThread} profile={profile} />
        ) : (
          <Card>
            <CardContent className="p-8 text-sm text-slate-400">
              Pilih salah satu chat di kiri untuk mulai membaca atau membalas percakapan.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
