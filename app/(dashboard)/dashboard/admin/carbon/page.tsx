import { Role } from "@prisma/client";
import { Leaf, Recycle, TreePine, Weight } from "lucide-react";

import { AdminTopbar } from "@/components/layout/admin-topbar";
import { requireRole } from "@/lib/auth";
import { getAdminCarbon } from "@/lib/data/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const WASTE_LABEL: Record<string, string> = {
  PLASTIC: "Plastik",
  PAPER: "Kertas",
  ORGANIC: "Organik",
  METAL: "Logam",
  GLASS: "Kaca",
};

const WASTE_COLOR: Record<string, string> = {
  PLASTIC: "text-blue-400 bg-blue-500/10",
  PAPER: "text-yellow-400 bg-yellow-500/10",
  ORGANIC: "text-green-400 bg-green-500/10",
  METAL: "text-orange-400 bg-orange-500/10",
  GLASS: "text-cyan-400 bg-cyan-500/10",
};

const WASTE_BAR: Record<string, string> = {
  PLASTIC: "bg-blue-400",
  PAPER: "bg-yellow-400",
  ORGANIC: "bg-green-400",
  METAL: "bg-orange-400",
  GLASS: "bg-cyan-400",
};

export default async function AdminCarbonPage() {
  const profile = await requireRole(Role.ADMIN);
  const data = await getAdminCarbon();

  const maxCo2 = Math.max(...data.byType.map((t) => t.co2), 1);

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminTopbar profile={profile} />

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-10">
        <div className="mb-8 space-y-2">
          <Badge variant="emerald" className="w-fit">Dampak Lingkungan</Badge>
          <h1
            className="text-3xl font-bold text-white"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            Perhitungan Karbon CO₂
          </h1>
          <p className="text-slate-400">
            Estimasi total emisi karbon yang berhasil diatasi melalui program daur ulang CoolWaste.
          </p>
        </div>

        {/* Hero stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-emerald-500/10 border-emerald-500/20 sm:col-span-2">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-2xl bg-emerald-500/20 p-4 text-emerald-400">
                <Leaf className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total CO₂ Diatasi</p>
                <p className="text-4xl font-bold text-emerald-400">{data.totalCo2.toFixed(2)}</p>
                <p className="text-slate-400">kilogram CO₂e</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl bg-teal-500/10 p-3 text-teal-400">
                <TreePine className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Setara Pohon Ditanam</p>
                <p className="text-3xl font-bold text-white">{data.treesEquivalent}</p>
                <p className="text-xs text-slate-500">pohon (21 kg CO₂/pohon/tahun)</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl bg-slate-700/50 p-3 text-slate-400">
                <Weight className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Total Berat Didaur Ulang</p>
                <p className="text-3xl font-bold text-white">{data.totalWeight.toFixed(1)}</p>
                <p className="text-xs text-slate-500">kilogram sampah</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* By waste type */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <Recycle className="h-5 w-5 text-emerald-400" />
              <CardTitle className="text-white">CO₂ per Jenis Sampah</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {data.byType
                .sort((a, b) => b.co2 - a.co2)
                .map((item) => (
                  <div key={item.type}>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${WASTE_COLOR[item.type] ?? "text-slate-400 bg-slate-700/50"}`}
                        >
                          {WASTE_LABEL[item.type] ?? item.type}
                        </span>
                        <span className="text-sm text-slate-400">{item.weight.toFixed(1)} kg</span>
                      </div>
                      <span className="font-semibold text-white">{item.co2.toFixed(2)} kg CO₂</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-2 rounded-full ${WASTE_BAR[item.type] ?? "bg-slate-500"}`}
                        style={{ width: `${(item.co2 / maxCo2) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}

              {data.byType.length === 0 && (
                <p className="text-center text-sm text-slate-500 py-6">
                  Belum ada data pickup selesai.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Top areas */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <Leaf className="h-5 w-5 text-emerald-400" />
              <CardTitle className="text-white">Top Area Dampak Terbesar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.topAreas.map((area, idx) => (
                  <div key={area.area} className="flex items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-400">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-white">{area.area}</p>
                    </div>
                    <span className="shrink-0 font-semibold text-emerald-400">
                      {area.co2.toFixed(2)} kg CO₂
                    </span>
                  </div>
                ))}

                {data.topAreas.length === 0 && (
                  <p className="text-center text-sm text-slate-500 py-6">
                    Belum ada data wilayah.
                  </p>
                )}
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-500 mb-1">Cara membaca angka ini</p>
                <p className="text-sm text-slate-300">
                  Setiap kilogram sampah yang didaur ulang mencegah emisi CO₂ sebesar:
                  Plastik 1.5×, Logam 2.0×, Kertas 1.0×, Organik 0.5×, Kaca 0.8×
                  dibandingkan berat aslinya.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary callout */}
        <Card className="mt-6 bg-gradient-to-r from-emerald-950/60 to-teal-950/40 border-emerald-500/20">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-500/20 p-3 text-emerald-400">
                  <TreePine className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Ringkasan dampak</p>
                  <p className="text-lg font-semibold text-white">
                    {data.completedPickups} pickup selesai · {data.totalWeight.toFixed(1)} kg · {data.totalCo2.toFixed(2)} kg CO₂e diatasi
                  </p>
                </div>
              </div>
              <div className="ml-auto text-right">
                <p className="text-2xl font-bold text-emerald-400">{data.treesEquivalent}</p>
                <p className="text-xs text-slate-400">pohon setara</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
