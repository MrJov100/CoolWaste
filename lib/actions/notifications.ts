"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { markNotificationsRead, markOneNotificationRead } from "@/lib/notifications";

export async function markAllNotificationsRead() {
  const profile = await requireProfile();
  await markNotificationsRead(profile.id);
  revalidatePath("/", "layout");
}

export async function markSingleNotificationRead(notificationId: string) {
  const profile = await requireProfile();
  await markOneNotificationRead(notificationId, profile.id);
  revalidatePath("/", "layout");
}
