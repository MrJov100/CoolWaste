"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Clock, Lock, MessageCircle, AlertTriangle } from "lucide-react";
import type { Role } from "@prisma/client";

import type { ChatThreadData } from "@/lib/types";
import { PickupChatPanel } from "@/components/chat/pickup-chat-panel";

const STATUS_CONFIG = {
  ACTIVE: { label: "Aktif", color: "text-emerald-400", dot: "bg-emerald-400" },
  READ_ONLY: { label: "Hanya Baca", color: "text-amber-400", dot: "bg-amber-400" },
  CLOSED: { label: "Ditutup", color: "text-slate-500", dot: "bg-slate-600" },
} as const;

function ThreadItem({
  thread,
  isActive,
}: {
  thread: ChatThreadData;
  isActive: boolean;
}) {
  const cfg = STATUS_CONFIG[thread.status];

  return (
    <Link
      href={`/chat?thread=${thread.id}`}
      className={`block rounded-2xl border p-4 transition-all hover:border-emerald-500/30 ${
        isActive
          ? "border-emerald-500/30 bg-emerald-500/[0.07]"
          : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Status dot */}
        <div className="mt-1.5 shrink-0">
          <span className={`block h-2 w-2 rounded-full ${cfg.dot}`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-white">
              {thread.participantName ?? "—"}
            </p>
            {thread.hasUnread && (
              <span className="shrink-0 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-emerald-950">
                Baru
              </span>
            )}
          </div>

          <p className="mt-0.5 text-xs text-slate-500">#{thread.pickupRequestNo}</p>

          <div className="mt-2 flex items-center justify-between gap-2">
            <span className={`flex items-center gap-1 text-[11px] ${cfg.color}`}>
              {thread.status === "ACTIVE" ? (
                <MessageCircle className="h-3 w-3" />
              ) : thread.status === "READ_ONLY" ? (
                <AlertTriangle className="h-3 w-3" />
              ) : (
                <Lock className="h-3 w-3" />
              )}
              {cfg.label}
            </span>
            {thread.lastMessageAt && (
              <span className="text-[11px] text-slate-600">
                {formatDistanceToNow(thread.lastMessageAt, { addSuffix: true, locale: localeId })}
              </span>
            )}
          </div>

          {thread.status === "ACTIVE" && thread.expiresAt && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500">
              <Clock className="h-3 w-3" />
              Tutup {formatDistanceToNow(thread.expiresAt, { addSuffix: true, locale: localeId })}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ChatShell({
  threads,
  activeThread,
  profile,
}: {
  threads: ChatThreadData[];
  activeThread: ChatThreadData | null;
  profile: { id: string; role: Role; name?: string };
}) {
  const activeCount = threads.filter((t) => t.status === "ACTIVE").length;
  const unreadCount = threads.filter((t) => t.hasUnread).length;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.4fr_0.6fr]">
      {/* Thread list */}
      <div className="flex flex-col gap-4">
        {/* Summary header */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 px-5 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15">
              <MessageCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Percakapan</p>
              <p className="text-xs text-slate-500">
                {activeCount} aktif
                {unreadCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-emerald-950">
                    {unreadCount} belum dibaca
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-sm">
          {threads.length > 0 ? (
            <div className="space-y-1.5 p-3">
              {threads.map((thread) => (
                <ThreadItem
                  key={thread.id}
                  thread={thread}
                  isActive={activeThread?.id === thread.id}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800">
                <MessageCircle className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Belum ada percakapan</p>
                <p className="mt-0.5 text-xs text-slate-600">
                  Chat akan muncul setelah collector menerima pickup kamu.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active thread panel */}
      <div>
        {activeThread ? (
          <PickupChatPanel thread={activeThread} profile={profile} />
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/[0.06] bg-slate-900/40 px-8 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-800">
              <MessageCircle className="h-7 w-7 text-slate-600" />
            </div>
            <div>
              <p className="text-base font-medium text-slate-400">Pilih percakapan</p>
              <p className="mt-1 text-sm text-slate-600">
                Pilih salah satu chat di sebelah kiri untuk mulai membaca atau membalas.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
