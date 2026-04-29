"use server";

import { ChatReportStatus, Role, VerificationState } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

function revalidateAdmin() {
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/admin/reports");
  revalidatePath("/dashboard/admin/reports", "layout");
}

export async function blockUser(userId: string, formData: FormData) {
  await requireRole(Role.ADMIN);

  const reason = (formData.get("reason") as string | null)?.trim() || "Pelanggaran ketentuan layanan";
  const durationDays = Number(formData.get("durationDays") ?? 7);

  const unblockedAt = new Date();
  unblockedAt.setDate(unblockedAt.getDate() + durationDays);

  await db.profile.update({
    where: { id: userId },
    data: {
      verificationState: VerificationState.REJECTED,
    },
  });

  await createNotification({
    profileId: userId,
    type: "LAPORAN_TERKIRIM",
    title: "Akun Anda telah diblokir sementara",
    body: `Akun Anda diblokir selama ${durationDays} hari. Alasan: ${reason}. Berlaku hingga ${unblockedAt.toLocaleDateString("id-ID")}.`,
  });

  revalidateAdmin();
}

export async function unblockUser(userId: string) {
  await requireRole(Role.ADMIN);

  await db.profile.update({
    where: { id: userId },
    data: {
      verificationState: VerificationState.VERIFIED,
    },
  });

  await createNotification({
    profileId: userId,
    type: "LAPORAN_TERKIRIM",
    title: "Blokir akun telah dicabut",
    body: "Akun Anda telah diaktifkan kembali oleh admin.",
  });

  revalidateAdmin();
}

export async function resolveReport(reportId: string, formData: FormData) {
  await requireRole(Role.ADMIN);

  const status = (formData.get("status") as ChatReportStatus | null) ?? ChatReportStatus.REVIEWED;
  const decision = (formData.get("decision") as string | null)?.trim() ?? "";

  await db.chatReport.update({
    where: { id: reportId },
    data: {
      status,
      adminDecision: decision || null,
      reviewedAt: new Date(),
    },
  });

  revalidatePath("/dashboard/admin/reports");
  revalidatePath("/dashboard/admin");
}

export async function rejectCollector(collectorId: string) {
  await requireRole(Role.ADMIN);

  await db.profile.update({
    where: { id: collectorId },
    data: { verificationState: VerificationState.REJECTED },
  });

  await createNotification({
    profileId: collectorId,
    type: "LAPORAN_TERKIRIM",
    title: "Pendaftaran collector ditolak",
    body: "Pendaftaran Anda sebagai collector tidak memenuhi syarat. Hubungi admin untuk informasi lebih lanjut.",
  });

  revalidateAdmin();
}

export async function deleteUser(userId: string) {
  await requireRole(Role.ADMIN);

  await db.profile.delete({ where: { id: userId } });

  revalidateAdmin();
}

export async function resolveReportWithAction(
  reportId: string,
  formData: FormData,
) {
  await requireRole(Role.ADMIN);

  const status =
    (formData.get("status") as ChatReportStatus | null) ??
    ChatReportStatus.REVIEWED;
  const decision = (formData.get("decision") as string | null)?.trim() ?? "";

  const report = await db.chatReport.update({
    where: { id: reportId },
    data: {
      status,
      adminDecision: decision || null,
      reviewedAt: new Date(),
    },
    include: {
      reportedByUser: { select: { id: true, name: true } },
      reportedUser: { select: { id: true, name: true } },
    },
  });

  // Notify the reporter that their report has been reviewed
  await createNotification({
    profileId: report.reportedByUser.id,
    type: "LAPORAN_TERKIRIM",
    title: "Laporan Anda telah ditinjau",
    body: `Laporan yang Anda kirimkan telah ditinjau oleh admin. Tindakan admin: ${decision || status}.`,
  });

  revalidatePath("/dashboard/admin/reports");
  revalidatePath(`/dashboard/admin/reports/${reportId}`);
  revalidatePath("/dashboard/admin");
}

export async function sendWarningToUser(userId: string, formData: FormData) {
  await requireRole(Role.ADMIN);

  const message =
    (formData.get("message") as string | null)?.trim() ||
    "Akun Anda mendapatkan peringatan dari admin karena pelanggaran ketentuan layanan.";

  await createNotification({
    profileId: userId,
    type: "LAPORAN_TERKIRIM",
    title: "Peringatan dari Admin",
    body: message,
  });

  revalidatePath("/dashboard/admin/reports");
}
