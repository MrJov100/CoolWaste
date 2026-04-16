import { format } from "date-fns";
import type { Role } from "@prisma/client";

import { reportChatThread, sendChatMessage } from "@/lib/actions/chat";
import type { ChatThreadData } from "@/lib/types";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function PickupChatPanel({
  thread,
  profile,
}: {
  thread: ChatThreadData | null;
  profile: {
    id: string;
    role: Role;
  };
}) {
  if (!thread) {
    return null;
  }

  return (
    <Card id="pickup-chat" className="mt-8">
      <CardHeader>
        <CardDescription>
          Chat aktif setelah pickup diterima collector, dan tetap tersedia sampai 1 jam setelah pickup selesai.
        </CardDescription>
        <CardTitle>Chat User dan Collector</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {thread.canReport ? (
          <form action={reportChatThread.bind(null, thread.id)} className="rounded-3xl border border-red-500/20 bg-red-950/20 p-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <Select name="reason" required defaultValue="">
                <option value="" disabled>Laporkan percakapan ke admin</option>
                <option value="Bahasa kasar dalam percakapan">Bahasa kasar dalam percakapan</option>
                <option value="Spam atau mengganggu">Spam atau mengganggu</option>
                <option value="Ancaman atau intimidasi">Ancaman atau intimidasi</option>
                <option value="Informasi menyesatkan">Informasi menyesatkan</option>
              </Select>
              <Button type="submit" variant="outline">Laporkan Percakapan</Button>
            </div>
          </form>
        ) : null}

        <ChatMessageList messages={thread.messages} profileId={profile.id} />

        {thread.canSend ? (
          <form action={sendChatMessage.bind(null, thread.id)} className="flex flex-col gap-3 sm:flex-row">
            <Input name="content" placeholder="Tulis pesan untuk koordinasi pickup..." />
            <Button type="submit">Kirim</Button>
          </form>
        ) : (
          <p className="text-sm text-slate-400">
            Chat saat ini hanya bisa dibaca. {thread.expiresAt ? `Berlaku sampai ${format(thread.expiresAt, "dd MMM yyyy, HH:mm")}.` : ""}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
