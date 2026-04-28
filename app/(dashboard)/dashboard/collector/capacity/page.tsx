import Link from "next/link";
import { Role } from "@prisma/client";
import { ArrowLeft, CheckCircle2, Layers, MapPin, Scale } from "lucide-react";

import { CapacityEditForm } from "@/components/dashboard/capacity-edit-form";
import { Topbar } from "@/components/layout/topbar";
import { requireRole } from "@/lib/auth";
import { getCollectorCapacityPage } from "@/lib/data/dashboard";
import { normalizeWastePricingMap, WASTE_TYPE_OPTIONS } from "@/lib/constants";
import { formatCurrency, titleCase } from "@/lib/utils";

export default async function CollectorCapacityPage() {
  const profile = await requireRole(Role.COLLECTOR);
  const data = await getCollectorCapacityPage(profile.id);
  const wastePricing = normalizeWastePricingMap(data.wastePricing);

  const capacityPct =
    (data.dailyCapacityKg ?? 0) > 0
      ? Math.min((data.remainingCapacityKg / (data.dailyCapacityKg ?? 1)) * 100, 100)
      : 0;
  const capacityColor =
    capacityPct > 60 ? "bg-emerald-500" : capacityPct > 30 ? "bg-amber-500" : "bg-red-500";

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
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">Layanan</p>
          <h1
            className="mt-1 text-2xl font-bold text-white"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            Kapasitas & Area
          </h1>
          <p className="mt-1 text-sm text-slate-400">Info dan pengaturan kapasitas harian serta area layananmu</p>
        </div>

        {/* Current status cards */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-400" />
              <p className="text-xs font-medium text-slate-400">Area Layanan</p>
            </div>
            <p className="text-lg font-bold text-white">{data.serviceAreaLabel ?? "Belum diatur"}</p>
            <p className="mt-0.5 text-xs text-slate-500">Area pickup aktif</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <Scale className="h-4 w-4 text-blue-400" />
              <p className="text-xs font-medium text-slate-400">Kapasitas Hari Ini</p>
            </div>
            <p className="text-lg font-bold text-white">
              {data.remainingCapacityKg.toFixed(0)} / {(data.dailyCapacityKg ?? 0).toFixed(0)} kg
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full transition-all ${capacityColor}`}
                style={{ width: `${capacityPct}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              {data.currentLoadKg.toFixed(1)} kg terpakai dari total {(data.dailyCapacityKg ?? 0).toFixed(0)} kg
            </p>
          </div>
        </div>

        {/* Accepted waste types */}
        <div className="mb-6 rounded-3xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-sm">
          <p className="mb-3 text-xs font-medium text-slate-400">Jenis Sampah Diterima & Harga</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {WASTE_TYPE_OPTIONS.map((type) => {
              const upperType = type.toUpperCase() as keyof typeof wastePricing;
              const accepted = data.acceptedWasteTypes.includes(upperType as never);
              const price = wastePricing[upperType] ?? 0;
              return (
                <div
                  key={type}
                  className={`flex items-center gap-2 rounded-2xl border p-3 ${
                    accepted
                      ? "border-emerald-500/20 bg-emerald-500/5"
                      : "border-white/[0.06] bg-white/[0.02] opacity-40"
                  }`}
                >
                  <CheckCircle2
                    className={`h-4 w-4 shrink-0 ${accepted ? "text-emerald-400" : "text-slate-600"}`}
                  />
                  <div>
                    <p className="text-xs font-medium text-white">{titleCase(type)}</p>
                    {accepted && (
                      <p className="text-[10px] text-slate-500">{formatCurrency(price)}/kg</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-slate-600">
            Untuk mengubah jenis sampah dan harga, gunakan halaman{" "}
            <Link href="/settings" className="text-emerald-400 hover:underline">
              Pengaturan
            </Link>
            .
          </p>
        </div>

        {/* Edit form */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-sm">
          <div className="mb-5 flex items-center gap-2">
            <Layers className="h-5 w-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-semibold text-white">Edit Kapasitas & Area</h2>
              <p className="text-xs text-slate-500">Perubahan langsung memperbarui tampilan di dashboard user</p>
            </div>
          </div>
          <CapacityEditForm
            defaultDailyCapacityKg={data.dailyCapacityKg ?? 0}
            defaultServiceAreaLabel={data.serviceAreaLabel ?? ""}
          />
        </div>
      </main>
    </div>
  );
}
