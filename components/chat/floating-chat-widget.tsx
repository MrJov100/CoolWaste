"use client";

import { useState, useEffect, useRef, useCallback, useOptimistic, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { Role } from "@prisma/client";
import {
  AlertTriangle,
  Check,
  CheckCheck,
  Clock,
  Flag,
  Lock,
  MessageCircle,
  Send,
  X,
} from "lucide-react";

import { sendChatMessage, markThreadRead } from "@/lib/actions/chat";
import type { ChatThreadData, ChatMessageEntry } from "@/lib/types";

// ── Constants ──────────────────────────────────────────────────────────────
const STATUS_CFG = {
  ACTIVE:    { label: "Aktif",      color: "text-emerald-400", dot: "bg-emerald-400" },
  READ_ONLY: { label: "Hanya Baca", color: "text-amber-400",   dot: "bg-amber-400"   },
  CLOSED:    { label: "Ditutup",    color: "text-slate-500",   dot: "bg-slate-600"   },
} as const;

// ── MessageStatus (centang WhatsApp) ───────────────────────────────────────
// optimistic  → centang 1 (belum masuk server)
// delivered   → centang 2 abu (sudah di DB, participant belum baca)
// read        → centang 2 biru (participant sudah baca)
type MsgStatus = "optimistic" | "delivered" | "read";

function getMessageStatus(
  msg: ChatMessageEntry,
  participantLastReadAt: Date | null | undefined,
): MsgStatus {
  if (msg.id.startsWith("optimistic-")) return "optimistic";
  if (!participantLastReadAt) return "delivered";
  return msg.createdAt <= participantLastReadAt ? "read" : "delivered";
}

function ReadTick({ status }: { status: MsgStatus }) {
  if (status === "optimistic") {
    return <Check className="h-3 w-3 text-emerald-800/60" />;
  }
  if (status === "delivered") {
    return <CheckCheck className="h-3 w-3 text-emerald-800/50" />;
  }
  // read
  return <CheckCheck className="h-3 w-3 text-blue-300" />;
}

// ── ExpiryCountdown ────────────────────────────────────────────────────────
function ExpiryCountdown({ expiresAt }: { expiresAt: Date }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    function tick() {
      const diff = expiresAt.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Ditutup"); return; }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setIsWarning(diff < 15 * 60 * 1000);
      setTimeLeft(`${mins > 0 ? `${mins}m ` : ""}${secs}d`);
    }
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  return (
    <span className={`flex items-center gap-1 text-[10px] ${isWarning ? "text-amber-400" : "text-slate-500"}`}>
      <Clock className="h-3 w-3" />{timeLeft}
    </span>
  );
}

// ── MessageBubbles ─────────────────────────────────────────────────────────
function MessageBubbles({
  messages,
  profileId,
  participantLastReadAt,
}: {
  messages: ChatMessageEntry[];
  profileId: string;
  participantLastReadAt: Date | null | undefined;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!messages.length) {
    return (
      <p className="py-8 text-center text-xs text-slate-600">
        Belum ada pesan. Gunakan chat ini untuk koordinasi pickup.
      </p>
    );
  }

  return (
    <>
      {messages.map((msg) => {
        const own = msg.senderId === profileId;

        if (msg.isSystemMessage) {
          return (
            <div key={msg.id} className="flex justify-center">
              <div className="max-w-[90%] rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-center">
                <p className="text-[11px] font-medium text-emerald-100">{msg.content}</p>
                <p className="text-[10px] text-emerald-200/60">{format(msg.createdAt, "HH:mm")}</p>
              </div>
            </div>
          );
        }

        const msgStatus = own ? getMessageStatus(msg, participantLastReadAt) : null;

        return (
          <div key={msg.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[82%] rounded-2xl px-3 py-2 shadow-sm ${
                own
                  ? "rounded-br-sm bg-emerald-500 text-emerald-950"
                  : "rounded-bl-sm border border-white/10 bg-white/[0.06] text-slate-100"
              }`}
            >
              {!own && (
                <p className="mb-0.5 text-[10px] font-semibold text-slate-400">{msg.senderName}</p>
              )}
              <p className="text-xs leading-relaxed">{msg.content}</p>
              <div className={`mt-1 flex items-center justify-end gap-1 ${own ? "text-emerald-950/60" : "text-slate-600"}`}>
                <span className="text-[10px]">{format(msg.createdAt, "HH:mm")}</span>
                {own && msgStatus && <ReadTick status={msgStatus} />}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </>
  );
}

// ── InlineChatRoom ─────────────────────────────────────────────────────────
function InlineChatRoom({
  thread,
  profileId,
  role,
  profileName,
}: {
  thread: ChatThreadData;
  profileId: string;
  role: Role;
  profileName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    thread.messages,
    (prev: ChatMessageEntry[], newMsg: ChatMessageEntry) => [...prev, newMsg],
  );

  const [msgValue, setMsgValue] = useState("");

  const isActive   = thread.status === "ACTIVE";
  const isReadOnly = thread.status === "READ_ONLY";
  const isClosed   = thread.status === "CLOSED";
  const participantLabel = role === "USER" ? "Collector" : "User";

  // Mark thread as read when opened — clears unread badge
  useEffect(() => {
    markThreadRead(thread.id).then(() => router.refresh());
    // Only run once when this thread is first opened
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread.id]);

  async function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const content = msgValue.trim();
    if (!content || isPending) return;

    setMsgValue("");

    const optimisticMsg: ChatMessageEntry = {
      id: `optimistic-${Date.now()}`,
      senderId: profileId,
      senderName: profileName,
      senderRole: role,
      content,
      isSystemMessage: false,
      createdAt: new Date(),
    };

    startTransition(async () => {
      addOptimisticMessage(optimisticMsg);
      const fd = new FormData();
      fd.set("content", content);
      try {
        await sendChatMessage(thread.id, fd);
      } finally {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex h-full flex-col">
      {/* Sub-header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-white">
            {thread.participantName ?? "Chat Pickup"}
          </p>
          <p className="text-[10px] text-slate-500">#{thread.pickupRequestNo}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {isActive   && thread.expiresAt && <ExpiryCountdown expiresAt={thread.expiresAt} />}
          {isClosed   && <span className="flex items-center gap-1 text-[10px] text-slate-500"><Lock className="h-3 w-3" />Ditutup</span>}
          {isReadOnly && <span className="flex items-center gap-1 text-[10px] text-amber-400"><AlertTriangle className="h-3 w-3" />Baca</span>}
          {!isClosed && thread.canReport && thread.pickupRequestNo && (
            <a
              href={`/report/${thread.pickupRequestNo}`}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
              title={`Laporkan ${participantLabel}`}
            >
              <Flag className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        <MessageBubbles
          messages={optimisticMessages}
          profileId={profileId}
          participantLastReadAt={thread.participantLastReadAt}
        />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-white/[0.07] p-2.5">
        {isActive ? (
          <form onSubmit={handleSend} className="flex items-end gap-1.5">
            <div className="relative flex-1">
              <textarea
                value={msgValue}
                onChange={(e) => setMsgValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (msgValue.trim()) e.currentTarget.form?.requestSubmit();
                  }
                }}
                rows={1}
                placeholder="Tulis pesan..."
                maxLength={500}
                disabled={isPending}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 pr-9 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-50"
                style={{ minHeight: "34px", maxHeight: "72px" }}
              />
              <span className="absolute bottom-2 right-2 text-[9px] text-slate-600 tabular-nums">
                {msgValue.length}/500
              </span>
            </div>
            <button
              type="submit"
              disabled={!msgValue.trim() || isPending}
              className={`flex h-[34px] w-8 shrink-0 items-center justify-center rounded-xl transition-all ${
                msgValue.trim() && !isPending
                  ? "bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                  : "bg-slate-800 text-slate-600"
              }`}
            >
              <Send className="h-3 w-3" />
            </button>
          </form>
        ) : (
          <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
            isReadOnly ? "border-amber-500/20 bg-amber-950/10" : "border-white/[0.06] bg-white/[0.02]"
          }`}>
            {isReadOnly
              ? <AlertTriangle className="h-3 w-3 shrink-0 text-amber-400" />
              : <Lock className="h-3 w-3 shrink-0 text-slate-600" />}
            <p className="text-[10px]">
              {isReadOnly ? (
                <span className="text-amber-300">
                  Hanya baca.{" "}
                  {thread.expiresAt && (
                    <span className="text-amber-400/70">Tutup {format(thread.expiresAt, "HH:mm, dd MMM")}.</span>
                  )}
                </span>
              ) : (
                <span className="text-slate-500">Chat sudah ditutup.</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ThreadItem ─────────────────────────────────────────────────────────────
function ThreadItem({
  thread,
  isActive,
  onSelect,
}: {
  thread: ChatThreadData;
  isActive: boolean;
  onSelect: (thread: ChatThreadData) => void;
}) {
  const cfg = STATUS_CFG[thread.status];
  const lastMsg = thread.messages[thread.messages.length - 1];

  return (
    <button
      onClick={() => onSelect(thread)}
      className={`flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors ${
        isActive ? "bg-emerald-500/10" : "hover:bg-white/[0.04]"
      }`}
    >
      {/* Avatar */}
      <div className="relative mt-0.5 shrink-0">
        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
          isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"
        }`}>
          {(thread.participantName ?? "?").charAt(0).toUpperCase()}
        </div>
        <span className={`absolute -bottom-0.5 -right-0.5 block h-2 w-2 rounded-full border border-slate-900 ${cfg.dot}`} />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <p className={`truncate text-[11px] font-semibold ${
            isActive ? "text-emerald-300" : thread.hasUnread ? "text-white" : "text-slate-300"
          }`}>
            {thread.participantName ?? "—"}
          </p>
          <span className="shrink-0 text-[9px] text-slate-600">
            {thread.lastMessageAt
              ? formatDistanceToNow(thread.lastMessageAt, { addSuffix: false, locale: localeId })
              : ""}
          </span>
        </div>
        <p className={`mt-0.5 truncate text-[10px] ${thread.hasUnread && !isActive ? "text-slate-300" : "text-slate-500"}`}>
          {lastMsg ? lastMsg.content : `#${thread.pickupRequestNo}`}
        </p>
        {/* Unread dot — hilang saat isActive (sudah dibaca) */}
        {thread.hasUnread && !isActive && (
          <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        )}
      </div>
    </button>
  );
}

// ── FloatingChatWidget ─────────────────────────────────────────────────────
export function FloatingChatWidget({
  threads,
  profileId,
  role,
  profileName,
  unreadCount,
  defaultThreadId,
}: {
  threads: ChatThreadData[];
  profileId: string;
  role: Role;
  profileName: string;
  unreadCount: number;
  defaultThreadId?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeThread, setActiveThread] = useState<ChatThreadData | null>(null);
  // localUnread tracks unread count optimistically (decrements when thread opened)
  const [localUnread, setLocalUnread] = useState(unreadCount);
  const [prevUnread, setPrevUnread] = useState(unreadCount);
  const [pulse, setPulse] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Keep localUnread in sync when server refreshes props
  useEffect(() => {
    setLocalUnread(unreadCount);
  }, [unreadCount]);

  // Sync activeThread messages when router.refresh() updates threads prop
  useEffect(() => {
    if (activeThread) {
      const refreshed = threads.find((t) => t.id === activeThread.id);
      if (refreshed) setActiveThread(refreshed);
    }
  }, [threads]); // eslint-disable-line react-hooks/exhaustive-deps

  // Open to specific thread via prop
  useEffect(() => {
    if (defaultThreadId) {
      const t = threads.find((th) => th.id === defaultThreadId) ?? null;
      if (t) { setActiveThread(t); setOpen(true); }
    }
  }, [defaultThreadId, threads]);

  // CustomEvent from OpenChatButton
  const handleOpenChatEvent = useCallback(
    (e: Event) => {
      const { threadId } = (e as CustomEvent<{ threadId: string }>).detail;
      const t = threads.find((th) => th.id === threadId) ?? null;
      setActiveThread(t);
      setOpen(true);
    },
    [threads],
  );

  useEffect(() => {
    window.addEventListener("coolwaste:open-chat", handleOpenChatEvent);
    return () => window.removeEventListener("coolwaste:open-chat", handleOpenChatEvent);
  }, [handleOpenChatEvent]);

  // Badge pulse on new incoming message
  useEffect(() => {
    if (unreadCount > prevUnread) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 1500);
      return () => clearTimeout(t);
    }
    setPrevUnread(unreadCount);
  }, [unreadCount, prevUnread]);

  function handleSelectThread(thread: ChatThreadData) {
    // Optimistically clear unread dot for this thread in the list
    if (thread.hasUnread) {
      setLocalUnread((n) => Math.max(0, n - 1));
    }
    setActiveThread(thread);
  }

  function handleToggle() {
    setOpen((v) => {
      if (v) setActiveThread(null);
      return !v;
    });
  }

  const hasThreads = threads.length > 0;
  const panelWidth = open && activeThread ? 620 : 300;

  if (!mounted) return null;

  return createPortal(
    <>
      {/* ── Floating Panel ── */}
      {open && (
        <div
          className="fixed bottom-[5.5rem] right-5 z-[9999] flex overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/60 sm:right-6"
          style={{ width: panelWidth, height: 480, transition: "width 220ms cubic-bezier(0.4,0,0.2,1)" }}
        >
          {/* ── Left: Thread list (always visible) ── */}
          <div
            className="flex shrink-0 flex-col border-r border-white/[0.07]"
            style={{
              width: activeThread ? 200 : "100%",
              transition: "width 220ms cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            {/* List header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/15">
                  <MessageCircle className="h-3 w-3 text-emerald-400" />
                </div>
                <p className="text-xs font-semibold text-white">Pesan</p>
                {localUnread > 0 && (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-emerald-950">
                    {localUnread > 99 ? "99+" : localUnread}
                  </span>
                )}
              </div>
              <button
                onClick={handleToggle}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-500 hover:bg-white/5 hover:text-slate-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Thread list */}
            <div className="flex-1 overflow-y-auto py-1.5">
              {hasThreads ? (
                threads.map((thread) => (
                  <ThreadItem
                    key={thread.id}
                    thread={thread}
                    isActive={activeThread?.id === thread.id}
                    onSelect={handleSelectThread}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800">
                    <MessageCircle className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">Belum ada percakapan</p>
                    <p className="mt-0.5 text-[10px] text-slate-600">
                      Chat muncul setelah collector menerima pickup.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Chat room ── */}
          {activeThread && (
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <InlineChatRoom
                key={activeThread.id}
                thread={activeThread}
                profileId={profileId}
                role={role}
                profileName={profileName}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Floating Button ── */}
      <div className="fixed bottom-5 right-5 z-[9999] sm:bottom-6 sm:right-6">
        <button
          onClick={handleToggle}
          aria-label={open ? "Tutup chat" : "Buka chat"}
          className={`relative flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-200 ${
            open
              ? "bg-slate-700 shadow-black/40 hover:bg-slate-600"
              : "bg-emerald-500 shadow-emerald-950/40 hover:bg-emerald-400"
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
            <MessageCircle className="h-6 w-6 text-emerald-950" />
          )}
        </button>
      </div>
    </>,
    document.body,
  );
}
