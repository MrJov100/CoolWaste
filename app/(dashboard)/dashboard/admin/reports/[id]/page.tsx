import Link from "next/link";
import { Role, VerificationState } from "@prisma/client";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  FileWarning,
  MessageSquare,
  Package,
  Send,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { notFound } from "next/navigation";

import { AdminTopbar } from "@/components/layout/admin-topbar";
import {
  blockUser,
  resolveReportWithAction,
  sendWarningToUser,
  unblockUser,
} from "@/lib/actions/admin";
import { requireRole } from "@/lib/auth";
import { getAdminReportDetail } from "@/lib/data/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const STATUS_COLOR: Record<string, string> = {
  OPEN: "text-red-400 bg-red-500/10 border-red-500/20",
  REVIEWED: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  RESOLVED: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Terbuka",
  REVIEWED: "Ditinjau",
  RESOLVED: "Terselesaikan",
};

const ROLE_LABEL: Record<string, string> = {
  USER: "Pengguna",
  COLLECTOR: "Collector",
  ADMIN: "Admin",
};

const WASTE_TYPE_LABEL: Record<string, string> = {
  PLASTIC: "Plastik",
  PAPER: "Kertas",
  ORGANIC: "Organik",
  METAL: "Metal",
  GLASS: "Kaca",
};

const SLOT_LABEL: Record<string, string> = {
  PAGI: "Pagi",
  SIANG: "Siang",
  SORE: "Sore",
};

export default async function AdminReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await requireRole(Role.ADMIN);
  const report = await getAdminReportDetail(params.id);

  if (!report) notFound();

  const isResolved = report.status === "RESOLVED";

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminTopbar profile={profile} />

      <main className="mx-auto max-w-4xl px-6 pb-20 pt-10 space-y-8">
        {/* Back */}
        <Link
          href="/dashboard/admin/reports"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Laporan
        </Link>

        {/* Header */}
        <div className="space-y-2">
          <Badge variant="emerald" className="w-fit">Detail Laporan</Badge>
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            Laporan #{report.id.slice(0, 8).toUpperCase()}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[report.status] ?? "text-slate-400"}`}
            >
              {STATUS_LABEL[report.status] ?? report.status}
            </span>
            <span className="text-sm text-slate-500">
              Dilaporkan {format(report.createdAt, "dd MMM yyyy, HH:mm")}
            </span>
            {report.reviewedAt && (
              <span className="text-sm text-slate-500">
                · Ditinjau {format(report.reviewedAt, "dd MMM yyyy, HH:mm")}
              </span>
            )}
          </div>
        </div>

        {/* Parties */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-amber-500/20">
            <CardContent className="p-5 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">Pelapor</p>
              <p className="font-semibold text-white">{report.reportedByName}</p>
              <p className="text-sm text-slate-400">{ROLE_LABEL[report.reportedByRole] ?? report.reportedByRole}</p>
            </CardContent>
          </Card>
          <Card className="border-red-500/20">
            <CardContent className="p-5 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-red-400">Dilaporkan</p>
              <p className="font-semibold text-white">{report.reportedUserName}</p>
              <p className="text-sm text-slate-400">{ROLE_LABEL[report.reportedUserRole] ?? report.reportedUserRole}</p>
              <p className="text-xs text-slate-500">
                Status akun:{" "}
                {report.reportedUserVerification === VerificationState.REJECTED ? (
                  <span className="text-red-400">Diblokir</span>
                ) : (
                  <span className="text-emerald-400">Aktif</span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Report info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileWarning className="h-4 w-4 text-red-400" />
              Informasi Laporan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-slate-500 mb-1">Alasan</p>
              <p className="text-white">{report.reason}</p>
            </div>
            {report.messageContent && (
              <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-4">
                <p className="text-xs font-semibold text-red-400 mb-1">Pesan yang dilaporkan</p>
                <p className="text-sm text-red-100">{report.messageContent}</p>
              </div>
            )}
            {report.adminDecision && (
              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
                <p className="text-xs font-semibold text-slate-400 mb-1">Keputusan Admin</p>
                <p className="text-sm text-white">{report.adminDecision}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pickup info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-emerald-400" />
              Detail Transaksi Pickup
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "No. Pickup", value: report.pickupRequestNo },
              { label: "Jenis Sampah", value: WASTE_TYPE_LABEL[report.pickupWasteType] ?? report.pickupWasteType },
              { label: "Status Pickup", value: report.pickupStatus?.replace(/_/g, " ") },
              { label: "Slot", value: SLOT_LABEL[report.pickupSlot] ?? report.pickupSlot },
              { label: "Area", value: report.pickupArea },
              { label: "Alamat", value: report.pickupAddress },
              { label: "Dibuat", value: format(report.pickupCreatedAt, "dd MMM yyyy, HH:mm") },
              {
                label: "Selesai",
                value: report.pickupCompletedAt
                  ? format(report.pickupCompletedAt, "dd MMM yyyy, HH:mm")
                  : "—",
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-sm text-white">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Chat transcript */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4 text-blue-400" />
              Transkrip Percakapan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.transcript.length === 0 ? (
              <p className="text-sm text-slate-500">Tidak ada pesan.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {report.transcript.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-xl p-3 text-sm ${
                      msg.isReported
                        ? "border border-red-500/30 bg-red-950/30"
                        : msg.isSystemMessage
                        ? "border border-white/5 bg-slate-900/40 italic"
                        : "border border-white/[0.06] bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">{msg.senderName}</span>
                      <span className="text-xs text-slate-500">{ROLE_LABEL[msg.senderRole] ?? msg.senderRole}</span>
                      <span className="text-xs text-slate-600">{format(msg.createdAt, "HH:mm")}</span>
                      {msg.isReported && (
                        <span className="ml-auto text-xs font-semibold text-red-400">⚑ Dilaporkan</span>
                      )}
                    </div>
                    <p className="text-slate-300">{msg.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin actions — locked if resolved */}
        {isResolved ? (
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="flex items-center gap-3 p-5">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
              <p className="text-sm text-emerald-300">
                Laporan ini sudah terselesaikan dan tidak dapat ditindak lebih lanjut.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Resolve report */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tindakan Laporan</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  action={resolveReportWithAction.bind(null, report.id)}
                  className="flex flex-wrap items-end gap-3"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400">Kategori Status</label>
                    <Select
                      name="status"
                      defaultValue={report.status === "OPEN" ? "REVIEWED" : report.status}
                    >
                      <option value="REVIEWED">Ditinjau — laporan sedang diproses</option>
                      <option value="RESOLVED">Terselesaikan — tindakan sudah diambil</option>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                    <label className="text-xs text-slate-400">Catatan keputusan admin</label>
                    <Input
                      name="decision"
                      defaultValue={report.adminDecision ?? ""}
                      placeholder="Tulis keputusan atau catatan..."
                      className="bg-white/[0.04] border-white/10 text-white placeholder:text-slate-600"
                    />
                  </div>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                    <Send className="h-4 w-4" />
                    Simpan &amp; Kirim Notifikasi ke Pelapor
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Block / unblock reported user */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Tindakan terhadap{" "}
                  <span className="text-amber-300">{report.reportedUserName}</span>
                  <span className="text-slate-500 font-normal text-sm">
                    ({ROLE_LABEL[report.reportedUserRole] ?? report.reportedUserRole})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Warning notification */}
                <form
                  action={sendWarningToUser.bind(null, report.reportedUserId)}
                  className="flex flex-wrap items-end gap-3"
                >
                  <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                    <label className="text-xs text-slate-400">Pesan peringatan untuk {report.reportedUserName}</label>
                    <Input
                      name="message"
                      defaultValue={`Akun Anda mendapatkan peringatan dari admin terkait laporan pada pickup ${report.pickupRequestNo}. Harap mematuhi ketentuan layanan.`}
                      className="bg-white/[0.04] border-white/10 text-white placeholder:text-slate-600"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="outline"
                    className="gap-2 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Kirim Peringatan
                  </Button>
                </form>

                {/* Block / unblock */}
                {report.reportedUserVerification === VerificationState.REJECTED ? (
                  <form action={unblockUser.bind(null, report.reportedUserId)}>
                    <Button
                      type="submit"
                      variant="outline"
                      className="gap-2 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Cabut Blokir {report.reportedUserName}
                    </Button>
                  </form>
                ) : (
                  <form action={blockUser.bind(null, report.reportedUserId)} className="flex flex-wrap items-end gap-3">
                    <input type="hidden" name="reason" value={report.reason} />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-400">Durasi blokir</label>
                      <select
                        name="durationDays"
                        className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white"
                        defaultValue="7"
                      >
                        <option value="1">1 hari</option>
                        <option value="3">3 hari</option>
                        <option value="7">7 hari</option>
                        <option value="30">30 hari</option>
                        <option value="90">90 hari</option>
                      </select>
                    </div>
                    <Button
                      type="submit"
                      variant="outline"
                      className="gap-2 border-red-500/40 text-red-400 hover:bg-red-500/10"
                    >
                      <ShieldX className="h-4 w-4" />
                      Blokir {report.reportedUserName}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
