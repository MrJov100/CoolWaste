import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, TrendingUp, Wallet } from "lucide-react";

import type { TransactionListEntry } from "@/lib/types";
import { formatCurrency, titleCase } from "@/lib/utils";

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  INCOME: { icon: "💰", color: "text-emerald-300", bg: "bg-emerald-500/10" },
  BONUS: { icon: "🎁", color: "text-amber-300", bg: "bg-amber-500/10" },
  ADJUSTMENT: { icon: "⚖️", color: "text-blue-300", bg: "bg-blue-500/10" },
};

export function TransactionsTable({ items }: { items: TransactionListEntry[] }) {
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-emerald-400" />
              <p className="text-xs text-slate-500">Total Nilai</p>
            </div>
            <p className="text-2xl font-bold text-emerald-300">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              <p className="text-xs text-slate-500">Jumlah Transaksi</p>
            </div>
            <p className="text-2xl font-bold text-white">{items.length}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 sm:col-span-1 col-span-2">
            <div className="mb-2 flex items-center gap-2">
              <p className="text-xs text-slate-500">Rata-rata per transaksi</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(Math.round(totalAmount / items.length))}
            </p>
          </div>
        </div>
      )}

      {/* Transaction list */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 overflow-hidden">
        <div className="border-b border-white/[0.06] px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-500">Riwayat Transaksi</p>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {items.length ? (
            items.map((item) => {
              const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.INCOME;
              return (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4 transition-all hover:bg-white/[0.02]">
                  {/* Icon */}
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xl ${cfg.bg}`}>
                    {cfg.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-white">{item.description}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                      <span>{item.userName}</span>
                      {item.collectorName && (
                        <>
                          <span>·</span>
                          <span>{item.collectorName}</span>
                        </>
                      )}
                      <span>·</span>
                      <span className={`font-medium ${cfg.color}`}>{titleCase(item.type)}</span>
                    </div>
                  </div>

                  {/* Amount + date */}
                  <div className="text-right shrink-0">
                    <p className={`text-base font-semibold ${cfg.color}`}>
                      +{formatCurrency(item.amount)}
                    </p>
                    <p className="text-xs text-slate-600">{format(item.createdAt, "dd MMM yyyy")}</p>
                  </div>

                  {/* Link to pickup */}
                  {item.pickupRequestId ? (
                    <Link
                      href={`/pickups/${item.pickupRequestId}`}
                      className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-200"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800">
                <Wallet className="h-6 w-6 text-slate-600" />
              </div>
              <p className="text-sm font-medium text-slate-400">Belum ada transaksi</p>
              <p className="text-xs text-slate-600">Transaksi muncul setelah pickup selesai dan dibayar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
