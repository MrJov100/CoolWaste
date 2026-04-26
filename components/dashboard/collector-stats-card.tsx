import { CheckCircle2, RotateCcw, Truck, UserX, X } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CollectorPickupStats } from "@/lib/types";

function StatItem({
  icon: Icon,
  label,
  value,
  color,
  sublabel,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  sublabel?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-white">{value}</p>
        {sublabel && <p className="mt-0.5 text-[10px] text-slate-600">{sublabel}</p>}
      </div>
    </div>
  );
}

export function CollectorStatsCard({ stats }: { stats: CollectorPickupStats }) {
  const totalBatal = stats.totalBatalOlehUser + stats.totalBatalOlehCollector + stats.totalBatalOlehSistem;

  return (
    <Card>
      <CardHeader>
        <CardDescription>Rekap historis semua pickup yang pernah melibatkan collector ini</CardDescription>
        <CardTitle>Catatan Pickup Collector</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Top row — berhasil vs total pembatalan */}
        <div className="grid gap-3 sm:grid-cols-2">
          <StatItem
            icon={CheckCircle2}
            label="Pickup berhasil diselesaikan"
            value={stats.totalSelesai}
            color="bg-emerald-500/15 text-emerald-400"
            sublabel="pickup selesai dan dibayar"
          />
          <StatItem
            icon={X}
            label="Total pembatalan (semua pihak)"
            value={totalBatal}
            color="bg-red-500/15 text-red-400"
            sublabel="dibatalkan user, collector, atau sistem"
          />
        </div>

        {/* Breakdown pembatalan */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Rincian Pembatalan
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5">
              <UserX className="h-4 w-4 shrink-0 text-orange-400" />
              <div>
                <p className="text-[10px] text-slate-500">Oleh user</p>
                <p className="text-lg font-bold text-white">{stats.totalBatalOlehUser}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5">
              <Truck className="h-4 w-4 shrink-0 text-red-400" />
              <div>
                <p className="text-[10px] text-slate-500">Oleh collector</p>
                <p className="text-lg font-bold text-white">{stats.totalBatalOlehCollector}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5">
              <X className="h-4 w-4 shrink-0 text-slate-500" />
              <div>
                <p className="text-[10px] text-slate-500">Oleh sistem</p>
                <p className="text-lg font-bold text-white">{stats.totalBatalOlehSistem}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Penolakan batch */}
        <StatItem
          icon={RotateCcw}
          label="Penolakan pickup (reject batch)"
          value={stats.totalDitolakCollector}
          color="bg-amber-500/15 text-amber-400"
          sublabel="jumlah pickup dari batch yang pernah ditolak sebelum diterima"
        />

        {/* Ringkasan teks */}
        <div className="rounded-2xl border border-white/[0.06] bg-slate-900/40 px-4 py-3 text-xs text-slate-500 leading-relaxed">
          Dari <span className="text-white font-medium">{stats.totalSelesai + totalBatal}</span> pickup yang pernah melibatkan collector ini,{" "}
          <span className="text-emerald-400 font-medium">{stats.totalSelesai} berhasil</span> diselesaikan,{" "}
          <span className="text-red-400 font-medium">{totalBatal} dibatalkan</span>, dan{" "}
          <span className="text-amber-400 font-medium">{stats.totalDitolakCollector} ditolak</span> saat proses batching.
        </div>
      </CardContent>
    </Card>
  );
}
