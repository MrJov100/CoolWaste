import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FloatingChatButton({ unreadChats = 0 }: { unreadChats?: number }) {
  return (
    <Link href="/chat" className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      <Button className="h-14 rounded-full px-5 shadow-2xl shadow-emerald-950/40">
        <MessageCircle className="mr-2 h-5 w-5" />
        Chat
        {unreadChats > 0 ? (
          <span className="ml-3 inline-flex min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-bold text-emerald-700">
            {unreadChats}
          </span>
        ) : null}
      </Button>
    </Link>
  );
}
