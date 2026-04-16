import { Trophy } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { LeaderboardEntry } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function LeaderboardCard({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Community leaderboard</CardDescription>
        <CardTitle>Pengguna paling berdampak</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.length ? (
          entries.map((entry, index) => (
            <div key={entry.id} className="flex items-start gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">
                      #{index + 1} {entry.name}
                    </p>
                    <p className="text-sm text-slate-400">{entry.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-emerald-300">{entry.totalWeight.toFixed(1)} kg</p>
                    <p className="text-xs text-slate-400">{formatCurrency(entry.totalIncome)}</p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-300">{entry.totalWeight.toFixed(1)} kg sampah berhasil dikelola.</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400">Belum ada data leaderboard.</p>
        )}
      </CardContent>
    </Card>
  );
}
