"use server";

import { ChatReportStatus, ChatThreadStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireProfile, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

const sendChatMessageSchema = z.object({
  content: z.string().trim().min(1, "Pesan tidak boleh kosong.").max(500, "Pesan maksimal 500 karakter."),
});

const reportChatSchema = z.object({
  reason: z.string().trim().min(5, "Alasan laporan minimal 5 karakter.").max(240, "Alasan laporan maksimal 240 karakter."),
});

const resolveChatReportSchema = z.object({
  decision: z.string().trim().min(5, "Keputusan admin minimal 5 karakter.").max(240, "Keputusan admin maksimal 240 karakter."),
  status: z.enum(["REVIEWED", "RESOLVED"]),
});

function revalidateChatViews(pickupId: string) {
  revalidatePath(`/pickups/${pickupId}`);
  revalidatePath("/pickups");
  revalidatePath("/dashboard/user");
  revalidatePath("/dashboard/collector");
  revalidatePath("/dashboard/admin");
}

async function getAuthorizedThreadOrThrow(threadId: string, profileId: string, role: Role) {
  const thread = await db.chatThread.findUniqueOrThrow({
    where: { id: threadId },
    include: {
      pickupRequest: true,
    },
  });

  const allowed = role === Role.ADMIN || thread.userId === profileId || thread.collectorId === profileId;
  if (!allowed) {
    throw new Error("Tidak punya akses ke chat ini.");
  }

  if (thread.expiresAt && thread.expiresAt.getTime() <= Date.now() && thread.status !== ChatThreadStatus.CLOSED) {
    return db.chatThread.update({
      where: { id: thread.id },
      data: { status: ChatThreadStatus.CLOSED },
      include: { pickupRequest: true },
    });
  }

  return thread;
}

export async function markThreadRead(threadId: string) {
  const profile = await requireProfile();
  if (profile.role !== Role.USER && profile.role !== Role.COLLECTOR) return;

  const thread = await db.chatThread.findUnique({ where: { id: threadId } });
  if (!thread) return;

  const isParticipant = thread.userId === profile.id || thread.collectorId === profile.id;
  if (!isParticipant) return;

  await db.chatThread.update({
    where: { id: threadId },
    data: profile.role === Role.USER
      ? { userLastReadAt: new Date() }
      : { collectorLastReadAt: new Date() },
  });

  revalidateChatViews(thread.pickupRequestId);
}

export async function sendChatMessage(threadId: string, formData: FormData) {
  const profile = await requireProfile();
  const parsed = sendChatMessageSchema.safeParse({
    content: formData.get("content"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Pesan belum valid.");
  }

  const thread = await getAuthorizedThreadOrThrow(threadId, profile.id, profile.role);

  if (profile.role === Role.ADMIN || thread.status !== ChatThreadStatus.ACTIVE) {
    throw new Error("Chat ini sudah tidak aktif untuk mengirim pesan baru.");
  }

  await db.$transaction([
    db.chatMessage.create({
      data: {
        threadId: thread.id,
        senderId: profile.id,
        content: parsed.data.content,
      },
    }),
    db.chatThread.update({
      where: { id: thread.id },
      data: {
        lastMessageAt: new Date(),
        ...(profile.role === Role.USER
          ? { userLastReadAt: new Date() }
          : { collectorLastReadAt: new Date() }),
      },
    }),
  ]);

  // Notify the other participant about the new message
  const recipientId = profile.role === Role.USER ? thread.collectorId : thread.userId;
  const senderLabel = profile.role === Role.USER ? "User" : "Collector";
  await createNotification({
    profileId: recipientId,
    type: "PESAN_MASUK",
    title: `Pesan baru dari ${senderLabel}`,
    body: parsed.data.content.length > 80
      ? `${parsed.data.content.slice(0, 80)}…`
      : parsed.data.content,
    pickupRequestId: thread.pickupRequestId,
    chatThreadId: thread.id,
  });

  revalidateChatViews(thread.pickupRequestId);
}

export async function reportChatThread(threadId: string, formData: FormData) {
  const profile = await requireProfile();
  const parsed = reportChatSchema.safeParse({
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Alasan laporan belum valid.");
  }

  const thread = await getAuthorizedThreadOrThrow(threadId, profile.id, profile.role);
  if (profile.role === Role.ADMIN) {
    throw new Error("Admin tidak dapat mengirim laporan chat.");
  }

  const latestOtherPartyMessage = await db.chatMessage.findFirst({
    where: {
      threadId,
      senderId: {
        not: profile.id,
      },
      isSystemMessage: false,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!latestOtherPartyMessage) {
    throw new Error("Belum ada pesan lawan bicara yang bisa dilaporkan.");
  }

  await db.chatReport.create({
    data: {
      threadId: thread.id,
      messageId: latestOtherPartyMessage.id,
      reportedByUserId: profile.id,
      reportedUserId: latestOtherPartyMessage.senderId,
      reason: parsed.data.reason,
    },
  });

  revalidateChatViews(thread.pickupRequestId);
}

export async function resolveChatReport(reportId: string, formData: FormData) {
  await requireRole(Role.ADMIN);
  const parsed = resolveChatReportSchema.safeParse({
    decision: formData.get("decision"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Keputusan admin belum valid.");
  }

  const report = await db.chatReport.findUniqueOrThrow({
    where: { id: reportId },
    include: {
      thread: {
        select: {
          pickupRequestId: true,
        },
      },
    },
  });

  await db.chatReport.update({
    where: { id: report.id },
    data: {
      status: parsed.data.status as ChatReportStatus,
      adminDecision: parsed.data.decision,
      reviewedAt: new Date(),
    },
  });

  revalidateChatViews(report.thread.pickupRequestId);
}
