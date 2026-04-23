import { ChatReportStatus, ChatThreadStatus, Role } from "@prisma/client";

import { db } from "@/lib/db";
import type { ChatMessageEntry, ChatReportEntry, ChatThreadData } from "@/lib/types";

async function syncThreadStatus(threadId: string) {
  const thread = await db.chatThread.findUnique({
    where: { id: threadId },
  });

  if (!thread) {
    return null;
  }

  if (thread.status === ChatThreadStatus.CLOSED) {
    return thread;
  }

  const now = Date.now();

  if (thread.expiresAt) {
    const expiresMs = thread.expiresAt.getTime();
    // Fully expired → CLOSED
    if (expiresMs <= now) {
      return db.chatThread.update({
        where: { id: thread.id },
        data: { status: ChatThreadStatus.CLOSED },
      });
    }
    // 15 minutes or less remaining → READ_ONLY
    const READ_ONLY_THRESHOLD_MS = 15 * 60 * 1000;
    if (expiresMs - now <= READ_ONLY_THRESHOLD_MS && thread.status === ChatThreadStatus.ACTIVE) {
      return db.chatThread.update({
        where: { id: thread.id },
        data: { status: ChatThreadStatus.READ_ONLY },
      });
    }
  }

  return thread;
}

function toMessageEntry(message: {
  id: string;
  senderId: string;
  content: string;
  isSystemMessage: boolean;
  createdAt: Date;
  sender: { name: string; role: Role };
}): ChatMessageEntry {
  return {
    id: message.id,
    senderId: message.senderId,
    senderName: message.sender.name,
    senderRole: message.sender.role,
    content: message.content,
    isSystemMessage: message.isSystemMessage,
    createdAt: message.createdAt,
  };
}

export async function getChatThreadForPickup({
  pickupId,
  profileId,
  role,
}: {
  pickupId: string;
  profileId: string;
  role: Role;
}): Promise<ChatThreadData | null> {
  const thread = await db.chatThread.findUnique({
    where: { pickupRequestId: pickupId },
    include: {
      pickupRequest: {
        select: {
          requestNo: true,
        },
      },
      messages: {
        include: {
          sender: {
            select: { name: true, role: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!thread) {
    return null;
  }

  const syncedThread = await syncThreadStatus(thread.id);
  if (!syncedThread) {
    return null;
  }

  const allowed = role === Role.ADMIN || syncedThread.userId === profileId || syncedThread.collectorId === profileId;
  if (!allowed) {
    return null;
  }

  const currentStatus = syncedThread.status;
  const canSend = role !== Role.ADMIN && currentStatus === ChatThreadStatus.ACTIVE;

  // myLastReadAt  = kapan viewer (saya) terakhir baca   → menentukan hasUnread saya
  // participantLastReadAt = kapan lawan bicara baca      → menentukan status centang pesan saya
  const myLastReadAt: Date | null =
    role === Role.USER      ? syncedThread.userLastReadAt
    : role === Role.COLLECTOR ? syncedThread.collectorLastReadAt
    : null;

  const participantLastReadAt: Date | null =
    role === Role.USER      ? syncedThread.collectorLastReadAt
    : role === Role.COLLECTOR ? syncedThread.userLastReadAt
    : null;

  const hasUnread =
    syncedThread.lastMessageAt != null &&
    (!myLastReadAt || syncedThread.lastMessageAt > myLastReadAt);

  return {
    id: syncedThread.id,
    pickupRequestId: syncedThread.pickupRequestId,
    pickupRequestNo: thread.pickupRequest.requestNo,
    userId: syncedThread.userId,
    collectorId: syncedThread.collectorId,
    status: currentStatus,
    expiresAt: syncedThread.expiresAt,
    canSend,
    canReport: role !== Role.ADMIN,
    hasUnread,
    lastMessageAt: syncedThread.lastMessageAt,
    participantLastReadAt,
    messages: thread.messages.map(toMessageEntry),
  };
}

export async function getChatThreadsForProfile({
  profileId,
  role,
}: {
  profileId: string;
  role: Role;
}): Promise<ChatThreadData[]> {
  if (role !== Role.USER && role !== Role.COLLECTOR) {
    return [];
  }

  const threads = await db.chatThread.findMany({
    where: role === Role.USER ? { userId: profileId } : { collectorId: profileId },
    include: {
      pickupRequest: {
        select: {
          id: true,
          requestNo: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      collector: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      messages: {
        include: {
          sender: {
            select: { name: true, role: true },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 50,
      },
    },
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
    take: 20,
  });

  const result: ChatThreadData[] = [];

  for (const thread of threads) {
    const syncedThread = await syncThreadStatus(thread.id);
    if (!syncedThread) {
      continue;
    }

    const participant = role === Role.USER ? thread.collector : thread.user;

    const myLastReadAt = role === Role.USER ? syncedThread.userLastReadAt : syncedThread.collectorLastReadAt;
    const participantLastReadAt = role === Role.USER ? syncedThread.collectorLastReadAt : syncedThread.userLastReadAt;
    const hasUnread = syncedThread.lastMessageAt != null && (!myLastReadAt || syncedThread.lastMessageAt > myLastReadAt);

    result.push({
      id: syncedThread.id,
      pickupRequestId: syncedThread.pickupRequestId,
      pickupRequestNo: thread.pickupRequest.requestNo,
      participantName: participant.name,
      participantRole: participant.role,
      userId: syncedThread.userId,
      collectorId: syncedThread.collectorId,
      status: syncedThread.status,
      expiresAt: syncedThread.expiresAt,
      canSend: syncedThread.status === ChatThreadStatus.ACTIVE,
      canReport: true,
      hasUnread,
      lastMessageAt: syncedThread.lastMessageAt,
      participantLastReadAt,
      messages: thread.messages.map(toMessageEntry),
    });
  }

  return result;
}

export async function getChatThreadByIdForProfile({
  threadId,
  profileId,
  role,
}: {
  threadId: string;
  profileId: string;
  role: Role;
}) {
  const thread = await db.chatThread.findUnique({
    where: { id: threadId },
    select: {
      pickupRequestId: true,
    },
  });

  if (!thread) {
    return null;
  }

  return getChatThreadForPickup({
    pickupId: thread.pickupRequestId,
    profileId,
    role,
  });
}

export async function getChatReportsForAdmin(): Promise<ChatReportEntry[]> {
  const reports = await db.chatReport.findMany({
    include: {
      thread: {
        include: {
          pickupRequest: {
            select: {
              id: true,
              requestNo: true,
            },
          },
          messages: {
            include: {
              sender: {
                select: {
                  name: true,
                  role: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
            take: 20,
          },
        },
      },
      message: {
        select: { content: true },
      },
      reportedByUser: {
        select: { name: true },
      },
      reportedUser: {
        select: { name: true },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 10,
  });

  return reports.map((report) => ({
    id: report.id,
    threadId: report.threadId,
    pickupRequestId: report.thread.pickupRequest.id,
    pickupRequestNo: report.thread.pickupRequest.requestNo,
    reportedByName: report.reportedByUser.name,
    reportedUserName: report.reportedUser.name,
    reason: report.reason,
    status: report.status,
    adminDecision: report.adminDecision,
    createdAt: report.createdAt,
    reviewedAt: report.reviewedAt,
    messageContent: report.message?.content ?? null,
    transcript: report.thread.messages.map(toMessageEntry),
  }));
}

export async function countOpenChatReports() {
  return db.chatReport.count({
    where: { status: ChatReportStatus.OPEN },
  });
}

export async function countUnreadChatsForProfile(profileId: string, role: Role) {
  if (role !== Role.USER && role !== Role.COLLECTOR) {
    return 0;
  }

  const threads = await db.chatThread.findMany({
    where:
      role === Role.USER
        ? { userId: profileId, status: ChatThreadStatus.ACTIVE }
        : { collectorId: profileId, status: ChatThreadStatus.ACTIVE },
    select: {
      lastMessageAt: true,
      userLastReadAt: true,
      collectorLastReadAt: true,
    },
    take: 50,
  });

  return threads.filter((thread) => {
    const lastReadAt = role === Role.USER ? thread.userLastReadAt : thread.collectorLastReadAt;
    if (!thread.lastMessageAt) {
      return false;
    }

    if (!lastReadAt) {
      return true;
    }

    return thread.lastMessageAt > lastReadAt;
  }).length;
}
