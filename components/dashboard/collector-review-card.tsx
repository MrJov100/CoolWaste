import { format } from "date-fns";

import type { CollectorReviewEntry } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CollectorReviewCard({
  ratingAverage,
  ratingCount,
  reviews,
}: {
  ratingAverage: number;
  ratingCount: number;
  reviews: CollectorReviewEntry[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Rating dan review yang diterima collector</CardDescription>
        <CardTitle>Ulasan Layanan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm text-slate-400">Rata-rata rating</p>
            <p className="mt-2 text-3xl font-semibold text-white">{ratingCount ? ratingAverage.toFixed(1) : "-"}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm text-slate-400">Jumlah rating</p>
            <p className="mt-2 text-3xl font-semibold text-white">{ratingCount}</p>
          </div>
        </div>

        <div className="space-y-3">
          {reviews.length ? (
            reviews.map((review) => (
              <div key={review.id} className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white">
                    {"★".repeat(review.score)} <span className="text-slate-400">untuk {review.pickupRequestNo}</span>
                  </p>
                  <p className="text-xs text-slate-500">{format(review.createdAt, "dd MMM yyyy, HH:mm")}</p>
                </div>
                <p className="mt-2 text-xs text-slate-500">Pengirim dirahasiakan</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {review.comment?.trim().length ? review.comment : "User tidak menambahkan komentar."}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">Belum ada review yang masuk untuk collector ini.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
