"use server";

import { Role } from "@prisma/client";
import { z } from "zod";

import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { savePublicUpload } from "@/lib/storage/local-upload";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { createNotification } from "@/lib/notifications";

type ActionState = { success: boolean; message: string };

const VALID_REASONS = [
  "TIDAK_DATANG",
  "TIDAK_SOPAN",
  "TIMBANG_TIDAK_JUJUR",
  "HARGA_TIDAK_SESUAI",
  "AMBIL_BARANG_LAIN",
  "ANCAMAN",
  "LAINNYA",
] as const;

const REASON_LABEL: Record<string, string> = {
  TIDAK_DATANG: "Tidak datang sesuai jadwal",
  TIDAK_SOPAN: "Berperilaku tidak sopan / kasar",
  TIMBANG_TIDAK_JUJUR: "Menimbang tidak jujur",
  HARGA_TIDAK_SESUAI: "Harga tidak sesuai kesepakatan",
  AMBIL_BARANG_LAIN: "Mengambil barang di luar kesepakatan",
  ANCAMAN: "Memberi ancaman atau intimidasi",
  LAINNYA: "Alasan lainnya",
};

const reportSchema = z.object({
  pickupId: z.string().min(1, "Pickup tidak valid."),
  reason: z.enum(VALID_REASONS, { message: "Pilih salah satu alasan laporan." }),
  description: z
    .string()
    .min(20, "Deskripsi minimal 20 karakter.")
    .max(1000, "Deskripsi maksimal 1000 karakter."),
});

async function uploadEvidence(file: File, userId: string): Promise<string | null> {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const MAX_BYTES = 5 * 1024 * 1024;

  if (!allowedTypes.includes(file.type) || file.size > MAX_BYTES || file.size === 0) {
    return null;
  }

  try {
    if (!hasSupabaseAdminEnv()) {
      const saved = await savePublicUpload({
        file,
        folder: ["reports", userId],
        prefix: Date.now().toString(),
      });
      return saved.publicUrl;
    }

    const client = createAdminClient();
    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "waste-photos";
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `reports/${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { error } = await client.storage
      .from(bucket)
      .upload(path, await file.arrayBuffer(), {
        contentType: file.type,
        upsert: false,
      });

    if (error) return null;

    const { data } = client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return null;
  }
}

export async function submitCollectorReport(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole(Role.USER);

  const parsed = reportSchema.safeParse({
    pickupId: formData.get("pickupId"),
    reason: formData.get("reason"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const pickup = await db.pickupRequest.findUnique({
    where: { id: parsed.data.pickupId },
    include: { collector: true },
  });

  if (!pickup || pickup.userId !== user.id) {
    return { success: false, message: "Pickup tidak ditemukan." };
  }
  if (!pickup.collectorId) {
    return { success: false, message: "Belum ada collector yang bisa dilaporkan." };
  }

  // Spam guard — max 1 laporan per pickup per user
  const existing = await db.chatReport.count({
    where: {
      reportedByUserId: user.id,
      thread: { pickupRequestId: pickup.id },
    },
  });
  if (existing > 0) {
    return {
      success: false,
      message: "Kamu sudah pernah melaporkan pickup ini. Satu laporan per transaksi.",
    };
  }

  // Upload evidence (non-blocking)
  const evidenceFile = formData.get("evidence");
  const evidenceUrl =
    evidenceFile instanceof File && evidenceFile.size > 0
      ? await uploadEvidence(evidenceFile, user.id)
      : null;

  // Need an active chat thread to attach the report
  const thread = await db.chatThread.findUnique({
    where: { pickupRequestId: pickup.id },
  });

  if (!thread) {
    return {
      success: false,
      message:
        "Laporan hanya bisa diajukan saat sesi chat aktif atau sudah pernah aktif. Coba gunakan laporan melalui halaman chat.",
    };
  }

  const reasonLabel = REASON_LABEL[parsed.data.reason] ?? parsed.data.reason;
  const fullReason = `[${reasonLabel}] ${parsed.data.description}${evidenceUrl ? ` | Bukti: ${evidenceUrl}` : ""}`;

  await db.chatReport.create({
    data: {
      threadId: thread.id,
      reportedByUserId: user.id,
      reportedUserId: pickup.collectorId,
      reason: fullReason,
    },
  });

  await createNotification({
    profileId: user.id,
    type: "LAPORAN_TERKIRIM",
    title: "Laporan berhasil dikirim",
    body: "Tim CoolWaste akan meninjau laporanmu dalam 1–3 hari kerja. Terima kasih telah melaporkan.",
    pickupRequestId: pickup.id,
  });

  return {
    success: true,
    message:
      "Laporan berhasil dikirim. Tim CoolWaste akan meninjaunya dalam 1–3 hari kerja dan menghubungimu jika diperlukan.",
  };
}

export async function submitUserReport(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const collector = await requireRole(Role.COLLECTOR);

  const parsed = reportSchema.safeParse({
    pickupId: formData.get("pickupId"),
    reason: formData.get("reason"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const pickup = await db.pickupRequest.findUnique({
    where: { id: parsed.data.pickupId },
  });

  if (!pickup || pickup.collectorId !== collector.id) {
    return { success: false, message: "Pickup tidak ditemukan." };
  }

  const existing = await db.chatReport.count({
    where: {
      reportedByUserId: collector.id,
      thread: { pickupRequestId: pickup.id },
    },
  });
  if (existing > 0) {
    return {
      success: false,
      message: "Kamu sudah pernah melaporkan pickup ini.",
    };
  }

  const evidenceFile = formData.get("evidence");
  const evidenceUrl =
    evidenceFile instanceof File && evidenceFile.size > 0
      ? await uploadEvidence(evidenceFile, collector.id)
      : null;

  const thread = await db.chatThread.findUnique({
    where: { pickupRequestId: pickup.id },
  });

  if (!thread) {
    return { success: false, message: "Tidak ada sesi chat yang ditemukan." };
  }

  const reasonLabel = REASON_LABEL[parsed.data.reason] ?? parsed.data.reason;
  const fullReason = `[${reasonLabel}] ${parsed.data.description}${evidenceUrl ? ` | Bukti: ${evidenceUrl}` : ""}`;

  await db.chatReport.create({
    data: {
      threadId: thread.id,
      reportedByUserId: collector.id,
      reportedUserId: pickup.userId,
      reason: fullReason,
    },
  });

  return {
    success: true,
    message: "Laporan berhasil dikirim dan akan ditinjau admin dalam 1–3 hari kerja.",
  };
}
