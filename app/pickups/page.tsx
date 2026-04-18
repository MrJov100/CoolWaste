import Link from "next/link";
import { ArrowLeft, Download, Filter, Package } from "lucide-react";

import { MarketplaceOfferList } from "@/components/dashboard/marketplace-offer-list";
import { PickupAlertDialog } from "@/components/dashboard/pickup-alert-dialog";
import { Topbar } from "@/components/layout/topbar";
import { PickupFilters } from "@/components/records/records-filters";
import { requireProfile } from "@/lib/auth";
import { getPickupsForProfile } from "@/lib/data/records";

const STATUS_TABS = [
  { value: "", label: "Semua" },
  { value: "MENUNGGU_MATCHING", label: "Menunggu" },
  { value: "TERJADWAL", label: "Terjadwal" },
  { value: "DALAM_PERJALANAN", label: "Perjalanan" },
  { value: "SELESAI", label: "Selesai" },
  { value: "DIBATALKAN", label: "Dibatalkan" },
];

export default async function PickupsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const profile = await requireProfile();
  const resolvedSearchParams = await searchParams;
  const selectedStatus = resolvedSearchParams?.status ?? "";
  const exportParams = new URLSearchParams();
  if (selectedStatus) exportParams.set("status", selectedStatus);

  const offers = await getPickupsForProfile(profile.id, profile.role, {
    status: selectedStatus || undefined,
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

      <main className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6">
        {profile.role === "USER" ? <PickupAlertDialog pickups={offers} /> : null}

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
                <Package className="h-5 w-5 text-emerald-400" />
                <h1
                  className="text-2xl font-bold text-white"
                  style={{ fontFamily: "var(--font-sora), sans-serif" }}
                >
                  Riwayat Pickup
                </h1>
              </div>
              <p className="mt-0.5 text-sm text-slate-400">
                {offers.length} request{offers.length !== 1 ? "" : ""} ditemukan
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/api/export/pickups${exportParams.size ? `?${exportParams.toString()}` : ""}`}
              className="flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2.5 text-sm text-slate-400 transition-all hover:border-white/20 hover:text-slate-200"
            >
              <Download className="h-4 w-4" /> Export CSV
            </Link>
            <Link
              href="/transactions"
              className="flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2.5 text-sm text-slate-400 transition-all hover:border-white/20 hover:text-slate-200"
            >
              Transaksi
            </Link>
          </div>
        </section>

        {/* Status filter tabs */}
        <section className="mb-6">
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="h-4 w-4 text-slate-500" />
            {STATUS_TABS.map((tab) => (
              <Link
                key={tab.value}
                href={tab.value ? `/pickups?status=${tab.value}` : "/pickups"}
                className={`rounded-2xl px-4 py-2 text-sm font-medium transition-all ${
                  selectedStatus === tab.value
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "border border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </section>

        {/* Pickup list */}
        <MarketplaceOfferList
          title="Daftar Pickup"
          description="Semua request pickup yang relevan untuk akun ini"
          offers={offers}
          mode={profile.role === "COLLECTOR" ? "collector" : "viewer"}
          hidePendingCommercials={profile.role === "USER"}
        />
      </main>
    </div>
  );
}
