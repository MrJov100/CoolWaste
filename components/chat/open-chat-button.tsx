"use client";

import { MessageCircle } from "lucide-react";

/**
 * Tombol "Hubungi Collector" yang memicu custom event untuk membuka
 * FloatingChatWidget langsung ke thread pickup yang relevan.
 */
export function OpenChatButton({
  threadId,
  label = "Chat Collector",
  className,
}: {
  threadId: string | null | undefined;
  label?: string;
  className?: string;
}) {
  if (!threadId) return null;

  function handleClick() {
    window.dispatchEvent(
      new CustomEvent("coolwaste:open-chat", { detail: { threadId } })
    );
  }

  return (
    <button
      onClick={handleClick}
      className={
        className ??
        "flex items-center gap-1 rounded-xl bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/25"
      }
    >
      <MessageCircle className="h-3 w-3" />
      {label}
    </button>
  );
}
