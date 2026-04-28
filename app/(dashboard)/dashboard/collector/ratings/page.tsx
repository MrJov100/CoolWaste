import Link from "next/link";
import { format } from "date-fns";
import { Role } from "@prisma/client";
import { ArrowLeft, Star, Users } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { requireRole } from "@/lib/auth";
import { getCollectorRatingsPage } from "@/lib/data/dashboard";

export default async function CollectorRatingsPage() {
  const profile = await requireRole(Role.COLLECTOR);
  const data = await getCollectorRatingsPage(profile.id);

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
          <p className="text-xs font-medium uppercase tracking-widest text-amber-400">Reputasi</p>
          <h1
            className="mt-1 text-2xl font-bold text-white"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            Ulasan Layanan
          </h1>
          <p className="mt-1 text-sm text-slate-400">Rating dan ulasan yang diberikan pengguna untuk layananmu</p>
        </div>

        {/* Stats summary */}
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-sm">
            <p className="text-xs text-slate-500">Rata-rata rating</p>
            <p className="mt-2 text-4xl font-bold text-white">
              {data.totalRatings ? data.average.toFixed(1) : "–"}
            </p>
            {data.totalRatings > 0 && (
              <p className="mt-1 text-base text-amber-400">
                {"★".repeat(Math.round(data.average))}{"☆".repeat(5 - Math.round(data.average))}
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-sm">
            <p className="text-xs text-slate-500">Total pengguna yang rating</p>
            <p className="mt-2 text-4xl font-bold text-white">{data.totalRatings}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <Users className="h-3 w-3" /> pengguna memberikan ulasan
            </p>
          </div>

          {/* Score distribution */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-sm">
            <p className="mb-3 text-xs text-slate-500">Distribusi bintang</p>
            {data.totalRatings > 0 ? (
              <div className="space-y-1.5">
                {([5, 4, 3, 2, 1] as const).map((star) => {
                  const count = data.distribution[star] ?? 0;
                  const pct = data.totalRatings > 0 ? (count / data.totalRatings) * 100 : 0;
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
            {data.reviews.length ? (
              data.reviews.map((review) => (
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
