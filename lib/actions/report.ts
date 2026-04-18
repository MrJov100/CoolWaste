"use server";

import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionState = {
  success: boolean;
  message: string;
};

const reportSchema = z.object({
  reason: z.string().min(5, "Pilih alasan laporan."),
  description: z.string().min(20, "Deskripsi minimal 20 karakter.").max(1000, "Deskripsi maksimal 1000 karakter."),
});

export async function submitCollectorReport(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(Role.USER);

  const pickupRequestId = formData.get("pickupRequestId");
  if (!pickupRequestId || typeof pickupRequestId !== "string") {
    return { success: false, message: "Request pickup tidak ditemukan." };
  }

  const pickup = await db.pickupRequest.findUnique({
    where: { id: pickupRequestId },
    include: { collector: true },
  });

  if (!pickup || pickup.userId !== user.id || !pickup.collectorId) {
    return { success: false, message: "Pickup tidak valid atau tidak ada collector yang bisa dilaporkan." };
  }

  const parsed = reportSchema.safeParse({
    reason: formData.get("reason"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Data laporan tidak valid." };
  }

  const file = formData.get("evidence");
  let evidenceUrl: string | null = null;
  if (file instanceof File && file.size > 0) {
    try {
      const client = createAdminClient();
      const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "waste-photos";
      const extension = file.name.split(".").pop() ?? "jpg";
      const path = `reports/${user.id}/${Date.now()}.${extension}`;
      const { error } = await client.storage.from(bucket).upload(path, await file.arrayBuffer(), {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
      if (!error) {
        const { data } = client.storage.from(bucket).getPublicUrl(path);
        evidenceUrl = data.publicUrl;
      }
    } catch {
      // non-critical, proceed without photo
    }
  }

  const existingThread = await db.chatThread.findUnique({
    where: { pickupRequestId: pickup.id },
  });

  if (existingThread) {
    await db.chatReport.create({
      data: {
        threadId: existingThread.id,
        reportedByUserId: user.id,
        reportedUserId: pickup.collectorId,
        reason: `${parsed.data.reason}${evidenceUrl ? ` [bukti: ${evidenceUrl}]` : ""}`,
      },
    });
  }

  return {
    success: true,
    message: "Laporan berhasil dikirim. Tim kami akan meninjau dalam 1-3 hari kerja.",
  };
}
