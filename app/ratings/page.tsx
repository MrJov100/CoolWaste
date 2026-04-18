import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Star, Truck } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { submitRating } from "@/lib/actions/dashboard";
import { requireRole } from "@/lib/auth";
import { getRatingsForUser } from "@/lib/data/records";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { titleCase } from "@/lib/utils";

const WASTE_ICONS: Record<string, string> = {
  PLASTIC: "🧴",
  PAPER: "📄",
  ORGANIC: "🌿",
  METAL: "🔩",
  GLASS: "🫙",
};

function StarDisplay({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= score ? "fill-amber-400 text-amber-400" : "text-slate-700"}`}
        />
      ))}
    </div>
  );
}

export default async function RatingsPage() {
  const profile = await requireRole(Role.USER);
  const ratingsData = await getRatingsForUser(profile.id);

  const unrated = ratingsData.filter((item) => !item.rating);
  const rated = ratingsData.filter((item) => !!item.rating);

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
        {/* Header */}
        <section className="mb-8 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-slate-400 transition-all hover:border-white/20 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-400" />
              <h1
                className="text-2xl font-bold text-white"
                style={{ fontFamily: "var(--font-sora), sans-serif" }}
              >
                Rating Pickup
              </h1>
            </div>
            <p className="mt-0.5 text-sm text-slate-400">
              {unrated.length} belum diberi rating · {rated.length} sudah dinilai
            </p>
          </div>
        </section>

        {/* Belum dirating */}
        {unrated.length > 0 && (
          <section className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-amber-300">Menunggu Rating ({unrated.length})</h2>
            </div>
            <div className="space-y-4">
              {unrated.map((item) => (
                <div
                  key={item.pickupId}
                  className="rounded-3xl border border-amber-500/20 bg-amber-950/10 p-5"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{WASTE_ICONS[item.wasteType] ?? "♻️"}</span>
                        <p className="font-semibold text-white">{titleCase(item.wasteType)}</p>
                        <span className="text-xs text-slate-500">#{item.requestNo}</span>
                      </div>
                      {item.collectorName && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                          <Truck className="h-3 w-3" /> {item.collectorName}
                        </p>
                      )}
                      {item.completedAt && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          Selesai {format(item.completedAt, "dd MMM yyyy, HH:mm")}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/pickups/${item.pickupId}`}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-200"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <form action={submitRating.bind(null, item.pickupId)} className="space-y-3">
                    <div>
                      <label className="mb-1.5 block text-xs text-slate-400">Beri bintang</label>
                      <Select name="score" required defaultValue="5">
                        <option value="5">⭐⭐⭐⭐⭐ Bagus Sekali</option>
                        <option value="4">⭐⭐⭐⭐ Bagus</option>
                        <option value="3">⭐⭐⭐ Biasa Saja</option>
                        <option value="2">⭐⭐ Kurang</option>
                        <option value="1">⭐ Sangat Buruk</option>
                      </Select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs text-slate-400">Komentar (opsional)</label>
                      <Input name="comment" placeholder="Bagaimana pelayanan collector?" />
                    </div>
                    <Button type="submit" size="sm" className="w-full">
                      Kirim Rating
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sudah dirating */}
        {rated.length > 0 && (
          <section>
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-emerald-300">Sudah Dirating ({rated.length})</h2>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 divide-y divide-white/[0.04] overflow-hidden">
              {rated.map((item) => (
                <div key={item.pickupId} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-all">
                  <span className="text-2xl">{WASTE_ICONS[item.wasteType] ?? "♻️"}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{titleCase(item.wasteType)}</p>
                      <span className="text-xs text-slate-600">#{item.requestNo}</span>
                    </div>
                    {item.collectorName && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                        <Truck className="h-3 w-3" /> {item.collectorName}
                      </p>
                    )}
                    {item.rating?.comment && (
                      <p className="mt-1 text-xs text-slate-400 italic">&ldquo;{item.rating.comment}&rdquo;</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {item.rating && <StarDisplay score={item.rating.score} />}
                    {item.completedAt && (
                      <p className="mt-1 text-xs text-slate-600">{format(item.completedAt, "dd MMM yyyy")}</p>
                    )}
                  </div>
                  <Link
                    href={`/pickups/${item.pickupId}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-200"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {ratingsData.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-white/10 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-800">
              <Star className="h-7 w-7 text-slate-600" />
            </div>
            <div>
              <p className="font-medium text-slate-400">Belum ada pickup yang selesai</p>
              <p className="mt-1 text-sm text-slate-600">Rating muncul setelah pickup pertamamu berhasil diselesaikan</p>
            </div>
            <Link
              href="/dashboard"
              className="rounded-2xl bg-emerald-500/15 px-4 py-2.5 text-sm font-medium text-emerald-300 hover:bg-emerald-500/25"
            >
              Buat Pickup Pertama
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
