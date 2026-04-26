import { PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";

// Mirror the DB enum — kept in sync with prisma/schema.prisma
export type NotificationType =
  | "PICKUP_MENUNGGU_MATCHING"
  | "PICKUP_MATCHED"
  | "PICKUP_DIBATALKAN"
  | "PICKUP_DALAM_PERJALANAN"
  | "PICKUP_SELESAI"
  | "LAPORAN_TERKIRIM"
  | "PESAN_MASUK";

export type NotificationEntry = {
  id: string;
  profileId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  pickupRequestId: string | null;
  chatThreadId: string | null;
  createdAt: Date;
};

// Use a dedicated PrismaClient instance to avoid any singleton/extension
// wrapping that can hide the `notification` accessor at runtime.
function getNotificationClient() {
  // Prefer the shared singleton when the `notification` accessor is available,
  // fall back to a fresh client otherwise (e.g. during HMR in dev).
  if (db && (db as unknown as PrismaClient).notification) {
    return (db as unknown as PrismaClient).notification;
  }
  return new PrismaClient().notification;
}

export async function createNotification({
  profileId,
  type,
  title,
  body,
  pickupRequestId,
  chatThreadId,
}: {
  profileId: string;
  type: NotificationType;
  title: string;
  body: string;
  pickupRequestId?: string;
  chatThreadId?: string;
}) {
  try {
    await getNotificationClient().create({
      data: {
        profileId,
        type,
        title,
        body,
        pickupRequestId: pickupRequestId ?? null,
        chatThreadId: chatThreadId ?? null,
      },
    });
  } catch (e) {
    // Notifications are non-critical — never block the main flow
    console.error("[notification] create failed:", e);
  }
}

export async function getNotificationsForProfile(profileId: string): Promise<NotificationEntry[]> {
  try {
    return await getNotificationClient().findMany({
      where: { profileId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }) as NotificationEntry[];
  } catch (e) {
    console.error("[notification] fetch failed:", e);
    return [];
  }
}

export async function getAllNotificationsForProfile(profileId: string): Promise<NotificationEntry[]> {
  try {
    return await getNotificationClient().findMany({
      where: { profileId },
      orderBy: { createdAt: "desc" },
    }) as NotificationEntry[];
  } catch (e) {
    console.error("[notification] fetch all failed:", e);
    return [];
  }
}

export async function countUnreadNotifications(profileId: string): Promise<number> {
  try {
    return await getNotificationClient().count({
      where: { profileId, isRead: false },
    }) as number;
  } catch (e) {
    console.error("[notification] count failed:", e);
    return 0;
  }
}

export async function markNotificationsRead(profileId: string) {
  try {
    await getNotificationClient().updateMany({
      where: { profileId, isRead: false },
      data: { isRead: true },
    });
  } catch (e) {
    console.error("[notification] markRead failed:", e);
  }
}

export async function markOneNotificationRead(notificationId: string, profileId: string) {
  try {
    await getNotificationClient().updateMany({
      where: { id: notificationId, profileId },
      data: { isRead: true },
    });
  } catch (e) {
    console.error("[notification] markOneRead failed:", e);
  }
}
