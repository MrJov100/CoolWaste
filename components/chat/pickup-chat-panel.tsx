"use client";

import { useEffect, useRef, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { Role } from "@prisma/client";
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  Flag,
  Lock,
  MessageCircle,
  Send,
  UserRound,
  X,
} from "lucide-react";

import { reportChatThread, sendChatMessage } from "@/lib/actions/chat";
import type { ChatThreadData } from "@/lib/types";
import { ChatMessageList } from "@/components/chat/chat-message-list";

const REPORT_REASONS_CHAT = [
  "Bahasa kasar / tidak sopan",
  "Spam atau pesan mengganggu",
  "Ancaman atau intimidasi",
  "Informasi menyesatkan",
  "Percakapan di luar konteks pickup",
];

function ExpiryCountdown({ expiresAt }: { expiresAt: Date }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    function update() {
      const now = Date.now();
      const diff = expiresAt.getTime() - now;
      if (diff <= 0) {
        setTimeLeft("Chat telah ditutup");
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setIsWarning(diff < 15 * 60 * 1000); // warning 15 menit sebelum tutup
      setTimeLeft(`${mins > 0 ? `${mins}m ` : ""}${secs}d`);
    }
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs ${
        isWarning
          ? "border border-amber-500/30 bg-amber-950/30 text-amber-300"
          : "border border-white/10 bg-white/[0.03] text-slate-400"
      }`}
    >
      <Clock className="h-3.5 w-3.5" />
      <span>Chat tutup dalam {timeLeft}</span>
    </div>
  );
}

export function PickupChatPanel({
  thread,
  profile,
}: {
  thread: ChatThreadData | null;
  profile: { id: string; role: Role; name?: string };
}) {
  const [showReportPanel, setShowReportPanel] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [reportPending, setReportPending] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [reportError, setReportError] = useState("");
  const [msgValue, setMsgValue] = useState("");
  const [sendPending, setSendPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (!thread) return null;
  const t = thread;

  const isClosed = thread.status === "CLOSED";
  const isReadOnly = thread.status === "READ_ONLY";
  const isActive = thread.status === "ACTIVE";

  const participantLabel =
    profile.role === "USER" ? "Collector" : "User";

  async function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!msgValue.trim() || sendPending) return;
    setSendPending(true);
    const fd = new FormData();
    fd.set("content", msgValue);
    try {
      await sendChatMessage(t.id, fd);
      setMsgValue("");
    } finally {
      setSendPending(false);
    }
  }

  async function handleReport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedReason || reportPending) return;
    setReportPending(true);
    setReportError("");
    const fd = new FormData();
    fd.set("reason", selectedReason);
    try {
      await reportChatThread(t.id, fd);
      setReportDone(true);
      setShowReportPanel(false);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "Gagal mengirim laporan.");
    } finally {
      setReportPending(false);
    }
  }

  return (
    <div id="pickup-chat" className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${isActive ? "bg-emerald-500/15" : "bg-slate-800"}`}>
            <MessageCircle className={`h-4 w-4 ${isActive ? "text-emerald-400" : "text-slate-500"}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Chat Pickup</p>
            <p className="text-xs text-slate-500">#{thread.pickupRequestNo}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Expiry countdown when active */}
          {isActive && thread.expiresAt && (
            <ExpiryCountdown expiresAt={thread.expiresAt} />
          )}

          {/* Status badge */}
          {isClosed && (
            <span className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-400">
              <Lock className="h-3 w-3" /> Chat Ditutup
            </span>
          )}
          {isReadOnly && (
            <span className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-950/20 px-3 py-1.5 text-xs text-amber-400">
              <AlertTriangle className="h-3 w-3" /> Hanya Baca
            </span>
          )}

          {/* Report button — klik nama participant */}
          {!isClosed && !reportDone && thread.canReport && (
            <button
              onClick={() => setShowReportPanel((v) => !v)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition-all ${
                showReportPanel
                  ? "border-red-500/40 bg-red-500/15 text-red-300"
                  : "border-white/10 text-slate-400 hover:border-red-500/30 hover:text-red-400"
              }`}
              title={`Laporkan ${participantLabel}`}
            >
              <UserRound className="h-3.5 w-3.5" />
              {participantLabel}
              <Flag className="h-3 w-3" />
            </button>
          )}

          {reportDone && (
            <span className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-3 py-1.5 text-xs text-emerald-400">
              ✓ Laporan terkirim
            </span>
          )}
        </div>
      </div>

      {/* Report panel (inline — seperti Shopee) */}
      {showReportPanel && (
        <div className="border-b border-red-500/10 bg-red-950/10 px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-red-300">
              <Flag className="mr-1.5 inline h-4 w-4" />
              Laporkan {participantLabel} pada percakapan ini
            </p>
            <button
              onClick={() => setShowReportPanel(false)}
              className="text-slate-500 hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {reportError && (
            <p className="mb-3 flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="h-3.5 w-3.5" /> {reportError}
            </p>
          )}
          <form onSubmit={handleReport} className="space-y-3">
            <div className="grid gap-2">
              {REPORT_REASONS_CHAT.map((r) => (
                <label
                  key={r}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm transition-all ${
                    selectedReason === r
                      ? "border-red-500/40 bg-red-500/10 text-red-200"
                      : "border-white/[0.08] text-slate-300 hover:border-white/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="chatReason"
                    value={r}
                    checked={selectedReason === r}
                    onChange={() => setSelectedReason(r)}
                    className="sr-only"
                  />
                  <div
                    className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 transition-all ${
                      selectedReason === r ? "border-red-400 bg-red-400" : "border-slate-600"
                    }`}
                  />
                  {r}
                </label>
              ))}
            </div>
            <button
              type="submit"
              disabled={!selectedReason || reportPending}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                selectedReason && !reportPending
                  ? "bg-red-500/80 text-white hover:bg-red-500"
                  : "cursor-not-allowed bg-slate-800 text-slate-500"
              }`}
            >
              <Flag className="h-4 w-4" />
              {reportPending ? "Mengirim..." : "Kirim Laporan Chat"}
            </button>
          </form>
        </div>
      )}

      {/* Message list */}
      <div className="px-5 pt-4">
        <ChatMessageList messages={thread.messages} profileId={profile.id} />
      </div>

      {/* Input area */}
      <div className="px-5 pb-5 pt-3">
        {isActive ? (
          <form onSubmit={handleSend} className="flex items-end gap-2">
            <div className="relative flex-1">
              <textarea
                value={msgValue}
                onChange={(e) => setMsgValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (msgValue.trim()) {
                      e.currentTarget.form?.requestSubmit();
                    }
                  }
                }}
                rows={1}
                placeholder="Tulis pesan koordinasi pickup... (Enter untuk kirim)"
                maxLength={500}
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 pr-12 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                style={{ minHeight: "48px", maxHeight: "120px" }}
              />
              <span className="absolute bottom-2.5 right-3 text-[10px] text-slate-600 tabular-nums">
                {msgValue.length}/500
              </span>
            </div>
            <button
              type="submit"
              disabled={!msgValue.trim() || sendPending}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all ${
                msgValue.trim() && !sendPending
                  ? "bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                  : "bg-slate-800 text-slate-600"
              }`}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <div
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
              isReadOnly
                ? "border-amber-500/20 bg-amber-950/10"
                : "border-white/[0.06] bg-white/[0.02]"
            }`}
          >
            {isReadOnly ? (
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            ) : (
              <Lock className="h-4 w-4 shrink-0 text-slate-600" />
            )}
            <div className="text-sm">
              {isReadOnly ? (
                <>
                  <span className="font-medium text-amber-300">Chat dalam mode hanya baca.</span>
                  {thread.expiresAt && (
                    <span className="ml-1 text-amber-400/70">
                      Akan ditutup pada {format(thread.expiresAt, "HH:mm, dd MMM")}.
                    </span>
                  )}
                </>
              ) : (
                <span className="text-slate-500">
                  Chat sudah ditutup.
                  {thread.expiresAt && (
                    <span className="ml-1">
                      Ditutup {formatDistanceToNow(thread.expiresAt, { addSuffix: true, locale: localeId })}.
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
