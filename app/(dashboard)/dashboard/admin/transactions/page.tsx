import { Role } from "@prisma/client";
import { format } from "date-fns";
import { ArrowRightLeft, TrendingUp } from "lucide-react";

import { AdminTopbar } from "@/components/layout/admin-topbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getAdminTransactions } from "@/lib/data/admin";
import { formatCurrency } from "@/lib/utils";

const WASTE_LABEL: Record<string, string> = {
  PLASTIC: "Plastik",
  PAPER: "Kertas",
  ORGANIC: "Organik",
  METAL: "Logam",
  GLASS: "Kaca",
};

export default async function AdminTransactionsPage() {
  const profile = await requireRole(Role.ADMIN);
  const { transactions, totalAmount } = await getAdminTransactions();

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminTopbar profile={profile} />

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Badge variant="emerald" className="w-fit">Audit Keuangan</Badge>
            <h1
              className="text-3xl font-bold text-white"
              style={{ fontFamily: "var(--font-sora), sans-serif" }}
            >
              Semua Transaksi
            </h1>
            <p className="text-slate-400">
              Riwayat lengkap transaksi seluruh pengguna dan collector.
            </p>
          </div>

          <Card className="bg-emerald-500/10 border-emerald-500/20">
            <CardContent className="flex items-center gap-3 p-5">
              <div className="rounded-xl bg-emerald-500/20 p-3 text-emerald-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Total Nilai Transaksi</p>
                <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalAmount)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <ArrowRightLeft className="h-5 w-5 text-emerald-400" />
            <CardTitle className="text-white">Riwayat Transaksi ({transactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="pb-3 pr-4 font-medium text-slate-400">Tanggal</th>
                    <th className="pb-3 pr-4 font-medium text-slate-400">No. Pickup</th>
                    <th className="pb-3 pr-4 font-medium text-slate-400">User</th>
                    <th className="pb-3 pr-4 font-medium text-slate-400">Collector</th>
                    <th className="pb-3 pr-4 font-medium text-slate-400">Jenis Sampah</th>
                    <th className="pb-3 pr-4 font-medium text-slate-400">Tipe</th>
                    <th className="pb-3 font-medium text-slate-400 text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 pr-4 text-slate-400">
                        {format(t.createdAt, "dd MMM yyyy")}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-mono text-xs text-slate-300">
                          {t.pickupRequestNo ?? "—"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div>
                          <p className="font-medium text-white">{t.userName}</p>
                          <p className="text-xs text-slate-500">{t.userEmail}</p>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-slate-300">
                        {t.collectorName ?? <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-3 pr-4">
                        {t.wasteType ? (
                          <span className="rounded-lg bg-teal-500/10 px-2 py-1 text-xs text-teal-400">
                            {WASTE_LABEL[t.wasteType] ?? t.wasteType}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="rounded-lg bg-slate-700/50 px-2 py-1 text-xs text-slate-300">
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3 text-right font-semibold text-emerald-400">
                        {formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {transactions.length === 0 && (
                <p className="py-10 text-center text-sm text-slate-500">Belum ada transaksi.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
