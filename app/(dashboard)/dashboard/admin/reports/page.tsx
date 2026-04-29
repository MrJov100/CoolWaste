import Link from "next/link";
import { Role } from "@prisma/client";
import { format } from "date-fns";
import { ArrowRight, FileWarning } from "lucide-react";

import { AdminTopbar } from "@/components/layout/admin-topbar";
import { requireRole } from "@/lib/auth";
import { getAdminReports } from "@/lib/data/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_COLOR: Record<string, string> = {
  OPEN: "text-red-400 bg-red-500/10 border-red-500/20",
  REVIEWED: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  RESOLVED: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Terbuka",
  REVIEWED: "Ditinjau",
  RESOLVED: "Terselesaikan",
};

const ROLE_LABEL: Record<string, string> = {
  USER: "Pengguna",
  COLLECTOR: "Collector",
  ADMIN: "Admin",
};

export default async function AdminReportsPage() {
  const profile = await requireRole(Role.ADMIN);
  const reports = await getAdminReports();

  const openReports = reports.filter((r) => r.status === "OPEN");
  const reviewedReports = reports.filter((r) => r.status === "REVIEWED");
  const resolvedReports = reports.filter((r) => r.status === "RESOLVED");

  // Stats: how many times each user appears as reporter vs reported
  const reporterCount: Record<string, { name: string; role: string; count: number }> = {};
  const reportedCount: Record<string, { name: string; role: string; count: number }> = {};

  for (const r of reports) {
    if (!reporterCount[r.reportedById]) {
      reporterCount[r.reportedById] = { name: r.reportedByName, role: r.reportedByRole, count: 0 };
    }
    reporterCount[r.reportedById].count++;

    if (!reportedCount[r.reportedUserId]) {
      reportedCount[r.reportedUserId] = { name: r.reportedUserName, role: r.reportedUserRole, count: 0 };
    }
    reportedCount[r.reportedUserId].count++;
  }

  const topReporters = Object.values(reporterCount).sort((a, b) => b.count - a.count).slice(0, 5);
  const topReported = Object.values(reportedCount).sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminTopbar profile={profile} />

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-10 space-y-10">
        <div className="space-y-2">
          <Badge variant="emerald" className="w-fit">Moderasi Konten</Badge>
          <h1
            className="text-3xl font-bold text-white"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            Laporan Pengguna
          </h1>
          <p className="text-slate-400">Tinjau dan tindaklanjuti laporan dari user dan collector.</p>
        </div>

        {/* Summary KPI */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-red-500/20 bg-red-500/10">
            <CardContent className="p-5">
              <p className="text-xs text-slate-400">Laporan Terbuka</p>
              <p className="mt-2 text-4xl font-bold text-red-400">{openReports.length}</p>
            </CardContent>
          </Card>
          <Card className="border-amber-500/20 bg-amber-500/10">
            <CardContent className="p-5">
              <p className="text-xs text-slate-400">Sedang Ditinjau</p>
              <p className="mt-2 text-4xl font-bold text-amber-400">{reviewedReports.length}</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/20 bg-emerald-500/10">
            <CardContent className="p-5">
              <p className="text-xs text-slate-400">Terselesaikan</p>
              <p className="mt-2 text-4xl font-bold text-emerald-400">{resolvedReports.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Melaporkan vs Dilaporkan stats */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 text-base font-semibold text-white">Paling Banyak Melaporkan</h2>
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="px-5 py-3 font-medium text-slate-400">Pengguna</th>
                      <th className="px-4 py-3 font-medium text-slate-400">Peran</th>
                      <th className="px-4 py-3 font-medium text-slate-400 text-right">Jumlah Laporan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {topReporters.length === 0 ? (
                      <tr><td colSpan={3} className="px-5 py-6 text-center text-slate-600">Belum ada data</td></tr>
                    ) : topReporters.map((u) => (
                      <tr key={u.name + u.role} className="hover:bg-white/[0.02]">
                        <td className="px-5 py-3 font-medium text-white">{u.name}</td>
                        <td className="px-4 py-3 text-slate-400">{ROLE_LABEL[u.role] ?? u.role}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                            {u.count}×
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">Paling Banyak Dilaporkan</h2>
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="px-5 py-3 font-medium text-slate-400">Pengguna</th>
                      <th className="px-4 py-3 font-medium text-slate-400">Peran</th>
                      <th className="px-4 py-3 font-medium text-slate-400 text-right">Jumlah Dilaporkan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {topReported.length === 0 ? (
                      <tr><td colSpan={3} className="px-5 py-6 text-center text-slate-600">Belum ada data</td></tr>
                    ) : topReported.map((u) => (
                      <tr key={u.name + u.role} className="hover:bg-white/[0.02]">
                        <td className="px-5 py-3 font-medium text-white">{u.name}</td>
                        <td className="px-4 py-3 text-slate-400">{ROLE_LABEL[u.role] ?? u.role}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-400">
                            {u.count}×
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Open reports */}
        <ReportSection title="Laporan Terbuka" reports={openReports} />
        <ReportSection title="Sedang Ditinjau" reports={reviewedReports} />
        <ReportSection title="Terselesaikan" reports={resolvedReports} resolved />
      </main>
    </div>
  );
}

type ReportItem = Awaited<ReturnType<typeof getAdminReports>>[number];

function ReportSection({
  title,
  reports,
  resolved = false,
}: {
  title: string;
  reports: ReportItem[];
  resolved?: boolean;
}) {
  if (reports.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-white">{title}</h2>
      <div className="space-y-3">
        {reports.map((report) => (
          <Card key={report.id} className={resolved ? "opacity-70" : ""}>
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <FileWarning className="h-4 w-4 text-red-400 shrink-0" />
                  <span className="font-semibold text-white">
                    {report.reportedByName}
                    <span className="text-slate-500 font-normal text-sm mx-1">melaporkan</span>
                    {report.reportedUserName}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[report.status] ?? "text-slate-400 bg-slate-500/10 border-slate-500/20"}`}
                  >
                    {STATUS_LABEL[report.status] ?? report.status}
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  Pickup: <span className="font-mono text-slate-300">{report.pickupRequestNo}</span>
                  {" · "}
                  {format(report.createdAt, "dd MMM yyyy, HH:mm")}
                </p>
                <p className="text-sm text-slate-300">
                  <span className="text-slate-500">Alasan: </span>
                  {report.reason}
                </p>
                {report.adminDecision && (
                  <p className="text-xs text-slate-400">
                    Keputusan: <span className="text-slate-300">{report.adminDecision}</span>
                  </p>
                )}
              </div>

              <div className="shrink-0">
                {resolved ? (
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                    Selesai
                  </span>
                ) : (
                  <Link href={`/dashboard/admin/reports/${report.id}`}>
                    <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                      Detail
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
