"use client";

import { useEffect, useRef } from "react";
import { format } from "date-fns";
import { Role } from "@prisma/client";

import type { ChatMessageEntry } from "@/lib/types";

export function ChatMessageList({
  messages,
  profileId,
}: {
  messages: ChatMessageEntry[];
  profileId: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="flex max-h-[32rem] flex-col gap-3 overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/40 p-4"
    >
      {messages.length ? (
        messages.map((message) => {
          const ownMessage = message.senderId === profileId;

          if (message.isSystemMessage) {
            return (
              <div key={message.id} className="flex justify-center">
                <div className="max-w-xl rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-center">
                  <p className="text-xs font-medium text-emerald-100">{message.content}</p>
                  <p className="mt-1 text-[11px] text-emerald-200/70">
                    {format(message.createdAt, "dd MMM yyyy, HH:mm")}
                  </p>
                </div>
              </div>
            );
          }

          return (
            <div key={message.id} className={`flex ${ownMessage ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-[1.75rem] px-4 py-3 shadow-sm sm:max-w-[75%] ${
                  ownMessage
                    ? "rounded-br-md bg-emerald-500 text-emerald-950"
                    : "rounded-bl-md border border-white/10 bg-white/[0.05] text-slate-100"
                }`}
              >
                <p className={`text-xs font-medium ${ownMessage ? "text-emerald-950/80" : "text-slate-300"}`}>
                  {ownMessage
                    ? "Anda"
                    : `${message.senderName} ${message.senderRole === Role.COLLECTOR ? "(Collector)" : "(User)"}`}
                </p>
                <p className={`mt-1 text-sm leading-7 ${ownMessage ? "text-emerald-950" : "text-slate-100"}`}>
                  {message.content}
                </p>
                <p className={`mt-2 text-right text-[11px] ${ownMessage ? "text-emerald-950/70" : "text-slate-400"}`}>
                  {format(message.createdAt, "dd MMM yyyy, HH:mm")}
                </p>
              </div>
            </div>
          );
        })
      ) : (
        <p className="text-sm text-slate-400">Belum ada pesan. Gunakan chat ini untuk koordinasi pickup.</p>
      )}
    </div>
  );
}
