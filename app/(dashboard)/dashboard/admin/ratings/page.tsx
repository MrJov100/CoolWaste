import { Role } from "@prisma/client";
import { format } from "date-fns";
import { Star } from "lucide-react";

import { AdminTopbar } from "@/components/layout/admin-topbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getAdminRatings } from "@/lib/data/admin";

function StarRow({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < score ? "fill-amber-400 text-amber-400" : "text-slate-700"}`}
        />
      ))}
    </div>
  );
}

export default async function AdminRatingsPage() {
  const profile = await requireRole(Role.ADMIN);
  const { ratings, average, totalCount, distribution } = await getAdminRatings();

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminTopbar profile={profile} />

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-10">
        <div className="mb-8 space-y-2">
          <Badge variant="emerald" className="w-fit">Monitoring Kualitas</Badge>
          <h1
            className="text-3xl font-bold text-white"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            Rating & Ulasan
          </h1>
          <p className="text-slate-400">Pantau kualitas layanan melalui semua rating yang diberikan user.</p>
        </div>

        {/* Summary cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card className="bg-amber-500/10 border-amber-500/20">
            <CardContent className="p-5">
              <p className="text-xs text-slate-400">Rata-rata Rating</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-4xl font-bold text-amber-400">{average.toFixed(1)}</span>
                <span className="mb-1 text-slate-400">/ 5.0</span>
              </div>
              <StarRow score={Math.round(average)} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-xs text-slate-400">Total Ulasan</p>
              <p className="mt-2 text-4xl font-bold text-white">{totalCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="mb-3 text-xs text-slate-400">Distribusi Bintang</p>
              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = distribution[star] ?? 0;
                  const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="w-4 text-xs text-slate-400">{star}</span>
                      <div className="flex-1 rounded-full bg-slate-800 h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-amber-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-xs text-slate-500">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Star className="h-5 w-5 text-amber-400" />
            <CardTitle className="text-white">Semua Rating ({totalCount})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="pb-3 pr-4 font-medium text-slate-400">Tanggal</th>
                    <th className="pb-3 pr-4 font-medium text-slate-400">No. Pickup</th>
                    <th className="pb-3 pr-4 font-medium text-slate-400">Dari</th>
                    <th className="pb-3 pr-4 font-medium text-slate-400">Untuk</th>
                    <th className="pb-3 pr-4 font-medium text-slate-400">Bintang</th>
                    <th className="pb-3 font-medium text-slate-400">Komentar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {ratings.map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 pr-4 text-slate-400">
                        {format(r.createdAt, "dd MMM yyyy")}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-mono text-xs text-slate-300">{r.pickupRequestNo}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <div>
                          <p className="font-medium text-white">{r.fromUserName}</p>
                          <p className="text-xs text-slate-500">{r.fromUserRole}</p>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div>
                          <p className="font-medium text-white">{r.toUserName}</p>
                          <p className="text-xs text-slate-500">{r.toUserRole}</p>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-1.5">
                          <StarRow score={r.score} />
                          <span className="text-xs text-slate-400">({r.score})</span>
                        </div>
                      </td>
                      <td className="py-3 max-w-xs text-slate-300">
                        {r.comment ? (
                          <p className="truncate">{r.comment}</p>
                        ) : (
                          <span className="text-slate-600 italic">Tidak ada komentar</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {ratings.length === 0 && (
                <p className="py-10 text-center text-sm text-slate-500">Belum ada rating.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
