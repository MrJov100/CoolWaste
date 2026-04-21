import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { AlertCircle, CheckCircle2, ChevronLeft, Clock, Flag, ShieldCheck } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { requireProfile } from "@/lib/auth";
import { getMyReports } from "@/lib/data/records";

const STATUS_CONFIG = {
  OPEN: {
    label: "Menunggu Tinjauan",
    color: "text-amber-400",
    bg: "bg-amber-950/20 border-amber-500/20",
    icon: Clock,
  },
  REVIEWED: {
    label: "Sedang Ditinjau",
    color: "text-blue-400",
    bg: "bg-blue-950/20 border-blue-500/20",
    icon: ShieldCheck,
  },
  RESOLVED: {
    label: "Selesai",
    color: "text-emerald-400",
    bg: "bg-emerald-950/20 border-emerald-500/20",
    icon: CheckCircle2,
  },
} as const;

export default async function MyReportsPage() {
  const profile = await requireProfile();
  const reports = await getMyReports(profile.id);

  const openCount = reports.filter((r) => r.status === "OPEN").length;
  const resolvedCount = reports.filter((r) => r.status === "RESOLVED").length;

  return (
    <div className="min-h-screen">
      <Topbar
        profile={{
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          saldo: profile.saldo,
          address: profile.address,
        }}
      />

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-10">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <Link
            href="/pickups"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Kembali ke Pickup
          </Link>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-3">
              <Badge variant="emerald" className="w-fit">
                <Flag className="mr-2 h-3.5 w-3.5" />
                Laporan Saya
              </Badge>
              <h1
                className="text-4xl font-semibold text-white"
                style={{ fontFamily: "var(--font-sora), sans-serif" }}
              >
                Status Laporan
              </h1>
              <p className="text-slate-400">
                Pantau perkembangan laporan yang kamu kirimkan ke tim CoolWaste.
              </p>
            </div>
          </div>

          {/* Summary */}
          {reports.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total", value: reports.length, color: "text-white" },
                { label: "Menunggu", value: openCount, color: "text-amber-400" },
                { label: "Selesai", value: resolvedCount, color: "text-emerald-400" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-center"
                >
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* List */}
        {reports.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/[0.06] bg-slate-900/40 px-8 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-800">
              <Flag className="h-7 w-7 text-slate-600" />
            </div>
            <div>
              <p className="text-base font-medium text-slate-300">Belum ada laporan</p>
              <p className="mt-1 text-sm text-slate-500">
                Laporan yang kamu kirimkan akan muncul di sini.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const cfg = STATUS_CONFIG[report.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.OPEN;
              const Icon = cfg.icon;
              const pickupNo = report.thread.pickupRequest.requestNo;

              return (
                <div
                  key={report.id}
                  className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-white">
                          Laporan terhadap {report.reportedUser.name}
                        </p>
                        <span
                          className={`flex items-center gap-1 rounded-xl border px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.color}`}
                        >
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        Pickup #{pickupNo} ·{" "}
                        {format(report.createdAt, "dd MMM yyyy, HH:mm", { locale: localeId })}
                      </p>

                      <p className="mt-3 line-clamp-2 text-sm text-slate-400">{report.reason}</p>

                      {report.adminDecision && (
                        <div className="mt-3 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 px-4 py-3">
                          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Keputusan Admin
                          </p>
                          <p className="mt-1 text-sm text-slate-300">{report.adminDecision}</p>
                          {report.reviewedAt && (
                            <p className="mt-1 text-xs text-slate-500">
                              Ditinjau {format(report.reviewedAt, "dd MMM yyyy", { locale: localeId })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-950/10 px-4 py-3">
          <p className="flex items-center gap-2 text-xs text-amber-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            Laporan ditinjau tim CoolWaste dalam 1–3 hari kerja. Kami akan menghubungimu jika diperlukan.
          </p>
        </div>
      </main>
    </div>
  );
}
