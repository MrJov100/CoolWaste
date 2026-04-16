import Link from "next/link";
import { format } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TransactionListEntry } from "@/lib/types";
import { formatCurrency, titleCase } from "@/lib/utils";

export function TransactionsTable({ items }: { items: TransactionListEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Financial log</CardDescription>
        <CardTitle>Riwayat transaksi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length ? (
          items.map((item) => (
            <div key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{item.description}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {item.userName}
                    {item.collectorName ? ` · ${item.collectorName}` : ""}
                    {` · ${titleCase(item.type)}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-semibold text-emerald-300">{formatCurrency(item.amount)}</p>
                  <p className="text-xs text-slate-500">{format(item.createdAt, "dd MMM yyyy, HH:mm")}</p>
                </div>
              </div>
              {item.pickupRequestId ? (
                <div className="mt-3">
                  <Link href={`/pickups/${item.pickupRequestId}`} className="text-sm text-emerald-300 hover:text-emerald-200">
                    Lihat detail pickup
                  </Link>
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400">Belum ada transaksi untuk ditampilkan.</p>
        )}
      </CardContent>
    </Card>
  );
}
