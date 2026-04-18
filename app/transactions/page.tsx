import Link from "next/link";
import { ArrowLeft, Download, Wallet } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { TransactionFilters } from "@/components/records/records-filters";
import { TransactionsTable } from "@/components/records/transactions-table";
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
  if (resolvedSearchParams?.type) exportParams.set("type", resolvedSearchParams.type);
  if (resolvedSearchParams?.query) exportParams.set("query", resolvedSearchParams.query);

  const transactions = await getTransactionsForProfile(profile.id, profile.role, {
    type: resolvedSearchParams?.type,
    query: resolvedSearchParams?.query,
  });

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

      <main className="mx-auto max-w-4xl px-4 pb-24 pt-8 sm:px-6">
        {/* Header */}
        <section className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-slate-400 transition-all hover:border-white/20 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-400" />
                <h1
                  className="text-2xl font-bold text-white"
                  style={{ fontFamily: "var(--font-sora), sans-serif" }}
                >
                  Riwayat Transaksi
                </h1>
              </div>
              <p className="mt-0.5 text-sm text-slate-400">
                {transactions.length} transaksi ditemukan
              </p>
            </div>
          </div>
          <Link
            href={`/api/export/transactions${exportParams.size ? `?${exportParams.toString()}` : ""}`}
            className="flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2.5 text-sm text-slate-400 transition-all hover:border-white/20 hover:text-slate-200"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Link>
        </section>

        {/* Filters */}
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
