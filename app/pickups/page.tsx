import Link from "next/link";
import { PackageCheck } from "lucide-react";

import { MarketplaceOfferList } from "@/components/dashboard/marketplace-offer-list";
import { PickupAlertDialog } from "@/components/dashboard/pickup-alert-dialog";
import { Topbar } from "@/components/layout/topbar";
import { PickupFilters } from "@/components/records/records-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBanner } from "@/components/ui/status-banner";
import { requireProfile } from "@/lib/auth";
import { getPickupsForProfile } from "@/lib/data/records";

export default async function PickupsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const profile = await requireProfile();
  const resolvedSearchParams = await searchParams;
  const exportParams = new URLSearchParams();
  if (resolvedSearchParams?.status) {
    exportParams.set("status", resolvedSearchParams.status);
  }
  const offers = await getPickupsForProfile(profile.id, profile.role, {
    status: resolvedSearchParams?.status,
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
        {profile.role === "USER" ? <PickupAlertDialog pickups={offers} /> : null}
        <section className="mb-6">
          <StatusBanner
            tone="info"
            title="Aktivitas pickup siap dipantau"
            message="Halaman ini merangkum semua request pickup yang relevan untuk role aktif, lengkap dengan filter status dan ekspor CSV."
          />
        </section>

        <section className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <Badge variant="emerald" className="w-fit">
              <PackageCheck className="mr-2 h-3.5 w-3.5" />
              Pickup activity
            </Badge>
            <h1 className="text-4xl font-semibold text-white" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
              Aktivitas request pickup
            </h1>
            <p className="max-w-2xl text-slate-300">
              Gunakan halaman ini untuk menelusuri request berdasarkan status dan memperlihatkan proses matching,
              penjadwalan, hingga transaksi selesai.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href={`/api/export/pickups${exportParams.size ? `?${exportParams.toString()}` : ""}`}>
              <Button variant="outline">Export CSV</Button>
            </Link>
            <Link href="/transactions">
              <Button variant="outline">Lihat transaksi</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary">Kembali ke Dashboard</Button>
            </Link>
          </div>
        </section>

        <section className="mb-6">
          <PickupFilters selectedStatus={resolvedSearchParams?.status} />
        </section>

        <MarketplaceOfferList
          title="Daftar pickup"
          description="Semua request pickup yang relevan untuk role aktif"
          offers={offers}
          mode={profile.role === "COLLECTOR" ? "collector" : "viewer"}
          hidePendingCommercials={profile.role === "USER"}
        />
      </main>
    </div>
  );
}
