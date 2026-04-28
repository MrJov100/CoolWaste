import Link from "next/link";
import { format } from "date-fns";
import { Role } from "@prisma/client";
import { ArrowLeft, CheckCircle2, RotateCcw, Star, Truck, UserX, Users, X, Zap } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { requireRole } from "@/lib/auth";
import { getCollectorPerformancePage } from "@/lib/data/dashboard";

export default async function CollectorPerformancePage() {
  const profile = await requireRole(Role.COLLECTOR);
  const data = await getCollectorPerformancePage(profile.id);
  const { stats, ratings } = data;
  const totalBatal =
    stats.totalBatalOlehUser + stats.totalBatalOlehCollector + stats.totalBatalOlehSistem;

  return (
    <div className="min-h-screen bg-slate-950">
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

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/dashboard/collector"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-400 transition-all hover:border-white/20 hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">Rekap Kinerja</p>
          <h1
            className="mt-1 text-2xl font-bold text-white"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            Catatan Pickup & Rating
          </h1>
          <p className="mt-1 text-sm text-slate-400">Historis semua pickup dan ulasan dari pengguna</p>
        </div>

        {/* ── Pickup stats ── */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Pickup berhasil</p>
              <p className="mt-1 text-3xl font-bold text-white">{stats.totalSelesai}</p>
              <p className="mt-0.5 text-[10px] text-slate-600">pickup selesai dan dibayar</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-3xl border border-red-500/20 bg-red-500/5 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-500/15 text-red-400">
              <X className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total pembatalan</p>
              <p className="mt-1 text-3xl font-bold text-white">{totalBatal}</p>
              <p className="mt-0.5 text-[10px] text-slate-600">dari semua pihak</p>
            </div>
          </div>
        </div>

        {/* Cancellation breakdown */}
        <div className="mb-6 rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-sm">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Rincian Pembatalan</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: UserX, label: "Oleh user", value: stats.totalBatalOlehUser, color: "text-orange-400", bg: "bg-orange-500/10" },
              { icon: Truck, label: "Oleh collector", value: stats.totalBatalOlehCollector, color: "text-red-400", bg: "bg-red-500/10" },
              { icon: Zap, label: "Oleh sistem", value: stats.totalBatalOlehSistem, color: "text-slate-400", bg: "bg-slate-500/10" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.bg}`}>
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">{item.label}</p>
                  <p className="text-2xl font-bold text-white">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rejection stat */}
        <div className="mb-8 flex items-start gap-4 rounded-3xl border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
            <RotateCcw className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Penolakan batch</p>
            <p className="mt-1 text-3xl font-bold text-white">{stats.totalDitolakCollector}</p>
            <p className="mt-0.5 text-xs text-slate-600">pickup dari batch yang pernah ditolak</p>
          </div>
        </div>

        {/* ── Rating section ── */}
        <div className="mb-2">
          <p className="text-xs font-medium uppercase tracking-widest text-amber-400">Reputasi</p>
          <h2
            className="mt-1 text-xl font-bold text-white"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            Ulasan Layanan
          </h2>
          <p className="mt-1 text-sm text-slate-400">Rating dan ulasan yang diberikan pengguna untuk layananmu</p>
        </div>

        {/* Rating stats */}
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-sm">
            <p className="text-xs text-slate-500">Rata-rata rating</p>
            <p className="mt-2 text-4xl font-bold text-white">
              {ratings.totalRatings ? ratings.average.toFixed(1) : "–"}
            </p>
            {ratings.totalRatings > 0 && (
              <p className="mt-1 text-base text-amber-400">
                {"★".repeat(Math.round(ratings.average))}{"☆".repeat(5 - Math.round(ratings.average))}
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-sm">
            <p className="text-xs text-slate-500">Total pengguna yang rating</p>
            <p className="mt-2 text-4xl font-bold text-white">{ratings.totalRatings}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <Users className="h-3 w-3" /> pengguna memberikan ulasan
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-sm">
            <p className="mb-3 text-xs text-slate-500">Distribusi bintang</p>
            {ratings.totalRatings > 0 ? (
              <div className="space-y-1.5">
                {([5, 4, 3, 2, 1] as const).map((star) => {
                  const count = ratings.distribution[star] ?? 0;
                  const pct = ratings.totalRatings > 0 ? (count / ratings.totalRatings) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="w-3 text-right text-xs text-amber-400">{star}</span>
                      <Star className="h-3 w-3 shrink-0 text-amber-400" />
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-amber-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-5 text-right text-xs text-slate-500">{count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-600">Belum ada data</p>
            )}
          </div>
        </div>

        {/* Reviews list */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-sm">
          <h2 className="mb-4 text-base font-semibold text-white">Semua Ulasan</h2>
          <div className="space-y-3">
            {ratings.reviews.length ? (
              ratings.reviews.map((review) => (
                <div key={review.id} className="rounded-2xl border border-white/[0.07] bg-slate-950/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-amber-300">
                      {"★".repeat(review.score)}{"☆".repeat(5 - review.score)}
                    </p>
                    <p className="text-xs text-slate-600">{format(review.createdAt, "dd MMM yyyy, HH:mm")}</p>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                    {review.comment?.trim().length ? review.comment : "Tidak ada komentar."}
                  </p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 py-12 text-center">
                <Star className="h-8 w-8 text-slate-700" />
                <p className="text-sm text-slate-500">Belum ada ulasan masuk</p>
                <p className="text-xs text-slate-600">Ulasan akan muncul setelah pickup berhasil diselesaikan</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
