import Link from "next/link";
import { Role } from "@prisma/client";
import {
  ArrowRightLeft,
  BarChart3,
  CheckCircle2,
  FileWarning,
  Recycle,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";

import { AdminTopbar } from "@/components/layout/admin-topbar";
import { LeaderboardCard } from "@/components/dashboard/leaderboard-card";
import { WasteChart } from "@/components/dashboard/waste-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { verifyCollector } from "@/lib/actions/dashboard";
import { requireRole } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/dashboard";
import { getAdminStats } from "@/lib/data/admin";
import { formatCurrency } from "@/lib/utils";
import type { AdminDashboardData } from "@/lib/types";

const QUICK_LINKS = [
  {
    href: "/dashboard/admin/users",
    label: "Manajemen Pengguna",
    description: "Verifikasi collector, blokir/aktifkan akun",
    icon: Users,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    href: "/dashboard/admin/transactions",
    label: "Semua Transaksi",
    description: "Audit keuangan seluruh transaksi platform",
    icon: ArrowRightLeft,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    href: "/dashboard/admin/ratings",
    label: "Rating & Ulasan",
    description: "Pantau kualitas layanan collector",
    icon: Star,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  {
    href: "/dashboard/admin/reports",
    label: "Laporan Pengguna",
    description: "Tinjau dan tindaklanjuti laporan chat",
    icon: FileWarning,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  {
    href: "/dashboard/admin/carbon",
    label: "Karbon CO₂",
    description: "Estimasi emisi karbon yang berhasil diatasi",
    icon: Recycle,
    color: "text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
  },
  {
    href: "/dashboard/admin/stats",
    label: "Statistik Platform",
    description: "Ringkasan performa dan kesehatan sistem",
    icon: BarChart3,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
];

export default async function AdminDashboardPage() {
  const profile = await requireRole(Role.ADMIN);
  const [dashboardRaw, platformStats] = await Promise.all([
    getDashboardData(profile.id),
    getAdminStats(),
  ]);

  if (dashboardRaw.role !== "ADMIN") return null;
  const dashboard = dashboardRaw as AdminDashboardData;

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminTopbar profile={profile} />

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-10 space-y-10">

        {/* Header */}
        <section className="space-y-3">
          <Badge variant="emerald" className="w-fit">ADMIN — Panel Kontrol</Badge>
          <h1
            className="text-4xl font-bold text-white"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            Selamat datang, {profile.name}.
          </h1>
          <p className="max-w-2xl text-slate-400">
            Pantau seluruh operasi CoolWaste dari satu panel — transaksi, laporan, verifikasi collector,
            rating, hingga dampak karbon yang sudah berhasil diatasi.
          </p>
        </section>

        {/* Platform KPI */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Pengguna", value: platformStats.totalUsers.toString(), sub: "user terdaftar" },
            { label: "Pickup Selesai", value: platformStats.completedPickups.toString(), sub: `dari ${platformStats.totalPickups} total` },
            { label: "Nilai Transaksi", value: formatCurrency(platformStats.totalRevenue), sub: "gross value" },
            { label: "Completion Rate", value: `${platformStats.completionRate}%`, sub: "tingkat keberhasilan pickup" },
          ].map(({ label, value, sub }) => (
            <Card key={label}>
              <CardContent className="p-5">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="mt-2 text-3xl font-bold text-white">{value}</p>
                <p className="mt-1 text-xs text-slate-500">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Quick access modules */}
        <section>
          <h2 className="mb-5 text-xl font-semibold text-white">Modul Admin</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_LINKS.map(({ href, label, description, icon: Icon, color, bg, border }) => (
              <Link key={href} href={href} className="group">
                <Card className={`h-full ${border} transition-colors hover:${bg}`}>
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className={`shrink-0 rounded-xl ${bg} p-3 ${color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-white group-hover:text-white">{label}</p>
                      <p className="mt-1 text-sm text-slate-400">{description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Alerts */}
        {(platformStats.openReports > 0 || platformStats.pendingCollectors > 0) && (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">Perlu Perhatian</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {platformStats.openReports > 0 && (
                <Link href="/dashboard/admin/reports">
                  <Card className="border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors">
                    <CardContent className="flex items-center gap-3 p-5">
                      <FileWarning className="h-5 w-5 text-red-400" />
                      <div>
                        <p className="font-semibold text-white">{platformStats.openReports} laporan terbuka</p>
                        <p className="text-xs text-slate-400">Butuh tinjauan segera</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}
              {platformStats.pendingCollectors > 0 && (
                <Link href="/dashboard/admin/users">
                  <Card className="border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
                    <CardContent className="flex items-center gap-3 p-5">
                      <ShieldCheck className="h-5 w-5 text-amber-400" />
                      <div>
                        <p className="font-semibold text-white">{platformStats.pendingCollectors} collector pending</p>
                        <p className="text-xs text-slate-400">Menunggu verifikasi</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </div>
          </section>
        )}

        {/* Pending collectors (inline verify) */}
        {dashboard.pendingCollectors.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">Collector Menunggu Verifikasi</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dashboard.pendingCollectors.map((collector) => (
                <Card key={collector.id}>
                  <CardContent className="p-5">
                    <p className="font-semibold text-white">{collector.name}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {collector.serviceAreaLabel ?? collector.address ?? "Area belum diisi"}
                    </p>
                    <p className="text-xs text-slate-500">{collector.email}</p>
                    <form action={verifyCollector.bind(null, collector.id)} className="mt-4">
                      <Button type="submit" size="sm" className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                        <CheckCircle2 className="h-4 w-4" />
                        Verifikasi Collector
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Charts */}
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <WasteChart data={dashboard.wasteComposition} />
          <LeaderboardCard entries={dashboard.leaderboard} />
        </section>

      </main>
    </div>
  );
}
