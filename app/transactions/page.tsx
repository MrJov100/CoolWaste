import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { TransactionFilters } from "@/components/records/records-filters";
import { TransactionsTable } from "@/components/records/transactions-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBanner } from "@/components/ui/status-banner";
import { requireProfile } from "@/lib/auth";
import { getTransactionsForProfile } from "@/lib/data/records";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string; query?: string }>;
}) {
  const profile = await requireProfile();
  const resolvedSearchParams = await searchParams;
  const exportParams = new URLSearchParams();
  if (resolvedSearchParams?.type) {
    exportParams.set("type", resolvedSearchParams.type);
  }
  if (resolvedSearchParams?.query) {
    exportParams.set("query", resolvedSearchParams.query);
  }
  const transactions = await getTransactionsForProfile(profile.id, profile.role, {
    type: resolvedSearchParams?.type,
    query: resolvedSearchParams?.query,
  });

  return (
    <div className="min-h-screen">
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

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-10">
        <section className="mb-6">
          <StatusBanner
            tone="info"
            title="Halaman transaksi marketplace siap diaudit"
            message="Gunakan filter lalu export CSV untuk menunjukkan bahwa setiap penjualan sampah yang selesai tercatat rapi dan bisa dipakai sebagai laporan operasional."
          />
        </section>

        <section className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <Badge variant="emerald" className="w-fit">
              <ArrowLeftRight className="mr-2 h-3.5 w-3.5" />
              Transaction records
            </Badge>
            <h1 className="text-4xl font-semibold text-white" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
              Riwayat transaksi Cool Waste
            </h1>
            <p className="max-w-2xl text-slate-300">
              Halaman ini menampilkan jejak nilai ekonomi dari penjualan sampah yang berhasil diselesaikan antara user
              dan collector.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href={`/api/export/transactions${exportParams.size ? `?${exportParams.toString()}` : ""}`}>
              <Button variant="outline">Export CSV</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary">Kembali ke Dashboard</Button>
            </Link>
          </div>
        </section>

        <section className="mb-6">
          <TransactionFilters
            selectedType={resolvedSearchParams?.type}
            query={resolvedSearchParams?.query}
          />
        </section>

        <TransactionsTable items={transactions} />
      </main>
    </div>
  );
}
