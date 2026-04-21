"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageCircle, X } from "lucide-react";

export function FloatingChatButton({
  unreadChats = 0,
  defaultExpanded = false,
  activeThreadId,
}: {
  unreadChats?: number;
  defaultExpanded?: boolean;
  activeThreadId?: string;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [prevUnread, setPrevUnread] = useState(unreadChats);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (defaultExpanded) setExpanded(true);
  }, [defaultExpanded]);

  useEffect(() => {
    if (unreadChats > prevUnread) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 1500);
      return () => clearTimeout(t);
    }
    setPrevUnread(unreadChats);
  }, [unreadChats, prevUnread]);

  const chatHref = activeThreadId ? `/chat?thread=${activeThreadId}` : "/chat";

  return (
    <>
      {/* Chat panel — pojok kiri bawah */}
      {expanded && (
        <div className="fixed bottom-5 left-5 z-50 w-72 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl shadow-black/50 backdrop-blur-xl sm:bottom-6 sm:left-6">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Pesan</p>
              <p className="mt-0.5 text-sm font-medium text-white">
                {unreadChats > 0 ? `${unreadChats} pesan belum dibaca` : "Tidak ada pesan baru"}
              </p>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="flex h-7 w-7 items-center justify-center rounded-xl text-slate-500 hover:bg-white/5 hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-1.5">
            <Link
              href={chatHref}
              onClick={() => setExpanded(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              <MessageCircle className="h-4 w-4 text-emerald-400" />
              {activeThreadId ? "Buka percakapan ini" : "Buka semua chat"}
              {unreadChats > 0 && (
                <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-emerald-950">
                  {unreadChats > 99 ? "99+" : unreadChats}
                </span>
              )}
            </Link>
            {activeThreadId && (
              <Link
                href="/chat"
                onClick={() => setExpanded(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-300"
              >
                <MessageCircle className="h-4 w-4 text-slate-500" />
                Semua percakapan
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Floating button — pojok kanan bawah */}
      <div className="fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6">
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Tutup panel chat" : "Buka panel chat"}
          className={`relative flex h-14 w-14 items-center justify-center rounded-full shadow-2xl shadow-emerald-950/40 transition-all duration-200 ${
            expanded
              ? "bg-slate-700 hover:bg-slate-600"
              : "bg-emerald-500 hover:bg-emerald-400"
          } ${pulse ? "animate-bounce" : ""}`}
        >
          {unreadChats > 0 && !expanded && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-slate-950 bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadChats > 99 ? "99+" : unreadChats}
            </span>
          )}
          {expanded ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <MessageCircle className="h-6 w-6 text-emerald-950" />
          )}
        </button>
      </div>
    </>
  );
}
