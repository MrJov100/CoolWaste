import Link from "next/link";
import { Role, VerificationState } from "@prisma/client";
import {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  Layers,
  Leaf,
  MapPin,
  Package,
  TrendingUp,
  Truck,
  Wallet,
} from "lucide-react";

import { CollectorListingForm } from "@/components/dashboard/collector-listing-form";
import { Topbar } from "@/components/layout/topbar";
import { requireRole } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/dashboard";

export default async function CollectorDashboardPage() {
  const profile = await requireRole(Role.COLLECTOR);
  const dashboard = await getDashboardData(profile.id);

  if (dashboard.role !== "COLLECTOR") {
    return null;
  }

  const verificationPending = profile.verificationState !== VerificationState.VERIFIED;
  const { summary, openBatches } = dashboard;

  const summaryIcons = [Package, TrendingUp, Truck, Wallet];
  const summaryColors = [
    "text-emerald-400 bg-emerald-500/10",
    "text-purple-400 bg-purple-500/10",
    "text-blue-400 bg-blue-500/10",
    "text-amber-400 bg-amber-500/10",
  ];

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

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6">

        {/* ── Verification warning ── */}
        {verificationPending && (
          <section className="mb-6">
            <div className="flex items-start gap-3 rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <div>
                <p className="text-sm font-semibold text-amber-300">Akun belum diverifikasi</p>
                <p className="mt-1 text-xs text-amber-200/70">
                  Collector belum ikut matching otomatis sampai admin memverifikasi area layanan, jenis sampah, harga, dan kapasitas harian.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── Hero greeting ── */}
        <section className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Selamat datang kembali 👋</p>
              <h1
                className="mt-1 text-3xl font-bold text-white sm:text-4xl"
                style={{ fontFamily: "var(--font-sora), sans-serif" }}
              >
                {profile.name}
              </h1>
              <p className="mt-2 max-w-xl text-slate-400">
                Terima batch, jalankan rute, dan selesaikan pembayaran dari satu dashboard.
              </p>
            </div>
            {profile.serviceAreaLabel && (
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3">
                <p className="text-xs text-slate-500">Area layanan aktif</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-white">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                  {profile.serviceAreaLabel}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── Summary metrics ── */}
        <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {summary.map((metric, i) => {
            const Icon = summaryIcons[i] ?? Leaf;
            const colorClass = summaryColors[i] ?? "text-slate-400 bg-slate-500/10";
            const [iconColor, bgColor] = colorClass.split(" ");
            return (
              <div
                key={metric.label}
                className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs text-slate-500">{metric.label}</p>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${bgColor}`}>
                    <Icon className={`h-4 w-4 ${iconColor}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{metric.value}</p>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">{metric.hint}</p>
              </div>
            );
          })}
        </section>

        {/* ── Quick links ── */}
        <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { href: "/pickups", icon: Package, label: "Semua Pickup", desc: "Riwayat & status" },
            { href: "/transactions", icon: Wallet, label: "Transaksi", desc: "Riwayat pembayaran" },
            { href: "/dashboard/collector/capacity", icon: Layers, label: "Kapasitas & Area", desc: "Info & edit layanan" },
            { href: "/dashboard/collector/performance", icon: BarChart2, label: "Rekap Kinerja", desc: "Statistik & rating" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col gap-2 rounded-3xl border border-white/10 bg-slate-900/40 p-4 transition-all hover:border-emerald-500/30 hover:bg-slate-900/80"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800 transition-all group-hover:bg-emerald-500/15">
                <item.icon className="h-5 w-5 text-slate-400 transition-all group-hover:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-slate-600 transition-all group-hover:translate-x-1 group-hover:text-emerald-400" />
            </Link>
          ))}
        </section>

        {/* ── Batch Pickup ── */}
        <section className="mb-8">
          <CollectorListingForm batches={openBatches} />
        </section>

      </main>
    </div>
  );
}
