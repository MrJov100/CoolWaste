import { Role } from "@prisma/client";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  FileWarning,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";

import { AdminTopbar } from "@/components/layout/admin-topbar";
import { requireRole } from "@/lib/auth";
import { getAdminStats } from "@/lib/data/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function AdminStatsPage() {
  const profile = await requireRole(Role.ADMIN);
  const stats = await getAdminStats();

  const METRICS = [
    {
      label: "Total Pengguna",
      value: stats.totalUsers.toString(),
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      hint: "Akun user yang terdaftar",
    },
    {
      label: "Total Collector",
      value: stats.totalCollectors.toString(),
      icon: Users,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      hint: "Collector terdaftar di sistem",
    },
    {
      label: "Collector Pending",
      value: stats.pendingCollectors.toString(),
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      hint: "Menunggu verifikasi admin",
    },
    {
      label: "Total Pickup",
      value: stats.totalPickups.toString(),
      icon: BarChart3,
      color: "text-slate-300",
      bg: "bg-slate-700/30",
      border: "border-slate-700/40",
      hint: "Semua request pickup masuk",
    },
    {
      label: "Pickup Selesai",
      value: stats.completedPickups.toString(),
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      hint: "Pickup sudah dibayar dan selesai",
    },
    {
      label: "Pickup Menunggu",
      value: stats.pendingPickups.toString(),
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      hint: "Sedang menunggu matching collector",
    },
    {
      label: "Pickup Dibatalkan",
      value: stats.cancelledPickups.toString(),
      icon: XCircle,
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      hint: "Pickup yang dibatalkan user/sistem",
    },
    {
      label: "Laporan Terbuka",
      value: stats.openReports.toString(),
      icon: FileWarning,
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      hint: "Laporan chat yang belum ditinjau",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminTopbar profile={profile} />

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-10">
        <div className="mb-8 space-y-2">
          <Badge variant="emerald" className="w-fit">Ringkasan Platform</Badge>
          <h1
            className="text-3xl font-bold text-white"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            Statistik Platform
          </h1>
          <p className="text-slate-400">
            Gambaran menyeluruh kesehatan dan performa operasi CoolWaste.
          </p>
        </div>

        {/* Revenue highlight */}
        <Card className="mb-8 bg-gradient-to-r from-emerald-950/60 to-teal-950/40 border-emerald-500/20">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-emerald-500/20 p-4 text-emerald-400">
                <TrendingUp className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Nilai Transaksi Platform</p>
                <p className="text-4xl font-bold text-emerald-400">
                  {formatCurrency(stats.totalRevenue)}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Dari {stats.completedPickups} pickup yang berhasil diselesaikan
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Tingkat Keberhasilan</p>
              <p className="text-5xl font-bold text-white">{stats.completionRate}%</p>
              <p className="text-xs text-slate-500 mt-1">pickup selesai / total pickup</p>
            </div>
          </CardContent>
        </Card>

        {/* Metrics grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map(({ label, value, icon: Icon, color, bg, border, hint }) => (
            <Card key={label} className={`${bg} ${border}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className={`mt-2 text-4xl font-bold ${color}`}>{value}</p>
                    <p className="mt-1 text-xs text-slate-500">{hint}</p>
                  </div>
                  <div className={`rounded-xl ${bg} p-2.5 ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Health indicator */}
        {stats.openReports > 0 && (
          <Card className="mt-6 border-amber-500/20 bg-amber-500/5">
            <CardContent className="flex items-center gap-4 p-5">
              <AlertTriangle className="h-6 w-6 shrink-0 text-amber-400" />
              <div>
                <p className="font-semibold text-white">
                  {stats.openReports} laporan terbuka perlu ditinjau
                </p>
                <p className="text-sm text-slate-400">
                  Tinjau laporan dari pengguna di halaman{" "}
                  <a href="/dashboard/admin/reports" className="text-emerald-400 hover:underline">
                    Laporan
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {stats.pendingCollectors > 0 && (
          <Card className="mt-4 border-blue-500/20 bg-blue-500/5">
            <CardContent className="flex items-center gap-4 p-5">
              <Clock className="h-6 w-6 shrink-0 text-blue-400" />
              <div>
                <p className="font-semibold text-white">
                  {stats.pendingCollectors} collector menunggu verifikasi
                </p>
                <p className="text-sm text-slate-400">
                  Verifikasi collector di halaman{" "}
                  <a href="/dashboard/admin/users" className="text-emerald-400 hover:underline">
                    Manajemen Pengguna
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
